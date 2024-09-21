// script.js

// Set the margins and dimensions
const margin = { top: 40, right: 40, bottom: 60, left: 60 };
const width = 900 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Create the SVG container
const svg = d3.select("body")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Load the CSV file
d3.csv("data/datacleaned.csv").then(function(data) {

  // Parse numerical values
  data.forEach(d => {
    d.InjuriesPerMillion = +d.InjuriesPerMillion;
  });

  // Sort the data by country alphabetically
  data.sort((a, b) => d3.ascending(a.Country, b.Country));

  // Define the x-axis scale for the countries
  const x = d3.scaleBand()
    .domain(data.map(d => d.Country)) // Country names
    .range([0, width])
    .padding(0.2);

  // Define the y-axis scale for InjuriesPerMillion
  const y = d3.scaleLinear()
    .range([height, 0]);

  // Define color scale for the bars
  const color = d3.scaleOrdinal()
    .domain(d3.range(2000, 2024))
    .range(d3.schemeCategory10);

  // Append the x-axis
  const xAxis = svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end");

  // Append the y-axis
  const yAxis = svg.append("g")
    .attr("class", "y-axis");

  // Update the chart based on the selected year
  function update(year) {
    // Filter the data for the selected year
    const filteredData = data.filter(d => d.Year == year);

    // Update the y-axis domain based on the filtered data
    y.domain([0, d3.max(filteredData, d => d.InjuriesPerMillion)]).nice();

    yAxis.transition().duration(1000).call(d3.axisLeft(y));

    // Bind the filtered data to the bars
    const bars = svg.selectAll("rect")
      .data(filteredData);

    // Enter new bars
    bars.enter().append("rect")
      .attr("x", d => x(d.Country))
      .attr("width", x.bandwidth())
      .attr("y", height) // Start the bars from the bottom
      .attr("height", 0) // Start with height 0 for animation
      .attr("fill", d => color(year))
      .merge(bars) // Update existing bars
      .transition().duration(1000)
      .attr("y", d => y(d.InjuriesPerMillion)) // Set final position
      .attr("height", d => height - y(d.InjuriesPerMillion)); // Set final height

    // Exit and remove old bars
    bars.exit().remove();
  }

  // Create buttons for the years
  const years = d3.range(2000, 2024);
  const buttonContainer = d3.select("#buttonContainer");

  years.forEach(year => {
    buttonContainer.append("button")
      .attr("class", "year-button")
      .attr("id", `year-${year}`)
      .text(year)
      .on("click", function() {
        // Update the chart with the selected year data
        update(year);

        // Remove the active class from all buttons and add it to the clicked one
        d3.selectAll(".year-button").classed("active", false);
        d3.select(this).classed("active", true);
      });
  });

  // Initialize the chart with year 2000 data
  update(2000);
  d3.select("#year-2000").classed("active", true);

});
