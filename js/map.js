function compare(property) {
    return function(a, b) {
        var value1 = a[property];
        var value2 = b[property];
        return value2 - value1;
    }
}

var w = 1250,
    h = 600,
    pad = 20,
    h2 = 150;
var tooltip = d3.select("body").append("div").attr("class", "toolTip");
var svg_3 = d3.select('#div-geo').append('svg')
    .attr('width', w)
    .attr('height', h)
var projection = d3.geoAlbersUsa()
    .scale([1200])
    .translate([w / 2, h / 2])
var svg2_3 = d3.select('#div-barchart').append('svg')
    .attr('id', 'barchart')
    .attr('width', w + 20)
    .attr('height', h2 + 40)
svg2_3.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0)
      .attr("x",0 - (h2 / 2 + 30))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Salary ($)");

svg2_3.append("text")
      .attr('id', 'rank')
      .attr("y", h2 + 20)
      .attr("x",(w / 2 + 30))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Ranks");
var path = d3.geoPath()
    .projection(projection);

function bars(data) {
    var l = data.length
    //console.log(data);
    max = data[0];
    var x = d3.scaleBand()
        .range([25, 50 * l + 25])
        .round(true)
        .domain(data.map(function(d, i) { return i + 1; }))

    var div = d3.select("body").append("div").attr("class", "toolTip");
    d3.select('#axis').call(d3.axisBottom(x));

    d3.select('#barchart').attr('width', Math.max(w + 20, 50 * data.length))
    d3.select('#rank')
    .transition().duration(1000).attr('x', 50 * data.length / 2 + 50)

    var vis = d3.select('#barchart')
    var bars = vis.selectAll('rect.bar')
        .data(data);
    bars.enter()
        .append("rect")
        .attr("class", "bar")
        .attr('x', function(d, i) { return 50 + 50 * i; })
        .attr('y', function(d) { return h2})
    bars.exit()
        .remove()

    vis.selectAll('rect.bar')
        .transition()
        .duration(1000)
        .style('fill', function(d) {
            //console.log(d3.select('#' + d['State']).style('fill'));
            return d3.select('#' + d['State']).style('fill');
        })
    .attr('x', function(d, i) { return 50 + 50 * i; })
        .attr('y', function(d) { return h2 - parseFloat(d['Starting Median Salary']) / 75000 * h2 })

        .attr('height', function(d) {
                return parseFloat(d['Starting Median Salary']) / 75000 * h2
            })
        .attr('width', 45)


    vis.selectAll('rect.bar')
        .on("mousemove", function(d) {
            tooltip
                .style("left", d3.event.pageX - 100 + "px")
                .style("top", d3.event.pageY - 100 + "px")
                .style("display", "inline-block")
                .html(d['School Name'] + "<br>" + "Start Salaries: " + parseInt(d['Starting Median Salary']).toLocaleString() + "<br>" + "Mid Salaries: " + parseInt(d['Mid-Career Median Salary']).toLocaleString());

            d3.select('#' + d['State'])
                .attr('stroke-width', '5px')
                .style('opacity', 1)
        })
        .on("mouseout", function(d) {
            tooltip.style("display", "none");
            d3.select('#' + d['State'])
                .attr('stroke-width', '1px')
                .style('opacity', 1);
        })


}
d3.json("data/usa2.json", function(error, world) {
    svg_3.append('path')
        .attr('class', 'graticule')
        .attr('d', path);
    svg_3.selectAll('path')
        .data(world.features)
        .enter()
        .append("path")
        .attr('class', 'path')
        .attr('id', function(d) { return d['properties']['abbr']; })
        .attr("fill", function(d, i) {
            return 'rgb(230,210,210)'
        })
        .attr('stroke', 'black')
        .attr('d', path);
    d3.csv("data/salaries.csv", function(error, data) {
        var state_map = {}
        var region_map = {}
        var state_data = d3.nest()
            .key(function(d) { return d['State']; })
            .entries(data);
        var region_data = d3.nest()
            .key(function(d) { return d['Region']; })
            .entries(data);
        //console.log(state_data);

        var avg_data = d3.nest()
            .key(function(d) { return d['State']; })
            .rollup(function(v) {
                return {
                    count: v.length,
                    avg_md: d3.mean(v, function(d) { return d['Mid-Career Median Salary']; }),
                    avg_st: d3.mean(v, function(d) { return d['Starting Median Salary']; })
                };
            })
            .entries(data);
        var region_avg_data = d3.nest()
            .key(function(d) { return d['Region']; })
            .rollup(function(v) {
                return {
                    count: v.length,
                    avg_md: d3.mean(v, function(d) { return d['Mid-Career Median Salary']; }),
                    avg_st: d3.mean(v, function(d) { return d['Starting Median Salary']; })
                };
            })
            .entries(data);
        //console.log(region_avg_data);


        for (i = 0; i < state_data.length; i++) {
            state_map[state_data[i].key] = i
        }

        for (i = 0; i < region_data.length; i++) {
            region_map[region_data[i].key] = i
        }

        for (i = 0; i < state_data.length; i++) {
            d3.select('#' + state_data[i]['values'][0]['State'])
                .attr('class', state_data[i]['values'][0]['Region'])
            state_map[state_data[i].key] = i
        }

        function byState() {
            d3.select('#map_legend').style("display", "inline");
            d3.select('#map_legend_2').style("display", "inline");
            for (i = 0; i < avg_data.length; i++) {
                res = parseInt(((avg_data[i]['value']['avg_st']) - 40000) / 20000 * 255);
                temp = avg_data[i]['value']['avg_st'];
                var color = d3.scaleOrdinal(d3.schemeCategory20c);
                d3.select('#' + avg_data[i]['key'])
                    .style('stroke', function(d) {
                        d['avg_st'] = temp;
                        d['avg_md'] = avg_data[i]['value']['avg_md'];
                        d['color'] = 'rgb(' + (res - 100) + ',' + res + ', ' + res + ')'
                        return 'black'
                    })
                    .on("click touchstart", function(d) {
                        for (i = 0; i < avg_data.length; i++) {
                            d3.select('#' + avg_data[i]['key'])
                                .style('fill', function(d) { return d['color'] })
                        }
                        // console.log('#' + d3.select(this).attr('id'))
                        d3.select('#' + d3.select(this).attr('id'))
                            .style('fill', function(d, i) {
                                return color(i);
                            })
                            .style('stroke-width', '5px')
                        var current = state_data[state_map[d.properties.abbr]];
                        var current_state = current['key'];
                        var colleges = current['values'];
                        colleges.sort(compare('Starting Median Salary'));
                        // console.log(current_state);
                        // console.log(colleges);
                        // console.log(state_data[state_map[d.properties.abbr]]);
                        bars(colleges);
                    })
                    .on("mousemove", function(d) {
                        tooltip
                            .style("left", d3.event.pageX - 100 + "px")
                            .style("top", d3.event.pageY - 100 + "px")
                            .style("display", "inline-block")
                            .html(d['properties']['NAME'] + "<br>" + "Start Salaries: " + parseInt(d['avg_st']).toLocaleString() + "<br>" + "Mid Salaries: " + parseInt(d['avg_md']).toLocaleString());
                    })
                    .on("mouseout", function(d) {
                        tooltip.style("display", "none");
                        d3.select('#' + d3.select(this).attr('id'))
                            .style('stroke-width', '1px')
                    })
                    .style('fill', 'rgb(' + (res-100) + ',' + res + ', ' + res + ')')

            }
        }

        function byRegion() {
            d3.select('#map_legend').style("display", "none");
            d3.select('#map_legend_2').style("display", "none");
            for (i = 0; i < region_avg_data.length; i++) {
                res = parseInt((region_avg_data[i]['value']['avg_st'] - 42000) / 18000 * 255);
                temp = region_avg_data[i]['value']['avg_st'];
                temp2 = region_avg_data[i]['key'];
                var color = d3.scaleOrdinal(d3.schemeCategory20c);
                d3.selectAll('.' + region_avg_data[i]['key'])
                    .style('stroke', function(d) {
                        d['avg_st'] = temp;
                        d['avg_md'] = avg_data[i]['value']['avg_md'];
                        d['color'] = 'rgb(' + (res - 100) + ',' + res + ', ' + res + ')'
                        return 'black'
                    })
                    .style('fill', 'grey')
                    .on("click touchstart", function(d) {
                        for (i = 0; i < region_avg_data.length; i++) {
                            d3.selectAll('.' + region_avg_data[i]['key'])
                                .style('fill', 'grey')
                                
                                .transition()
                        }
                        d3.selectAll('.' + d3.select(this).attr('class'))
                            .style('fill', function(d, i) {
                                return color(i);
                            })
                            .style('opacity', 1)
                            .transition()
                        var current = region_data[region_map[d3.select(this).attr('class')]];
                        var current_state = current['key'];
                        var colleges = current['values'];
                        colleges.sort(compare('Starting Median Salary'));
                        // console.log(current_state);
                        // console.log(colleges);
                        // console.log(state_data[state_map[d.properties.abbr]]);
                        bars(colleges);
                    })
                    .on("mousemove", function(d) {
                        d3.selectAll('.' + d3.select(this)
                                .attr('class')).style('opacity', 0.9)
                            .attr('stroke-width', '3px')
                        tooltip
                            .style("left", d3.event.pageX - 100 + "px")
                            .style("top", d3.event.pageY - 100 + "px")
                            .style("display", "inline-block")
                            .html(d3.select(this).attr('class') + "<br>" + "Start Salaries: " + parseInt(d['avg_st']).toLocaleString() + "<br>" + "Mid Salaries: " + parseInt(d['avg_md']).toLocaleString());


                    })
                    .on("mouseout", function(d) {
                        d3.selectAll('.' + d3.select(this).attr('class'))
                            .style('opacity', 1)
                            // .style('fill', function(d){return d['color']})
                            .attr('stroke-width', '1px')
                        tooltip.style("display", "none");
                    })


            }
        }
        byState();
        d3.select('#button-state')
            .on('click', function(d) {
                byState();
            })
        d3.select('#button-region')
            .on('click', function(d) {
                byRegion();
            })
        // console.log(data);
        var x = d3.scaleBand()
            .range([0, w - 40])
            .round(true)
            .domain(state_data.map(function(d) { return ''; }))
            .padding(0.1);

        var y = d3.scaleLinear()
            .domain([0, 60])
            .range([h2, 0]);

        var main = svg2_3.append('g')
            .attr('transform', 'translate(' + 20 + ',' + 0 + ')')

        main.append("g")
            .attr('id', 'axis')
            .attr("transform", "translate(0," + (h2) + ")")
            .call(d3.axisBottom(x));


        main.append("text")
            // .attr("y", h -100)
            // .attr("x", w- 100)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .attr('transform', 'translate(820, 470) rotate(' + 90 + ')')
            .text("Country");
        var g = svg_3.append('g').attr('id','map_legend');
          var myScale = d3.scaleLinear()
                          .domain([0, 10])
                          .range([40000, 70000])
          g.selectAll('rect')
            .data([0,1,2,3,4,5,6,7,8,9,10])
            .enter()
            .append('rect')
            .attr('x', function(d){return 20 *(d + 33);})
            .attr('y', h - 40)
            .attr('width', function(d){return 20})
            .attr('height', 20)
            .style('fill', function(d){
              var res = parseInt((d) * 3000 / 20000 * 255);
              console.log(res);

              return 'rgb(' + (res - 100) + ',' + res  + ', ' + res + ')'
            })
          var g = svg_3.append('g').attr('id','map_legend_2');
          g.selectAll('text')
            .data([0,3,7,10])
            .enter()
            .append('text')
            .style('text-anchor', 'middle')
            .attr('x', function(d){return 20 *(d + 33);})
            .attr('y', h - 50)
            .text(function(d){return parseInt(myScale(d)).toLocaleString()});

          g.selectAll('rect')
            .data([0,3,7,10])
            .enter()
            .append('rect')
            .attr('x', function(d){return 20 *(d + 33);})
            .attr('y', h - 44)
            .attr('width', function(d){return 3})
            .attr('height', 24)
            .text(function(d){return parseInt(myScale(d))})

        //console.log(avg_data)
    });
});