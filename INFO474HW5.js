'use strict';

(function() {

  let data = "no data";
  let svgContainer = ""; 

  // load data and make scatter plot after window loads
  window.onload = function() {
    svgContainer = d3.select('body')
      .append('svg')
      .attr('width', 750)
      .attr('height', 500);
    d3.csv("gapminder.csv")
      .then((data) => makeScatterPlot(data));
  }

  // make scatter plot with tool tips
  function makeScatterPlot(csvData) {
    data = csvData 
    const originalData = data;

    data = data.filter(d => d['year'] == "1980");

    // get arrays of fertility rate data and life Expectancy data
    let fertility_rate_data = data.map((row) => parseFloat(row["fertility"]));
    let life_expectancy_data = data.map((row) => parseFloat(row["life_expectancy"]));

    // find data limits
    let axesLimits = findMinMax(fertility_rate_data, life_expectancy_data);

    // draw axes and return scaling + mapping functions
    let mapFunctions = drawAxes(axesLimits, "fertility", "life_expectancy");

    // plot data as points and add tooltip functionality
    plotData(mapFunctions, originalData);

    // draw title and axes labels
    makeLabels();

  }

  // make title and axes labels
  function makeLabels() {
    svgContainer.append('text')
      .attr('x', 275)
      .attr('y', 490)
      .style('font-size', '10pt')
      .text('Fertility Rates (Avg Children per Woman)');

    svgContainer.append('text')
      .attr('transform', 'translate(15, 300)rotate(-90)')
      .style('font-size', '10pt')
      .text('Life Expectancy (years)');
  }

  // plot all the data points on the SVG
  // and add tooltip functionality
  function plotData(map, originalData) {
    // get population data as array
    let pop_data = data.map((row) => +row["population"]);
    let pop_limits = d3.extent(pop_data);
    // make size scaling function for population
    let pop_map_func = d3.scaleLinear()
      .domain([pop_limits[0], pop_limits[1]])
      .range([3, 20]);

    // mapping functions
    let xMap = map.x;
    let yMap = map.y;

    // make tooltip
    let div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);



    // append data to SVG and plot as points
    svgContainer.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
        .attr('cx', xMap)
        .attr('cy', yMap)
        .attr('r', (d) => pop_map_func(d["population"]))
        .attr('fill', "#4286f4")
        .attr('class', 'dot')
        // add tooltip functionality to points
        .on("mouseover", (d) => {
          div.transition()
            .duration(200)
            .style("opacity", .9);
          div.html(d.country + "<br/>")
            .style("left", (d3.event.pageX + 20) + "px")
            .style("top", (20) + "px");
          // add SVG to tooltip
          let tipSVG = d3.select(".tooltip")
            .append("svg")
            .attr("width", 550)
            .attr("height", 550)

          let currentCountry = d.country;

          // make line graph within tooltip of population over time for given country
          makeLineGraph(data, tipSVG, originalData, currentCountry);
        })
        .on("mouseout", (d) => {
          div.transition()
            .duration(500)
            .style("opacity", 0);
        });

        // adds labels to certain countries
        data = data.filter(d => d['population'] >= 100000000);
        console.log(data);
        svgContainer.selectAll('.text')
          .data(data)
          .enter()
          .append('text')
          .attr('x', xMap)
          .attr('y', yMap)
          .style('font-size', '10pt')
          .text(d => d.country)
          .attr('transform', 'translate(20, 5)');

  }

  // draw the axes and ticks
  function drawAxes(limits, x, y) {
    // return x value from a row of data
    let xValue = function(d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin - 0.5, limits.xMax + 0.5]) // give domain buffer room
      .range([50, 700]);

    // xMap returns a scaled x value from a row of data
    let xMap = function(d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    svgContainer.append("g")
      .attr('transform', 'translate(0, 450)')
      .call(xAxis);

    // return y value from a row of data
    let yValue = function(d) { return +d[y]}

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax + 5, limits.yMin - 5]) // give domain buffer
      .range([50, 450]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svgContainer.append('g')
      .attr('transform', 'translate(50, 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  // find min and max for arrays of x and y
  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin : xMin,
      xMax : xMax,
      yMin : yMin,
      yMax : yMax
    }
  }

  // format numbers
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }


  // Section for creating line graph
  function makeLineGraph(csvData, lineSVG, originalData, currentCountry) {
    data = originalData // assign data as global variable

    // filters original data by country and valid population data
    data = data.filter(d => d['country'] == currentCountry);
    data = data.filter(d => d['population'] != "NA");

    // get arrays of year and population data
    let year_data = data.map((row) => parseFloat(row["year"]));
    let pop_data = data.map((row) => parseFloat(row["population"]));

    // find data limits
    let axesLimits = findMinMax(year_data, pop_data);

    // draw axes and return scaling + mapping functions
    let mapFunctions = drawLineAxes(axesLimits, "year", "population", lineSVG);

    // plot data as points and add tooltip functionality
    plotLineData(mapFunctions, lineSVG, data);

    // draw title and axes labels
    makeLineLabels(lineSVG);

  }

  // make title and axes labels
  function makeLineLabels(lineSVG) {
    lineSVG.append('text')
      .attr('x', 100)
      .attr('y', 30)
      .style('font-size', '14pt')
      .text("Population over Time");

    lineSVG.append('text')
      .attr('x', 275)
      .attr('y', 490)
      .style('font-size', '10pt')
      .text('Year');

    lineSVG.append('text')
      .attr('transform', 'translate(15, 300)rotate(-90)')
      .style('font-size', '10pt')
      .text('Population');
  }

  // plots line of population over time for given country
  function plotLineData(map, lineSVG, countryData) {
     // d3's line generator
    const line = d3.line()
      .x(d => map.xScale(d['year'])) // set the x values for the line generator
      .y(d => map.yScale(d['population'])) // set the y values for the line generator


    // append line to svg
    lineSVG.append("path")
      .datum(countryData)
      .attr("d", function(d) { return line(d) })
      .attr("fill", "none")
      .attr("stroke", "steelblue")
  }

  // draw the axes and ticks
  function drawLineAxes(limits, x, y, lineSVG) {
    // return x value from a row of data
    let xValue = function(d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin - 0.5, limits.xMax + 0.5]) // give domain buffer room
      .range([100, 500]);

    // xMap returns a scaled x value from a row of data
    let xMap = function(d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    lineSVG.append("g")
      .attr('transform', 'translate(0, 450)')
      .call(xAxis);

    // return y value from a row of data
    let yValue = function(d) { return +d[y]}

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax + 5, limits.yMin - 5]) // give domain buffer
      .range([50, 450]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    lineSVG.append('g')
      .attr('transform', 'translate(100, 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }
})();
