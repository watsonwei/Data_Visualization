var margin_2 = {top: 66, right: 110, bottom: 20, left: 188},
    width_2= 1200 - margin_2.left - margin_2.right,
    height_2= 550 - margin_2.top - margin_2.bottom,
    innerHeight= height_2- 2;
// console.log(document.body.clientWidth);
var devicePixelRatio = window.devicePixelRatio || 1;

//var color = d3.scaleOrdinal()
//  .range(["#5DA5B3","#D58323","#DD6CA7","#54AF52","#8C92E8","#E15E5A","#725D82","#776327","#50AB84","#954D56","#AB9C27","#517C3F","#9D5130","#357468","#5E9ACF","#C47DCB","#7D9E33","#DB7F85","#BA89AD","#4C6C86","#B59248","#D8597D","#944F7E","#D67D4B","#8F86C2"]);


var color_p = d3.scaleOrdinal().range(d3.schemeSpectral[10]);


var types = {
  "Number": {
    key: "Number",
    coerce: function(d) { return +d; },
    extent: d3.extent,
    within: function(d, extent, dim) { return extent[0] <= dim.scale(d) && dim.scale(d) <= extent[1]; },
    defaultScale: d3.scaleLinear().range([innerHeight, 0])
  },
  "String": {
    key: "String",
    coerce: String,
    extent: function (data) { return data.sort(); },
    within: function(d, extent, dim) { return extent[0] <= dim.scale(d) && dim.scale(d) <= extent[1]; },
    defaultScale: d3.scalePoint().range([0, innerHeight])
  }
};

var dimensions = [
  {
    key: "Undergraduate Major",
    description: "Major",
    type: types["String"],
    axis: d3.axisLeft()
      .tickFormat(function(d,i) {
        return d;
      })
  },
  {
    key: "Mid-Career 10th Percentile Salary",
    description: "10th Percentile Salary",
    type: types["Number"],
    scale: d3.scaleSqrt().range([innerHeight, 0])
  },
  {
    key: "Mid-Career 25th Percentile Salary",
    description: "25th Percentile Salary",
    type: types["Number"],
    scale: d3.scaleSqrt().range([innerHeight, 0])
  },
  {
    key: "Mid-Career 75th Percentile Salary",
    description: "75th Percentile Salary",
    type: types["Number"],
    scale: d3.scaleSqrt().range([innerHeight, 0])
  },
  {
key: "Mid-Career 90th Percentile Salary",
    description: "90th Percentile Salary",
    type: types["Number"],
    scale: d3.scaleSqrt().range([innerHeight, 0])
  }
];

var xscale = d3.scalePoint()
    .domain(d3.range(dimensions.length))
    .range([0, width_2]);
var yAxis = d3.axisLeft();

var container = d3.select("#svg_2").append("div")
    .attr("class", "parcoords")
    .style("width", width_2+ margin_2.left + margin_2.right + "px")
    .style("height", height_2+ margin_2.top + margin_2.bottom + "px");

var svg_p = container.append("svg")
    .attr("width", width_2+ margin_2.left + margin_2.right)
    .attr("height", height_2+ margin_2.top + margin_2.bottom)
  .append("g")
    .attr("transform", "translate(" + margin_2.left + "," + margin_2.top + ")")
    .attr("preserveAspectRatio","xMinYMin meet")
  .classed("svg-content",true);

var canvas = container.append("canvas")
    .attr("width", width_2* devicePixelRatio)
    .attr("height", height_2* devicePixelRatio)
    .style("width", width_2+ "px")
    .style("height", height_2+ "px")
    .style("margin-top", margin_2.top + "px")
    .style("margin-left", margin_2.left + "px");

var ctx = canvas.node().getContext("2d");
ctx.globalCompositeOperation = 'darken';
ctx.globalAlpha = 0.15;
ctx.linewidth = 1.5;
ctx.scale(devicePixelRatio, devicePixelRatio);
var header=d3.select("body").append("h3");
var count = 0;
var axes = svg_p.selectAll(".axis")
    .data(dimensions)
  .enter().append("g")
    .attr("class", function(d) { return "axis " + d.key.replace(/ /g, "_"); })
    .attr("transform", function(d,i) { return "translate(" + xscale(i) + ")"; });

d3.csv("data/degrees-that-pay-back.csv",
       function(d,i,columns){
       
           delete d["Starting Median Salary"];
           delete d["Mid-Career Median Salary"];
           delete d["Percent change from Starting to Mid-Career Salary"];
            
//    console.log(d,count)
    return d;
        }, 
       function(error,data) {
    // console.log(data);
  if (error) throw error;
  data.forEach(function(d) {
    dimensions.forEach(function(p) {
      d[p.key] = !d[p.key] ? null : p.type.coerce(d[p.key]);
    });

    // truncate long text strings to fit in data table
    for (var key in d) {
      if (d[key] && d[key].length > 35) d[key] = d[key].slice(0,36);
    }
  });

  // type/dimension default setting happens here
  dimensions.forEach(function(dim) {
    if (!("domain" in dim)) {
      // detect domain using dimension type's extent function
      dim.domain = d3_functor(dim.type.extent)(data.map(function(d) { return d[dim.key]; }));
    }
    if (!("scale" in dim)) {
      // use type's default scale for dimension
      dim.scale = dim.type.defaultScale.copy();
    }
    dim.scale.domain(dim.domain);
  });

  var render = renderQueue(draw).rate(50);
  var table = d3.select("#table_div").append("table").attr("id","data_table");
  ctx.clearRect(0,0,width_2,height_2);
  ctx.globalAlpha = d3.min([0.85/Math.pow(data.length,0.3),1]);
  render(data);

  axes.append("g")
      .each(function(d) {
        var renderAxis = "axis" in d
          ? d.axis.scale(d.scale)  // custom axis
          : yAxis.scale(d.scale);  // default axis
        d3.select(this).call(renderAxis);
      })
    .append("text")
      .attr("class", "title")
      .attr("text-anchor", "start")
      .text(function(d) { return "description" in d ? d.description : d.key; });

  // Add and store a brush for each axis.
  axes.append("g")
      .attr("class", "brush")
      .each(function(d) {
        d3.select(this).call(d.brush = d3.brushY()
          .extent([[-10,0], [10,height_2]])
          .on("start", brushstart)
          .on("brush", brush)
          .on("end", brush)
        )
      })
    .selectAll("rect")
      .attr("x", -8)
      .attr("width", 16);

  d3.selectAll(".axis.Undergraduate_Major .tick text")
    .style("fill", color_p);
//  header.text(d3.tsvFormat(data.slice(0)));
    // console.log(data[0]);
    //table function
    var makeATable = function (data,columns) {
    // console.log(columns);
	var thead = table.append('thead');
	var tbody = table.append('tbody');

	thead.append('tr')
	  .selectAll('th')
	    .data(columns)
	    .enter()
	  .append('th')
	    .text(function (d) { return d });

	var rows = tbody.selectAll('tr')
	    .data(data)
	    .enter()
	  .append('tr');

	var cells = rows.selectAll('td')
	    .data(function(row) {
	    	return columns.map(function (column) {
	    		return { column: column, value: row[column].toLocaleString() }
	      })
      })
      .enter()
    .append('td')
      .text(function (d) { return d.value });
//keep header fixed
  return table;
}
var columns = ["Undergraduate Major","Mid-Career 10th Percentile Salary","Mid-Career 25th Percentile Salary","Mid-Career 75th Percentile Salary","Mid-Career 90th Percentile Salary"];
  makeATable(data,columns);
//  output.text(d3.tsvFormat(data.slice(1,50)));

  function project(d) {
    return dimensions.map(function(p,i) {
      // check if data element has property and contains a value
      if (
        !(p.key in d) ||
        d[p.key] === null
      ) return null;

      return [xscale(i),p.scale(d[p.key])];
    });
  };

  function draw(d) {
    ctx.strokeStyle = color_p(d["Undergraduate Major"]);
    ctx.beginPath();
    var coords = project(d);
    coords.forEach(function(p,i) {
      // this tricky bit avoids rendering null values as 0
      if (p === null) {
        // this bit renders horizontal lines on the previous/next
        // dimensions, so that sandwiched null values are visible
        if (i > 0) {
          var prev = coords[i-1];
          if (prev !== null) {
            ctx.moveTo(prev[0],prev[1]);
            ctx.lineTo(prev[0]+6,prev[1]);
          }
        }
        if (i < coords.length-1) {
          var next = coords[i+1];
          if (next !== null) {
            ctx.moveTo(next[0]-6,next[1]);
          }
        }
        return;
      }
      
      if (i == 0) {
        ctx.moveTo(p[0],p[1]);
        return;
      }

      ctx.lineTo(p[0],p[1]);
    });
    ctx.stroke();
  }

  function brushstart() {
    d3.event.sourceEvent.stopPropagation();
  }

  // Handles a brush event, toggling the display of foreground lines.
  function brush() {
    render.invalidate();

    var actives = [];
    svg_p.selectAll(".axis .brush")
      .filter(function(d) {
        return d3.brushSelection(this);
      })
      .each(function(d) {
        actives.push({
          dimension: d,
          extent: d3.brushSelection(this)
        });
      });

    var selected = data.filter(function(d) {
      if (actives.every(function(active) {
          var dim = active.dimension;
          // test if point is within extents for each active brush
          return dim.type.within(d[dim.key], active.extent, dim);
        })) {
        return true;
      }
    });
    ctx.clearRect(0,0,width_2,height_2);
    ctx.globalAlpha = d3.min([0.85/Math.pow(selected.length,0.3),1]);
    render(selected);
  document.getElementById("data_table").innerHTML = "";
  makeATable(selected,columns);
  }
});

function d3_functor(v) {
  return typeof v === "function" ? v : function() { return v; };
};