var svg = d3.select("svg#svg_1"),
    margin = {top: 20, right: 20, bottom: 200, left: 40},
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom,
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var x = d3.scaleBand()
    .rangeRound([0, width])
    .paddingInner(0.05)
    .align(0.1);

var y = d3.scaleLinear()
    .rangeRound([height, 0]);

var color = d3.scaleOrdinal()
    .domain(d3.range(2))
    .range(d3.schemeCategory20c);

d3.csv("../data/degrees-that-pay-back.csv",function(d,i,columns){
    d.major = d[columns[0]];
    d.start = d[columns[1]];
    d.mid = d[columns[2]];
  
    for (i = 1, t = 0; i < 3; ++i) t += d[columns[i]] = +d[columns[i]];
    d.total = t;
    return d;
  },     
  function(error, data) {
    if (error) throw error;
    
    var keys = data.columns.slice(1,3);
  
    data.sort(function(a, b) { return b.start - a.start; });
    x.domain(data.map(function(d) { return d.major; }));
    y.domain([0, d3.max(data, function(d) { return d.total; })]).nice();
  
    g.append("g")
      .selectAll("g")
      .data(d3.stack().keys(keys)(data))
      .enter().append("g")
        .attr("fill", function(d,i) { return color(i); })
      .selectAll("rect")
      .data(function(d) { console.log(d);return d; })
      .enter().append("rect")
        .attr("x", function(d) { return x(d.data.major); })
        .attr("y", function(d) { return y(d[1]); })
        .attr("height", function(d) { return y(d[0]) - y(d[1]); })
        .attr("width", x.bandwidth());
  
    g.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("x",-9)
      .attr("y",0)
      .attr("dy", "0.35em")
      .attr("transform", "rotate(-90)")
      .style("text-anchor", "end");;

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
      .text("Salary");

  var legend = g.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "end")
    .selectAll("g")
    .data(keys.slice().reverse())
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
  }
);
        