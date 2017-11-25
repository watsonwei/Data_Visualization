
    function compare(property) {
        return function(a, b) {
            var value1 = a[property];
            var value2 = b[property];
            return value2 - value1;
        }
    }

    var w = 960,
        h = 600,
        pad = 20,
        h2 = 200;
    var tooltip = d3.select("body").append("div").attr("class", "toolTip");
    var svg = d3.select('#div-geo').append('svg')
        .attr('width', w)
        .attr('height', h)
    var projection = d3.geoAlbersUsa()
        .scale([1200])
        .translate([w / 2, h / 2])
    var svg2 = d3.select('#div-barchart').append('svg')
        .attr('id', 'barchart')
        .attr('width', 1500 + 20)
        .attr('height', h2 + 20)

    var path = d3.geoPath()
        .projection(projection);

    function bars(data) {
        var l = data.length
        console.log(data);
        max = data[0];
        var x = d3.scaleBand()
            .range([25, 50 * l + 25])
            .round(true)
            .domain(data.map(function(d, i) { return i; }))

        var div = d3.select("body").append("div").attr("class", "toolTip");
        d3.select('#axis').call(d3.axisBottom(x));

        var vis = d3.select('#barchart')
        var bars = vis.selectAll('rect.bar')
            .data(data);
        bars.enter()
        .append("rect")
        .attr("class","bar")
        .attr('x', function (d, i) {return 50 + 50 * i})
        .attr('y', h2);

        bars.exit()
            .attr("width", 0)
            .remove()

        vis.selectAll('rect.bar')
            .attr("class", "bar")
            .attr('height', function(d) { 
              return parseFloat(d['Starting Median Salary']) / 75000 * h2 })
            .attr('width', 45)
            .attr('x', function(d, i) { return 50 + 50 * i; })
            .attr('y', function(d) { return h2 - parseFloat(d['Starting Median Salary']) / 75000 * h2})
            .on("mousemove", function(d) {
                tooltip
                    .style("left", d3.event.pageX - 100 + "px")
                    .style("top", d3.event.pageY - 100 + "px")
                    .style("display", "inline-block")
                    .html(d['School Name'] + "<br>" + "Start Salaries: " + parseInt(d['Starting Median Salary']).toLocaleString() + "<br>" + "Mid Salaries: " + parseInt(d['Mid-Career Median Salary']).toLocaleString());

                d3.select('#' + d['State'])
                    .attr('stroke-width', '6px')
                    .style('opacity', 0.9)
            })
            .on("mouseout", function(d) { 
              tooltip.style("display", "none");
              d3.select('#' + d['State'])
                    .attr('stroke-width', '1px')
                    .style('opacity', 1);})


    }
    d3.json("/data/usa2.json", function(error, world) {
        svg.append('path')
            .attr('class', 'graticule')
            .attr('d', path);
        svg.selectAll('path')
            .data(world.features)
            .enter()
            .append("path")
            .attr('id', function(d) { return d['properties']['abbr']; })
            .attr("fill", function(d, i) {
                return 'rgb(230,210,210)'
            })
            .attr('stroke', 'black')
            .attr('d', path);
        d3.csv("/data/salaries.csv", function(error, data) {
            var state_map = {}
            var region_map = {}
            var state_data = d3.nest()
                .key(function(d) { return d['State']; })
                .entries(data);
            var region_data = d3.nest()
                .key(function(d) { return d['Region']; })
                .entries(data);
            console.log(state_data);

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
            console.log(region_avg_data);


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
                for (i = 0; i < avg_data.length; i++) {
                    res = parseInt((avg_data[i]['value']['avg_st']) / 60000 * 255);
                    temp = avg_data[i]['value']['avg_st'];
                    d3.select('#' + avg_data[i]['key'])
                        .style('stroke', function(d) {
                            d['avg_st'] = temp;
                            d['avg_md'] = avg_data[i]['value']['avg_md'];
                            return 'black'
                        })
                        .on("click", function(d) {
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
                        .on("mouseout", function(d) { tooltip.style("display", "none"); })
                        .style('fill', 'rgb(' + res + ',' + res + ', ' + res + ')')

                }
            }

            function byRegion() {
                for (i = 0; i < region_avg_data.length; i++) {
                    res = parseInt((region_avg_data[i]['value']['avg_st'] - 40000) / 20000 * 255);
                    temp = region_avg_data[i]['value']['avg_st'];
                    temp2 = region_avg_data[i]['key'];
                    d3.selectAll('.' + region_avg_data[i]['key'])
                        .style('stroke', function(d) {
                            d['avg_st'] = temp;
                            d['avg_md'] = avg_data[i]['value']['avg_md'];
                            return 'black'
                        })
                        .style('fill', 'rgb(' + (res - 100) + ',' + res + ', ' + res + ')')
                        .on("click", function(d) {
                            d3.selectAll('.' + d3.select(this).attr('class')).style('opacity', 0.9).attr('stroke-width', '5px')
                            console.log(parseInt(d['avg_st']).toLocaleString())
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
                            tooltip
                                .style("left", d3.event.pageX - 100 + "px")
                                .style("top", d3.event.pageY - 100 + "px")
                                .style("display", "inline-block")
                                .html(d3.select(this).attr('class') + "<br>" + "Start Salaries: " + parseInt(d['avg_st']).toLocaleString() + "<br>" + "Mid Salaries: " + parseInt(d['avg_md']).toLocaleString());
                            d3.selectAll('.' + d3.select(this).attr('class')).style('opacity', 1).attr('stroke-width', '1px')

                        })
                        .on("mouseout", function(d) { tooltip.style("display", "none"); })


                }
            }
            byState();
            d3.select('#button-state')
                .on('click', function(d){
                  byState();
                })
            d3.select('#button-region')
                .on('click', function(d){
                  byRegion();
                })
            console.log(data);
            var x = d3.scaleBand()
                .range([0, w - 40])
                .round(true)
                .domain(state_data.map(function(d) { return d["key"]; }))
                .padding(0.1);

            var y = d3.scaleLinear()
                .domain([0, 60])
                .range([h2, 0]);

            var main = svg2.append('g')
                .attr('transform', 'translate(' + 20 + ',' + 0 + ')')

            main.append("g")
                .attr('id', 'axis')
                .attr("transform", "translate(0," + (h2) + ")")
                .call(d3.axisBottom(x));


            // main.append("text")
            //     .attr("y", -20)
            //     .attr("x", 40)
            //     .attr("dy", "1em")
            //     .style("text-anchor", "middle")
            //     .style('color', '#FFF')
            //     .text("Mortality rate");

            main.append("text")
                // .attr("y", h -100)
                // .attr("x", w- 100)
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .attr('transform', 'translate(820, 470) rotate(' + 90 + ')')
                .text("Country");

            console.log(avg_data)
        });
    });