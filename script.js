const slides = document.querySelectorAll('.slide');
let currentSlide = 0;

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === index);
  });
}

document.getElementById('prev').addEventListener('click', () => {
  currentSlide = Math.max(0, currentSlide - 1);
  showSlide(currentSlide);
});

document.getElementById('next').addEventListener('click', () => {
  currentSlide = Math.min(slides.length - 1, currentSlide + 1);
  showSlide(currentSlide);
});

let evData = [];
const slider = d3.select("#yearSlider");
const selectedYearSpan = d3.select("#selectedYear");
const annotation1 = d3.select("#annotation1");
// const annotation11 = d3.select("#annotation11");

d3.csv("./EV_Population.csv").then(data => {
  evData = data;
  evData.forEach(d => {
    d["Model Year"] = +d["Model Year"];
    d["Electric Range"] = +d["Electric Range"];
    d["Base MSRP"] = +d["Base MSRP"];
    d.Make = d.Make?.trim().toUpperCase();
    // d["State"] = +d["State"];
    // d["Make"] = +d["Make"];
    // d["Electric Vehicle Type"] = +d["Electric Vehicle Type"];
  });

  drawSlide1(evData);
//   drawSlide2(evData);
  drawSlide3();


});
d3.csv("Global_EV_Data2024.csv").then(data => {
  data.forEach(d => {
    d.year = +d.year; // ensure year is numeric
  });
  drawSlide2(data);
});

function drawSlide1(data) {
//   const svg = d3.select("#chart1").append("svg");
  const width = 900;
  const height = 380;
//   svg.attr("width", width).attr("height", height);
//   svg.attr("transform", `translate(50,0)`);

  const container = d3.select("#chart1")
    .append("div")
    .attr("id", "slide-container")
    .style("display", "flex")
    .style("flex-direction", "column");

    container.append("div")
    .attr("id", "line-chart");

    const svg = d3.select("#line-chart")
      .append("svg")
      .attr("transform", `translate(100,0)`)
      .attr("display", "flex")
      .attr("width", width)
      .attr("height", height);

  const yearCounts = d3.rollup(data, v => v.length, d => d["Model Year"]);
  const years = Array.from(yearCounts, ([year, count]) => ({ year: +year, count }));
  years.sort((a, b) => a.year - b.year);

  const tooltip = d3.select(".tooltip");

  const x = d3.scaleLinear().domain(d3.extent(years, d => d.year)).range([50, width - 50]);
  const y = d3.scaleLinear().domain([0, d3.max(years, d => d.count)]).nice().range([height - 50, 50]);

  const line = d3.line()
    .x(d => x(d.year))
    .y(d => y(d.count));

  svg.append("g")
    .attr("transform", `translate(0,${height - 50})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  svg.append("g")
    .attr("transform", `translate(50,0)`)
    .call(d3.axisLeft(y));

  svg.append("path")
    .datum(years)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", line);


  svg.selectAll("circle")
    .data(years)
    .enter()
    .append("circle")
    .attr("cx", d => x(d.year))
    .attr("cy", d => y(d.count))
    .attr("r", 5)
    .attr("fill", "orange")
    .on("mouseover", (event, d) => {
      const filtered = evData.filter(e => e["Model Year"] === d.year);
      const makeCounts = d3.rollup(filtered, v => v.length, e => e.Make);
      const tooltipHtml = Array.from(makeCounts.entries())
        .sort((a, b) => d3.ascending(a[0], b[0]))
        .map(([make, count]) => `${make}: ${count}`)
        .join("<br>");

      tooltip.html(`<strong>${d.year}</strong><br>Total: ${d.count}<br>${tooltipHtml}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px")
        .transition().duration(200).style("opacity", 0.9);
    })
    .on("mouseout", () => {
      tooltip.transition().duration(500).style("opacity", 0);
    });

    const surgeYear = 2018;
  const surgeCount = yearCounts.get(surgeYear);

  annotation1.text("The plot shows the number of electric vehicles manufactured per year. Hover over a year to see model manufacture counts by brand.");

  const annotationText = `The largest surge in EV population occurred between 2014 and 2018,\nwith ${surgeCount} total cars made in 2018.`;

  const annotationX = x(surgeYear) + 10;
  const annotationY = y(surgeCount) - 60;

  const annotationGroup = svg.append("g")
    .attr("transform", `translate(${annotationX}, ${annotationY})`);

  const annotationLines = annotationText.split("\n");

  const textElem = annotationGroup.selectAll("text")
    .data(annotationLines)
    .enter()
    .append("text")
    .attr("x", 0)
    .attr("y", (d, i) => i * 16)
    .text(d => d)
    .attr("font-size", "12px")
    .attr("fill", "grey");

  const textBBox = annotationGroup.node().getBBox();
  const xPos = x(surgeYear);
  const yPos = y(surgeCount);

  annotationGroup.insert("foreignObject")
    .attr("x", textBBox.x - 5)
    .attr("y", textBBox.y - 5)
    .attr("width", textBBox.width + 10)
    .attr("height", textBBox.height + 10)
    .style("font", "12px sans-serif")
    .style("background", "#f9f9f9")
    .style("border", "1px solid #ccc")
    .style("padding", "6px")
    .style("border-radius", "4px")
    .style("text-align", "center")
    .style("box-shadow", "0 1px 3px rgba(0,0,0,0.2)")
    .html(annotationText);

    svg.append("line")
    .attr("x1", annotationX)
    .attr("y1", annotationY + 25)
    .attr("x2", xPos)
    .attr("y2", yPos - 5)
    .attr("stroke", "black")
    .attr("marker-end", "url(#arrow)");

  svg.append("defs").append("marker")
    .attr("id", "arrow")
    .attr("viewBox", [0, 0, 10, 10])
    .attr("refX", 10)
    .attr("refY", 5)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto-start-reverse")
    .append("path")
    .attr("d", "M 0 0 L 10 5 L 0 10 z")
    .attr("fill", "black");
    
    svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 2)
    .attr("text-anchor", "middle")
    .text("Year");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 10)
    .attr("text-anchor", "middle")
    .text("Count of EV models");
}

function drawSlide2(dataset) {
  d3.select("#chart2").html("");

  const container = d3.select("#chart2")
    .append("div")
    .attr("id", "slide5-container")
    .style("display", "flex")
    .style("flex-direction", "column")
    .style("align-items", "center");

  container.append("div")
    .attr("id", "selected-year-label")
    .style("font-size", "18px")
    .style("margin-bottom", "10px")
    .text("Selected Year: ");

  const years = Array.from(new Set(dataset.map(d => +d.year))).sort((a, b) => a - b);
  const minYear = d3.min(years);
  const maxYear = 2025;

  const sliderContainer = container.append("div")
    .style("width", "400px")
    .style("margin-bottom", "20px");

  sliderContainer.append("input")
    .attr("type", "range")
    .attr("id", "yearSlider")
    .attr("min", minYear)
    .attr("max", maxYear)
    .attr("step", 1)
    .style("width", "100%")
    .on("input", function () {
      const selected = +this.value;
      const totalEntries = dataset.filter(d => +d.year === selected).length;
        d3.select("#selected-year-label").text(`Selected Year: ${selected} | Total EVs sold worldwide: ${totalEntries}`);

      updateBarChart(selected);
    });

  container.append("div")
    .attr("id", "bar-chart5");

  d3.select("#yearSlider").property("value", minYear);
//   d3.select("#selected-year-label").text(`Selected Year: ${minYear}`);
  

  const initialCount = dataset.filter(d => +d.year === minYear).length;
    d3.select("#selected-year-label").text(`Selected Year: ${minYear} | Total EVs sold worldwide: ${initialCount}`);

    
    
    updateBarChart(minYear);

  function updateBarChart(year) {
    const filtered = dataset.filter(d => +d.year === year);
    const counts = d3.rollup(filtered, v => v.length, d => d.region);
    const chartData = Array.from(counts, ([region, count]) => ({ region, count }));

    const width = 900;
    const height = 400;
    const margin = { top: 40, right: 20, bottom: 80, left: 60 };

    d3.select("#bar-chart5").select("svg").remove();

    const svg = d3.select("#bar-chart5")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const x = d3.scaleBand()
      .domain(chartData.map(d => d.region))
      .range([margin.left, width - margin.right])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(chartData, d => d.count)]).nice()
      .range([height - margin.bottom, margin.top]);

    svg.append("g")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-40)")
      .style("text-anchor", "end");

    svg.append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y));

    svg.selectAll(".bar")
      .data(chartData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.region))
      .attr("y", d => y(d.count))
      .attr("width", x.bandwidth())
      .attr("height", d => y(0) - y(d.count))
      .attr("fill", "#1f77b4");


    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .text("Country");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .text("Number of EV regisrations");
  }

  const svg = d3.select("#anno2");

    svg.append("foreignObject")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 50)
    .attr("height", 50)
    .attr("display", "inline")
    .attr("justify-items", "left")
    // .append("xhtml:div")
    .style("font", "12px sans-serif")
    .style("background", "#f9f9f9")
    .style("border", "1px solid #ccc")
    .style("padding", "6px")
    .style("border-radius", "4px")
    .style("text-align", "center")
    .style("box-shadow", "0 1px 3px rgba(0,0,0,0.2)")
    .html("A global surge in EV sales was seen in 2020. This could be due to a combination of political and economic factors that arose during the COVID-19 pandemic.");


  d3.select("#annotation2").html(
  `Drag the slider to select a year. <br>` +
  `The bar chart will then show the number of EVs sold in countries around the world during that selected year<br>`)
  
}



// function drawSlide2(data) {
//   const svgWidth = 1000, svgHeight = 1400;

//   const svg = d3.select("#chart2")
//     .append("svg")
//     .attr("width", svgWidth)
//     .attr("height", svgHeight);

//   const projection = d3.geoAlbersUsa()
//     .translate([svgWidth / 2, svgHeight / 8])
//     .scale(800);

//   const path = d3.geoPath().projection(projection);

//   const tooltip = d3.select("#tooltip");

//   const stateCounts = d3.rollup(
//     data,
//     v => v.length,
//     d => d["State"].trim()
//   );

//  const color = d3.scaleQuantize()
//   .domain([0, d3.max(Array.from(stateCounts.values()))])
//   .range([
//     "#0d1b2a", // very dark
//     "#1b263b",
//     "#2c3e50",
//     "#3a506b",
//     "#4c6e91",
//     "#527aa3",
//     "#5c8ab5",
//     "#6c9ed9",
//     "#80b3ff"  // lighter, but still dark scheme
//   ]);

//   // Load TopoJSON and draw the map
//   d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json").then(us => {
//     const states = topojson.feature(us, us.objects.states).features;

//     const stateNameFromId = new Map();
//     us.objects.states.geometries.forEach(d => {
//       stateNameFromId.set(d.id, d.properties.name);
//     });

//     svg.selectAll("path")
//       .data(states)
//       .join("path")
//       .attr("d", path)
//       .attr("fill", d => {
//         let stateName = d.properties.name;
//         if (stateName == 'Washington') {
//             stateName = 'WA';
//         }
//         const count = stateCounts.get(stateName) || 0;
//         return color(count);
//       })
//       .attr("stroke", "#fff")
//       .on("mouseover", (event, d) => {
//         let stateName = d.properties.name;
//         if (stateName == 'Washington') {
//             stateName = 'WA';
//         }
//         const count = stateCounts.get(stateName) || 0;
//         tooltip.transition().duration(200).style("opacity", 0.9);
//         tooltip.html(`<strong>${stateName}</strong><br/>EVs: ${count}`)
//           .style("left", (event.pageX + 10) + "px")
//           .style("top", (event.pageY - 28) + "px");
//       })
//       .on("mouseout", () => {
//         tooltip.transition().duration(500).style("opacity", 0);
//       });


//     const topState = Array.from(stateCounts.entries()).reduce((a, b) => a[1] > b[1] ? a : b);
//     d3.select("#annotation2").text(`${topState[0]} leads in EV registrations with ${topState[1]} models.`);
//   });
// }



function drawSlide3(selectedYear = null) {
  d3.select("#chart3").html("");

  const container = d3.select("#chart3")
  .append("div")
  .attr("class", "slide3-container")
  .style("display", "flex")
  .style("justify-content", "space-between")
  .style("gap", "10px");

  const leftPanel = container.append("div").attr("class", "left-panel");
  const rightPanel = container.append("div")
  .attr("class", "right-panel")
  .style("width", "400px"); 

  const yearSet = new Set(evData.map(d => d["Model Year"]).filter(y => y));
  const yearList = Array.from(yearSet).sort();

  const dropdownDiv = rightPanel.append("div")
  .attr("class", "dropdown-container")
  .style("margin-bottom", "10px");

dropdownDiv.append("label")
  .attr("for", "yearDropdown")
  .text("Select Year: ");

const dropdown = dropdownDiv.append("select")
  .attr("id", "yearDropdown")
  .on("change", function () {
    const selected = this.value;
    d3.select(".right-panel svg").remove(); 
    drawAverageByMake(+selected); 
  });

  dropdown.selectAll("option")
    .data(yearList)
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => d);

  const svgLeft = leftPanel.append("svg")
  .attr("width", 800)
  .attr("height", 350)
  .append("g")
  .attr("transform", "translate(60,40)");

  const x = d3.scaleLinear()
    .domain(d3.extent(evData, d => +d["Model Year"]))
    .range([0, 650]);

  const y = d3.scaleLinear()
    .domain(d3.extent(evData, d => +d["Electric Range"]))
    .range([300, 0]);

  svgLeft.append("g")
    .attr("transform", "translate(0,300)")
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  svgLeft.append("g")
    .call(d3.axisLeft(y));

  svgLeft.selectAll("circle")
    .data(evData.filter(d => d["Model Year"] && d["Electric Range"]))
    .enter()
    .append("circle")
    .attr("cx", d => x(+d["Model Year"]))
    .attr("cy", d => y(+d["Electric Range"]))
    .attr("r", 4)
    .attr("fill", "#69b3a2")
    .on("mouseover", (event, d) => {
      d3.select("#tooltip")
        .html(`Make: ${d.Make}<br>Model Year: ${d["Model Year"]}<br>Electric Range: ${d["Electric Range"]}<br>Base MSRP: ${d["Base MSRP"]}<br>CAFV Eligibility: ${d["CAFV Eligibility Simple"]}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px")
        .transition().duration(200).style("opacity", 0.9);
    })
    .on("mouseout", () => {
      d3.select("#tooltip").transition().duration(500).style("opacity", 0);
    });

  svgLeft.append("text")
    .attr("x", 325)
    .attr("y", 340)
    .attr("text-anchor", "middle")
    .text("Year");

  svgLeft.append("text")
    .attr("x", -150)
    .attr("y", -40)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .text("Electric Range (miles)");
    
    const annotationX = x(2020);  
    const annotationY = y(337); 

    const svg = leftPanel.append("g")
                            .attr("transform", "translate(20,10)");

    svg.append("defs").append("marker")
    .attr("id", "arrow")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 5)
    .attr("refY", 0)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M0,-5L10,0L0,5")
    .attr("fill", "gray");

    svg.append("foreignObject")
    .attr("x", annotationX + 65)
    .attr("y", annotationY - 75)
    .attr("width", 50)
    .attr("height", 100)
    .append("xhtml:div")
    .style("font", "12px sans-serif")
    .style("background", "#f9f9f9")
    .style("border", "1px solid #ccc")
    .style("padding", "6px")
    .style("border-radius", "4px")
    .style("text-align", "center")
    .style("box-shadow", "0 1px 3px rgba(0,0,0,0.2)")
    .html("In 2020, Tesla manufactured a model with an electric range of 337 miles. This was one of the higher ranges at the time");

    // d3.select("#annotation3").text(`The scatter plot above plots models by year, displaying their electric range in miles. Hover over a data point to view more details on the model.` + '\n' +  `Use the dropdown on the right to select a year and see the average electric range in miles by car brand (make) for models released in the selected year`);

    d3.select("#annotation3").html(
  `The scatter plot above plots models by year of manufacture, displaying their electric range in miles.<br>` +
  `Hover over a data point to view more details on the model.<br>` +
  `Use the dropdown on the right to select a year and see the average electric range in miles by car brand.`
);

  if (selectedYear) {
    drawAverageByMake(selectedYear);
  }
}


function drawAverageByMake(year) {
  const filtered = evData.filter(d => +d["Model Year"] === year && d.Make && d["Electric Range"]);
  const avgByMake = d3.rollups(
    filtered,
    v => d3.mean(v, d => +d["Electric Range"]),
    d => d.Make
  ).sort((a, b) => b[1] - a[1]); 

  const svg = d3.select(".right-panel")
    .append("svg")
    .attr("width", 350)
    .attr("height", 300);

  const margin = { top: 30, right: 20, bottom: 70, left: 50 };
  const width = 350 - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand()
    .domain(avgByMake.map(d => d[0]))
    .range([0, width])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, d3.max(avgByMake, d => d[1])])
    .range([height, 0]);

g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

svg.append("text")
  .attr("x", width / 2 + margin.left)
  .attr("y", height + margin.top + 70)
  .attr("text-anchor", "middle")
  .text("Make");

g.append("g")
  .call(d3.axisLeft(y));

svg.append("text")
  .attr("transform", "rotate(-90)")
  .attr("x", -height / 2 - margin.top)
  .attr("y", margin.left / 3)
  .attr("text-anchor", "middle")
  .text("Average Electric Range (miles)");

  g.selectAll("rect")
    .data(avgByMake)
    .enter()
    .append("rect")
    .attr("x", d => x(d[0]))
    .attr("y", d => y(d[1]))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d[1]))
    .attr("fill", "#4682b4");

  svg.append("text")
    .attr("x", width / 2 + margin.left)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .text(`Average Electric Range by Make (${year})`);

}

