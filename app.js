
"use strict";


const SECTIONS = Array.from(document.querySelectorAll(".story-section"));

// colours
const PALETTE = {
  accent:    "#ff08bd",
  muted:     "#5c5447",
  gridLine:  "rgba(255,255,255,0.06)",
  axisText:  "#ffffff",
  tooltip: {
    bg:     "#1a1a2e",
    border: "rgba(201,168,76,0.3)",
  },
};

//top progress bar
const progressBar = document.getElementById("scrollProgressBar");

function updateScrollProgress() {
  const scrollTop    = window.scrollY;
  const docHeight    = document.documentElement.scrollHeight - window.innerHeight;
  const progress     = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = `${progress}%`;
}

window.addEventListener("scroll", updateScrollProgress, { passive: true });



//reveal item on scroll
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target); // animate once
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
);

document.querySelectorAll(".reveal-item").forEach((el) => revealObserver.observe(el));


//tooltips
const tooltip = d3.select("body")
  .append("div")
  .attr("class", "d3-tooltip")
  .style("opacity", 0)
  .style("position", "absolute");

const Tooltip = {
  show(html, event) {
    tooltip
      .html(html)
      .style("opacity", 1)
      .style("left", `${event.pageX + 14}px`)
      .style("top",  `${event.pageY - 28}px`);
  },
  move(event) {
    tooltip
      .style("left", `${event.pageX + 14}px`)
      .style("top",  `${event.pageY - 28}px`);
  },
  hide() {
    tooltip.style("opacity", 0);
  },
};


// model evaluation bar chart
const CHART1_DATA = [
  { category: "X1_toxicity",   value: 0.996833252 },
  { category: "X1_identity_hate",    value: 0.643344096  },
  { category: "X2_toxicity",   value: 0.824595864 },
  { category: "X2_identity_hate",   value: 0.116704644  },
  { category: "X3_toxicity", value: 0.898535056 },
  { category: "X3_identity_hate",    value: 0.1427440156 },
  { category: "X4_toxicity",     value: 0.980874271 },
  { category: "X4_identity_hate",     value: 0.699011535 }
];

const colorScale = d3.scaleOrdinal() //theres probs a better way of doing this? come back to this later ?
  .domain([...new Set(CHART1_DATA.map(d => d.category))])
  .range(["#8F00FF", "#8F00FF", "#00FFFF", "#00FFFF","#FF5E00", "#FF5E00", "#39FF14", "#39FF14",]); 

function drawChart1() {
  const svgEl  = document.getElementById("chart1");
  if (!svgEl) return;

  const margin = { top: 16, right: 20, bottom: 140, left: 52 };
  const totalW = svgEl.clientWidth  || 600;
  const totalH = svgEl.clientHeight || 340;
  const W      = totalW - margin.left - margin.right;
  const H      = totalH - margin.top  - margin.bottom;

  const svg = d3.select("#chart1")
    .attr("viewBox", `0 0 ${totalW} ${totalH}`)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // scales
  const x = d3.scaleBand()
    .domain(CHART1_DATA.map((d) => d.category))
    .range([0, W])
    .padding(0.3);

  const y = d3.scaleLinear()
    .domain([0, d3.max(CHART1_DATA, (d) => d.value) * 1.15])
    .nice()
    .range([H, 0]);

  // horizontal grid lines
  svg.append("g")
    .attr("class", "grid")
    .call(
      d3.axisLeft(y)
        .tickSize(-W)
        .tickFormat("")
        .ticks(5)
    )
    .select(".domain").remove();

  svg.selectAll(".grid .tick line")
    .style("stroke", PALETTE.gridLine)
    .style("stroke-dasharray", "3,3");

  // X axis
  svg.append("g")
    .attr("transform", `translate(0,${H})`)
    .call(d3.axisBottom(x).tickSizeOuter(0))
    .selectAll("text")
      .style("fill",        PALETTE.axisText)
      .style("font-family", "'IBM Plex Mono', monospace")
      .style("font-size",   "0.7rem")
      .attr("transform",  "rotate(-90)")
      .attr("text-anchor", "end") 
      .attr("dx", "-1em")  
      .attr("dy", "-0.4em");


  svg.select(".domain").style("stroke", PALETTE.gridLine);

  svg.append("text")
  .attr("x", W / 2)
  .attr("y", H + margin.bottom - 4)   // sits at the bottom of the margin
  .attr("text-anchor", "middle")
  .style("fill", PALETTE.axisText)
  .style("font-family", "'IBM Plex Mono', monospace")
  .style("font-size", "0.75rem")
  .text("Category");


  // Y axis
  svg.append("g")
    .call(d3.axisLeft(y).ticks(5).tickSizeOuter(0))
    .selectAll("text")
      .style("fill",        PALETTE.axisText)
      .style("font-family", "'IBM Plex Mono', monospace")
      .style("font-size",   "0.65rem");


  svg.append("text")
  .attr("transform", "rotate(-90)")
  .attr("x", -(H / 2))               // centred along the axis
  .attr("y", -margin.left + 14)      //sits in the left margin
  .attr("text-anchor", "middle")
  .style("fill", PALETTE.axisText)
  .style("font-family", "'IBM Plex Mono', monospace")
  .style("font-size", "0.75rem")
  .text("Value");

  // bars
  svg.selectAll(".bar")
    .data(CHART1_DATA)
    .join("rect")
    .attr("class", "bar")
    .attr("x",     (d) => x(d.category))
    .attr("width", x.bandwidth())
    .attr("y",     H)           // start at bottom for animation!!
    .attr("height", 0)
    .attr("fill",  (d) => colorScale(d.category))
    .attr("opacity", 0.85)
    .on("mouseover", function (event, d) {
      d3.select(this).attr("opacity", 1).attr("fill", PALETTE.accent);
      Tooltip.show(
        `<strong>${d.category}</strong><br/>Value: ${d.value}`,
        event
      );
    })
    .on("mousemove", Tooltip.move)
    .on("mouseleave", function () {
      d3.select(this).attr("opacity", 0.85).attr("fill", (d) => colorScale(d.category));
      Tooltip.hide();
    })
    // animate up on first view
    .transition()
    .duration(800)
    .delay((_, i) => i * 80)
    .ease(d3.easeCubicOut)
    .attr("y",      (d) => y(d.value))
    .attr("height", (d) => H - y(d.value));
}


//code for drawing chart 

let chart1Drawn = false;

const chartObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      if (id === "section-5" && !chart1Drawn) {
        chart1Drawn = true;
        drawChart1();
      }
    });
  },
  { threshold: 0.2 }
);

SECTIONS.forEach((s) => chartObserver.observe(s));

//charts from modified dataset switching code !!
const DS1 = {
  label: "Jigsaw TCCC Dataset Label Counts",
  data: [
    { category: "toxic",   value: 15294 },
    { category: "severe_toxic",    value: 1595  },
    { category: "obscene",   value: 8449 },
    { category: "threat",   value: 478  },
    { category: "insult", value: 7877 },
    { category: "identity_hate", value: 1405 },
  ],
};

const DS2 = {
  label: "Google CC Dataset Label Counts",
  data: [
    { category: "toxicity",   value: 51701 },
    { category: "severe_toxicity",   value: 1 },
    { category: "obscene",    value: 3984 },
    { category: "threat",    value: 1348 },
    { category: "insult", value: 38665 },
    { category: "identity_hate", value: 3498 },
    { category: "sexual_explicit", value: 1571 }
  ],
};

function drawDsChart(svgId, dataset, color) {
  const svgEl = document.getElementById(svgId);
  if (!svgEl) return;
  svgEl.innerHTML = "";

  const margin = { top: 16, right: 20, bottom: 40, left: 48 };
  const totalW = svgEl.clientWidth || 600;
  const totalH = svgEl.clientHeight || 260;
  const W = totalW - margin.left - margin.right;
  const H = totalH - margin.top  - margin.bottom;

  const svg = d3.select(`#${svgId}`)
    .attr("viewBox", `0 0 ${totalW} ${totalH}`)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand()
    .domain(dataset.map((d) => d.category))
    .range([0, W])
    .padding(0.3);

  const y = d3.scaleLinear()
    .domain([0, d3.max(dataset, (d) => d.value) * 1.2])
    .nice()
    .range([H, 0]);

  svg.append("g")
    .call(d3.axisLeft(y).tickSize(-W).tickFormat("").ticks(4))
    .select(".domain").remove();
  svg.selectAll(".tick line")
    .style("stroke", PALETTE.gridLine)
    .style("stroke-dasharray", "3,3");

  svg.append("g")
    .attr("transform", `translate(0,${H})`)
    .call(d3.axisBottom(x).tickSizeOuter(0))
    .selectAll("text")
      .style("fill", PALETTE.axisText)
      .style("font-family", "'IBM Plex Mono', monospace")
      .style("font-size", "0.63rem");

  svg.append("g")
    .call(d3.axisLeft(y).ticks(4).tickSizeOuter(0))
    .selectAll("text")
      .style("fill", PALETTE.axisText)
      .style("font-family", "'IBM Plex Mono', monospace")
      .style("font-size", "0.63rem");

  svg.selectAll(".domain").style("stroke", PALETTE.gridLine);

  svg.selectAll(".bar")
    .data(dataset)
    .join("rect")
    .attr("class", "bar")
    .attr("x",      (d) => x(d.category))
    .attr("width",  x.bandwidth())
    .attr("y",      H)
    .attr("height", 0)
    .attr("fill",   color)
    .attr("opacity", 0.85)
    .on("mouseover", function (event, d) {
      d3.select(this).attr("opacity", 1);
      Tooltip.show(`<strong>${d.category}</strong><br/>Value: ${d.value}`, event);
    })
    .on("mousemove", Tooltip.move)
    .on("mouseleave", function () {
      d3.select(this).attr("opacity", 0.85);
      Tooltip.hide();
    })
    .transition()
    .duration(700)
    .delay((_, i) => i * 80)
    .ease(d3.easeCubicOut)
    .attr("y",      (d) => y(d.value))
    .attr("height", (d) => H - y(d.value));
}

const dsChartDrawn = { ds1: false, ds2: false };

function activateDsTab(tabId) {
  if (tabId === "ds1" && !dsChartDrawn.ds1) {
    drawDsChart("ds-chart1", DS1.data, PALETTE.accent);
    dsChartDrawn.ds1 = true;
  }
  if (tabId === "ds2" && !dsChartDrawn.ds2) {
    drawDsChart("ds-chart2", DS2.data, PALETTE.accent);
    dsChartDrawn.ds2 = true;
  }
}

// draw first chart when section scrolls into view
const dsObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !dsChartDrawn.ds1) {
        drawDsChart("ds-chart1", DS1.data, PALETTE.accent);
        dsChartDrawn.ds1 = true;
        dsObserver.disconnect();
      }
    });
  },
  { threshold: 0.2 }
);
const section4 = document.getElementById("section-4");
if (section4) dsObserver.observe(section4);

//TAB SWITCHING CODE !
document.querySelectorAll(".dataset-snippet").forEach((snippet) => {
  snippet.querySelectorAll(".dataset-tab").forEach((tab) => {
    tab.addEventListener("click", () => {

      // only touch tabs/panels in THIS snippet
      snippet.querySelectorAll(".dataset-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      const targetId = tab.dataset.tab;

      snippet.querySelectorAll(".dataset-panel").forEach((panel) => {
        panel.classList.toggle("active", panel.id === targetId);
      });

      // update label if present (chart snippets)
      const labelEl = snippet.querySelector(".snippet-rows");
      if (labelEl && tab.dataset.label) labelEl.textContent = tab.dataset.label;

      
      activateDsTab(targetId);
    });
  });
});

//accordion
document.querySelectorAll('.acc-header').forEach(header => {
  header.addEventListener('click', () => {
    const item = header.closest('.acc-item');
    const isOpen = item.classList.contains('open'); // capture state first

    document.querySelectorAll('.acc-item').forEach(i => i.classList.remove('open')); // close all

    if (!isOpen) item.classList.add('open'); // only reopen if it wasn't already open
  });
});


//resizing
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    // clear and redraw
    const dc1 = document.getElementById("ds-chart1");
const dc2 = document.getElementById("ds-chart2");
if (dc1 && dsChartDrawn.ds1) drawDsChart("ds-chart1", DS1.data, PALETTE.accent);
if (dc2 && dsChartDrawn.ds2) drawDsChart("ds-chart2", DS2.data, PALETTE.accent);
    const c1 = document.getElementById("chart1");
    const c2 = document.getElementById("chart2");
    if (c1) { c1.innerHTML = ""; drawChart1(); }
    if (c2) { c2.innerHTML = ""; drawChart2(); }
  }, 250);
});