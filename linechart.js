function showLineChartWindow(country) {
  // Show the line chart window if hidden
  const lineChartWindow = document.getElementById("lineChartWindow");
  lineChartWindow.style.display = "block";

  // Clear previous contents but keep the container
  d3.select("#lineChartWindow").selectAll("*").remove();

  // Add a title for the selected country
  d3.select("#lineChartWindow")
    .append("h3")
    .text(`Injuries Per Million for ${country}`);

  // Add a close button
  const closeButton = d3.select("#lineChartWindow")
    .append("button")
    .text("Close")
    .on("click", function () {
      lineChartWindow.style.display = "none";
    });

  // Append an SVG container for the line chart
  const svg = d3.select("#lineChartWindow")
    .append("svg")
    .attr("id", "lineChart")
    .attr("width", 350)
    .attr("height", 200);

  // Load the data and filter it for the selected country
  d3.csv("data/datacleaned.csv").then(data => {
    const filteredData = data.filter(d => d.Country === country && +d.Year >= 2000)
      .sort((a, b) => d3.ascending(a.Year, b.Year));

    filteredData.forEach(d => {
      d.Year = +d.Year;
      d.InjuriesPerMillion = +d.InjuriesPerMillion;
    });

    // Set up the dimensions and margins for the line chart
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const width = 300 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    // Create a group element for the chart
    const chart = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up the scales
    const x = d3.scaleLinear()
      .domain(d3.extent(filteredData, d => d.Year)) // Use d3.extent for exact min and max year
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(filteredData, d => d.InjuriesPerMillion)]).nice()
      .range([height, 0]);

    // Add the X Axis
    chart.append("g")
  .attr("transform", `translate(0,${height})`)
  .call(d3.axisBottom(x).tickFormat(d3.format("d")))
  .selectAll("text")
  .attr("transform", "rotate(-45)")
  .style("text-anchor", "end");

    // Add the Y Axis
    chart.append("g")
      .call(d3.axisLeft(y));

    // Add the line path
    const line = d3.line()
      .x(d => x(d.Year))
      .y(d => y(d.InjuriesPerMillion));

    chart.append("path")
      .datum(filteredData)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", line);

      
  });
}
