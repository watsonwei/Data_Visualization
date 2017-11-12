var svg = d3.select("svg#svg_1"),
    margin = {top: 50, right: 20, bottom: 200, left: 60},
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom,
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");


var x = d3.scaleBand()
    .rangeRound([0, width])
    .paddingInner(0.05)
    .align(0.1);

var y = d3.scaleLinear()
    .range([height, 0]);

var color = d3.scaleOrdinal()
    .domain(d3.range(2))
    .range(d3.schemeCategory20c);

var grouped = false;

d3.csv("../data/degrees-that-pay-back.csv",function(d,i,columns){
    d.major = d[columns[0]];
    d.start = parseInt(d[columns[1]]);
    d.mid = parseInt(d[columns[2]]);
  
    for (i = 1, t = 0; i < 3; ++i) t += d[columns[i]] = +d[columns[i]];
    d.total = t;
    return d;
  },     
  function(error, data) {
    if (error) throw error;
    
    var keys = data.columns.slice(1,3);
  
    data.sort(function(a, b) { return b.start - a.start; });
    x.domain(data.map(function(d) { return d.major; }));
    y.domain([0, d3.max(data, function(d) { return d.total;})]).nice();
  
    g.append("g")
      .selectAll("g")
      .data(d3.stack().keys(keys)(data))
      .enter().append("g")
        .attr("fill", function(d,i) { return color(i); })
      .selectAll("rect")
      .data(function(d) { return d; })
      .enter().append("rect")
        .attr("x", function(d) { return x(d.data.major); })
        .attr("y", function(d) { return y(d[1]); })
        .attr("height", function(d) {return y(d[0])-y(d[1]); })
        .attr("width", x.bandwidth())
        .classed("barchart", true)
        .on("mouseover", function(d) {
        d3.select("#tooltip")
            .style("left", (d3.event.pageX)+ "px")
            .style("top", (d3.event.pageY-100) + "px")
            .select("#value")
            .text("$"+(d[1]-d[0]).toLocaleString())
            .attr("fill","black");
        d3.select("#tooltip").classed("hidden", false)})
      .on("mouseout", function() {
          d3.select("#tooltip").classed("hidden", true);
      });

  
    g.append("g")
      .attr("class", "x_axis")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("x",-9)
      .attr("y",0)
      .attr("dy", "0.35em")
      .attr("transform", "rotate(-90)")
      .style("text-anchor", "end")
      .classed("label", true);

  g.append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(y).ticks(null, "s"))
    .append("text")
      .attr("x", 2)
      .attr("y", y(y.ticks().pop()) + 0.5)
      .attr("dy", "0.32em")
      .attr("fill", "#000")
      .attr("font-weight", "bold")
      .attr("text-anchor", "start")

  var legend = g.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "end")
    .selectAll("g")
    .data(keys.slice())
    .enter().append("g")
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

  legend.append("rect")
      .attr("x", width - 19)
      .attr("width", 19)
      .attr("height", 19)
      .attr("fill",function(d,i) { return color(i); });

  legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9.5)
      .attr("dy", "0.32em")
      .text(function(d) { return d; });
  
  svg.append("text")             
      .attr("transform",
            "translate(" + (width/2) + " ," + 
                           (height + 220) + ")")
      .style("text-anchor", "middle")
      .text("Major");
  
  svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0)
      .attr("x",0 - (height / 2 + 30))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Salary ($)");
  
  //handle button clicks
  
  d3.select("#start_btn").on("click", function () {
    document.getElementById("start_btn").setAttribute("disabled","true");
    document.getElementById("alpha_btn").removeAttribute("disabled");
    document.getElementById("mid_btn").removeAttribute("disabled");
    
    data.sort(
      function (a, b) {
        return b.start - a.start; 
      }
    );
    x.domain(data.map(function (d) { return d.major; }));
    sort_bars(grouped);
  });
  
  d3.select("#mid_btn").on("click", function () {
    document.getElementById("mid_btn").setAttribute("disabled","true");
    document.getElementById("start_btn").removeAttribute("disabled");
    document.getElementById("alpha_btn").removeAttribute("disabled");
    
    data.sort(
      function (a, b) {
        return b.mid - a.mid;
      }
    );
    x.domain(data.map(function (d) { return d.major; }));
    sort_bars(grouped);
  });
  
  d3.select("#alpha_btn").on("click", function () {
    document.getElementById("alpha_btn").setAttribute("disabled","true");
    document.getElementById("start_btn").removeAttribute("disabled");
    document.getElementById("mid_btn").removeAttribute("disabled");
    
    data.sort(
      function (a, b) {
        if (a.major < b.major) {
          return -1;
        }
        else if (a.major > b.major) {
          return 1;
        }
        else{
          return 0;
        }
      }
    )
    x.domain(data.map(function (d) { return d.major; }));
    sort_bars(grouped);
  });
  
  function sort_bars(grouped) {
    //transition bars for cases where only the scale changes (no add/remove)
    var transition = svg.transition()
        .duration(750);

    var tick_delay = function (d, i) {
        return i * 100;
    };
    
    if(!grouped){
      transition.selectAll(".barchart")
          .delay(0)
          .attr("x", function (d) {
              return x(d.data.major);
          });
    }else{
      transition.selectAll(".barchart")
          .delay(0)
          .attr("x", function(d, i) { return x(d.data.major)+x.bandwidth()/n *(this.parentNode.__data__.index+1);});
    }

    var xAxis = d3.axisBottom()
      .scale(x);

    transition.selectAll(".x_axis")
        .delay(tick_delay)
        .call(xAxis)
        .selectAll(".label")
        .attr("y",0);
  }
  
  d3.selectAll("input")
    .on("change", changed);
  
  var timeout = d3.timeout(function() {
    d3.select("input[value=\"grouped\"]")
        .property("checked", true)
        .dispatch("change");
  }, 2000);
  
  function changed() {
    timeout.stop();
    if (this.value === "grouped") transitionGrouped();
    else transitionStacked();
  }
  
  var n = 4;
  
  function transitionGrouped() {
    grouped = true
    d3.selectAll(".barchart")
      .transition()
        .duration(500)
        .delay(function(d, i) { return i * 10; })
        .attr("x", function(d, i) { return x(d.data.major)+x.bandwidth()/n *(this.parentNode.__data__.index+1)})
        .attr("width", x.bandwidth() / n)
      .transition()
        .attr("y", function(d) { return y(d[1]-d[0]); })
        .attr("height", function(d) { return y(d[0]) - y(d[1]); });
  }

  function transitionStacked() {
    grouped = false
    d3.selectAll(".barchart")
      .transition()
        .duration(500)
        .delay(function(d, i) { return i * 10; })
        .attr("y", function(d) { return y(d[1]); })
        .attr("height", function(d) { return y(d[0]) - y(d[1]); })
      .transition()
        .attr("x", function(d, i) { return x(d.data.major); })
        .attr("width", x.bandwidth());
  }
});

