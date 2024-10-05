// -- Bar Chart Code -- //

// Set the margins and dimensions for the bar chart
const margin = { top: 40, right: 40, bottom: 100, left: 60 };
const width = 900 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Create the SVG container for the bar chart
const svg = d3.select("#bar")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Initialize variables for the bar chart
let currentYear = 2000;
let sortDirection = "asc"; // Track sorting direction

// Load the CSV file for the bar chart
d3.csv("data/datacleaned.csv").then(function (data) {

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

  // Append the x-axis
  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end");

  // Append the y-axis
  const yAxis = svg.append("g")
    .attr("class", "y-axis");

  // Function to update the bar chart based on the selected year
  function update(year) {
    currentYear = year;

    // Filter the data for the selected year
    const filteredData = data.filter(d => d.Year == year);

    // Sort the filtered data based on current sorting preference
    if (sortDirection === "asc") {
      filteredData.sort((a, b) => d3.ascending(a.InjuriesPerMillion, b.InjuriesPerMillion));
    } else {
      filteredData.sort((a, b) => d3.descending(a.InjuriesPerMillion, b.InjuriesPerMillion));
    }

    // Update the x-axis domain based on the sorted filtered data
    x.domain(filteredData.map(d => d.Country));

    // Update the y-axis domain based on the filtered data
    y.domain([0, d3.max(filteredData, d => d.InjuriesPerMillion)]).nice();
    yAxis.transition().duration(1000).call(d3.axisLeft(y));

    // Update the x-axis
    svg.select(".x-axis")
      .transition()
      .duration(1000)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end");

    // Bind the filtered data to the bars
    const bars = svg.selectAll("rect").data(filteredData);

    // Create Tooltip Div (if it doesn't already exist)
    if (d3.select("#tooltip").empty()) {
      d3.select("body").append("div")
        .attr("id", "tooltip")
        .style("position", "absolute")
        .style("opacity", 0)
        .style("background-color", "lightgrey")
        .style("padding", "5px")
        .style("border-radius", "3px")
        .style("pointer-events", "none");
    }

    // Enter new bars
    bars.enter().append("rect")
      .attr("x", d => x(d.Country))
      .attr("width", x.bandwidth())
      .attr("y", height) // Start the bars from the bottom
      .attr("height", 0) // Start with height 0 for animation
      .attr("fill", "steelblue")
      // Use reusable mouse events
      .on("mouseover", function (event, d) {
        const content = `${d.Country}: ${d.InjuriesPerMillion} Injuries Per Million`;
        handleMouseOver(event, content);
      })
      .on("mousemove", handleMouseMove)
      .on("mouseout", handleMouseOut)
      .merge(bars) // Update existing bars
      .transition().duration(1000)
      .attr("x", d => x(d.Country))
      .attr("width", x.bandwidth())
      .attr("y", d => y(d.InjuriesPerMillion)) // Set final position
      .attr("height", d => height - y(d.InjuriesPerMillion)); // Set final height

    // Exit and remove old bars
    bars.exit().remove();
  }

  // Create buttons for the years
  const years = d3.range(2000, 2024);
  const buttonContainer = d3.select("#buttonContainer");

  // Creates buttons for each year. When a button is clicked, it updates both the bar chart and heatmap
  years.forEach(year => {
    buttonContainer.append("button")
      .attr("class", "year-button")
      .attr("id", `year-${year}`)
      .text(year)
      .on("click", function () {
        update(year);
        updateHeatmap(year);

        d3.selectAll(".year-button").classed("active", false);
        d3.select(this).classed("active", true);
      });
  });

  // Sorting Code
  d3.select("#sortAsc").on("click", function () {
    sortDirection = "asc";
    update(currentYear);
  });

  d3.select("#sortDesc").on("click", function () {
    sortDirection = "desc";
    update(currentYear);
  });

  // Initialize the charts with year 2000 data
  update(2000);
  d3.select("#year-2000").classed("active", true);
});

// -- Tooltip Functions -- //

function handleMouseOver(event, content) {
  d3.select("#tooltip").transition().duration(200).style("opacity", 1);
  d3.select("#tooltip").html(content)
    .style("left", (event.pageX + 10) + "px")
    .style("top", (event.pageY - 20) + "px");
}

function handleMouseMove(event) {
  d3.select("#tooltip")
    .style("left", (event.pageX + 10) + "px")
    .style("top", (event.pageY - 20) + "px");
}

function handleMouseOut() {
  d3.select("#tooltip").transition().duration(200).style("opacity", 0);
}

// -- Heatmap Code -- //

// Initialize variables for heatmap
const mapWidth = 900;
const mapHeight = 600;
let heatmapData = [];
let dataMap = new Map();

// Create an SVG container for the heatmap
const mapSvg = d3.select("#map")
  .append("svg")
  .attr("width", mapWidth)
  .attr("height", mapHeight);

// Define a projection and path generator for the heatmap
const projection = d3.geoMercator()
  .scale(120)
  .translate([mapWidth / 2, mapHeight / 2]);

const path = d3.geoPath().projection(projection);

// Create a color scale for the heatmap using a fixed domain
const maxInjuries = 11325.9; // Set the fixed maximum value for the domain
const colorScale = d3.scaleSequential(d3.interpolateReds)
  .domain([0, maxInjuries]); // Fixed domain based on max value

// Define the function to update the heatmap
function updateHeatmap(year) {
  // Update fill color based on the selected year's data
  mapSvg.selectAll("path")
    .transition().duration(1000)
    .style("fill", d => {
      const standardizedCountryName = standardizeCountryName(d.properties.name);
      const countryData = dataMap.get(standardizedCountryName);
      if (countryData) {
        const yearData = countryData.find(item => item.year === year);
        return yearData ? colorScale(yearData.injuries) : "#ccc"; // Use the fixed color scale
      }
      return "#ccc";
    });
}



// Helper function to standardize country names
function standardizeCountryName(name) {
  const nameMappings = {
    "United States of America": "United States",
    "Republic of Korea": "Korea", 
    "South Korea": "Korea", 
    "Slovakia": "Slovak Republic", 
    "Turkey": "Türkiye", 
    "TÃ¼rkiye": "Türkiye", 
  };
  return nameMappings[name] || name; // Return mapped name or original if no match
}


// Load GeoJSON data and CSV data for the heatmap
Promise.all([
  d3.json("data/world.geojson"),
  d3.csv("data/datacleaned.csv")
]).then(([geoData, trafficData]) => {
  // Store the traffic data for use in updateHeatmap
  heatmapData = trafficData;

  // Process CSV data into a usable format
  trafficData.forEach(d => {
    d.InjuriesPerMillion = +d.InjuriesPerMillion; // Convert to number
    d.Year = +d.Year; // Ensure Year is parsed as a number
    if (!dataMap.has(d.Country)) {
      dataMap.set(d.Country, []);
    }
    dataMap.get(d.Country).push({ year: d.Year, injuries: d.InjuriesPerMillion });
  });

  // Draw the map using the GeoJSON data
  mapSvg.selectAll("path")
    .data(geoData.features)
    .enter().append("path")
    .attr("class", "country")
    .attr("d", path)
    .style("fill", "#ccc") // Default color for countries without data
    // Attach mouseover events to paths here
    .on("mouseover", function (event, d) {
      const standardizedCountryName = standardizeCountryName(d.properties.name);
      const countryData = dataMap.get(standardizedCountryName);
      const yearData = countryData ? countryData.find(item => item.year === currentYear) : null;
      const injuries = yearData ? yearData.injuries : "No data";
      const content = `${d.properties.name}: ${injuries} Injuries Per Million`;
      handleMouseOver(event, content);
    })
    .on("mousemove", handleMouseMove)
    .on("mouseout", handleMouseOut);

  // Initialize the heatmap with the first year's data
  updateHeatmap(2000);
});

// Define the function to update the heatmap
function updateHeatmap(year) {
  // Update color domain based on the selected year
  colorScale.domain([0, d3.max(heatmapData, d => d.Year === year ? d.InjuriesPerMillion : 0)]);

  // Update fill color based on the selected year's data
  mapSvg.selectAll("path")
    .transition().duration(1000)
    .style("fill", d => {
      const standardizedCountryName = standardizeCountryName(d.properties.name);
      const countryData = dataMap.get(standardizedCountryName);
      if (countryData) {
        const yearData = countryData.find(item => item.year === year);
        return yearData ? colorScale(yearData.injuries) : "#ccc";
      }
      return "#ccc";
    });
}