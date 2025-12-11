// ----------------------------
// Constants and Data
// ----------------------------
// monthlyData and yAxisMax are provided by PHP in transactions.php
// They are available as global variables

const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

// ----------------------------
// Initialize Y-Axis
// ----------------------------
function initYAxis() {
  const container = document.getElementById("y-axis");
  container.innerHTML = "";

  // Create 6 evenly spaced labels from max to 0
  const steps = 6;
  const stepValue = yAxisMax / (steps - 1);

  for (let i = 0; i < steps; i++) {
    const value = Math.round(yAxisMax - (stepValue * i));
    const label = document.createElement("div");
    label.className = "y-axis-label";
    label.textContent = value.toLocaleString();
    container.appendChild(label);
  }
}

// ----------------------------
// Initialize Grid Lines
// ----------------------------
function initGridLines() {
  const container = document.getElementById("grid-lines");
  container.innerHTML = "";

  // Create 6 horizontal grid lines
  for (let i = 0; i <= 5; i++) {
    const line = document.createElement("div");
    line.className = "grid-line";
    line.style.bottom = `${i * 20}%`;
    container.appendChild(line);
  }
}

// ----------------------------
// Tooltip Functions
// ----------------------------
function showTooltip(e) {
  const tooltip = document.getElementById("tooltip");
  const month = e.target.dataset.month;
  const transactions = e.target.dataset.transactions;
  const revenue = parseFloat(e.target.dataset.revenue).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const tooltipText = `${month}\nTransactions: ${transactions}\nRevenue: ₱${revenue}`;

  tooltip.textContent = tooltipText;
  tooltip.style.opacity = "1";

  const rect = e.target.getBoundingClientRect();
  tooltip.style.left = `${rect.left + window.scrollX}px`;
  tooltip.style.top = `${rect.top + window.scrollY - 60}px`;
}

function hideTooltip() {
  const tooltip = document.getElementById("tooltip");
  tooltip.style.opacity = "0";
}

// ----------------------------
// Update Month Labels
// ----------------------------
function updateMonthLabels(chartWidth) {
  const container = document.getElementById("month-indicators");
  container.innerHTML = "";

  months.forEach((month, index) => {
    const label = document.createElement("div");
    label.className = "month-label";
    label.textContent = month;

    // Position labels evenly across the chart width
    const xPos = (chartWidth / (months.length - 1)) * index;
    label.style.left = `${xPos}px`;

    container.appendChild(label);
  });
}

// ----------------------------
// Draw Connecting Line & Area
// ----------------------------
function drawConnectingLine(coordinates, width, height) {
  const svg = document.getElementById("line-svg");
  svg.innerHTML = "";
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.style.width = "100%";
  svg.style.height = "100%";

  if (coordinates.length < 2) return;

  // Create line path data
  let pathData = `M ${coordinates[0].x} ${coordinates[0].y}`;
  for (let i = 1; i < coordinates.length; i++) {
    pathData += ` L ${coordinates[i].x} ${coordinates[i].y}`;
  }

  // Create filled area path (area under the line)
  let areaPath = `M ${coordinates[0].x} ${height}`;
  areaPath += ` L ${coordinates[0].x} ${coordinates[0].y}`;
  for (let i = 1; i < coordinates.length; i++) {
    areaPath += ` L ${coordinates[i].x} ${coordinates[i].y}`;
  }
  areaPath += ` L ${coordinates[coordinates.length - 1].x} ${height} Z`;

  // Create the filled area element (gradient background)
  const area = document.createElementNS("http://www.w3.org/2000/svg", "path");
  area.setAttribute("d", areaPath);
  area.setAttribute("fill", "rgba(252, 194, 0, 0.2)");
  area.setAttribute("stroke", "none");

  // Create the line element
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", pathData);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "#FCC200");
  path.setAttribute("stroke-width", "3");

  // Add area first (so it appears behind the line)
  svg.appendChild(area);
  svg.appendChild(path);
}

// ----------------------------
// Update Data Points
// ----------------------------
function updateDataPoints() {
  const container = document.getElementById("data-points");
  container.innerHTML = "";

  const chartHeight = container.offsetHeight;
  const chartWidth = container.offsetWidth;

  // Validate chart dimensions
  if (chartHeight === 0 || chartWidth === 0) {
    console.warn("Chart container has invalid dimensions");
    return;
  }

  const coordinates = [];

  months.forEach((month, index) => {
    // Get data for this month, default to 0 if not available
    const data = monthlyData[month] || { transactions: 0, revenue: 0 };
    const value = data.revenue || 0;

    const point = document.createElement("div");
    point.className = "data-point";

    // Calculate horizontal position (evenly distributed)
    const xPos = (chartWidth / (months.length - 1)) * index;

    // Calculate vertical position based on revenue value
    const yPos = (value / yAxisMax) * chartHeight;

    // Store coordinates for line drawing
    coordinates.push({ x: xPos, y: chartHeight - yPos });

    // Position the point (center it on the calculated position)
    point.style.left = `${xPos - 5}px`; // Subtract half of point width (10px / 2)
    point.style.bottom = `${yPos - 5}px`; // Subtract half of point height (10px / 2)

    // Store data in the point for tooltip
    point.dataset.month = month;
    point.dataset.transactions = data.transactions || 0;
    point.dataset.revenue = value;

    // Add event listeners for tooltip
    point.addEventListener("mouseenter", showTooltip);
    point.addEventListener("mouseleave", hideTooltip);

    container.appendChild(point);
  });

  // Draw the connecting line and filled area
  drawConnectingLine(coordinates, chartWidth, chartHeight);

  // Update month labels to align with data points
  updateMonthLabels(chartWidth);
}

// ----------------------------
// Initialize Chart
// ----------------------------
function initChart() {
  // Check if required data exists
  if (typeof monthlyData === 'undefined' || typeof yAxisMax === 'undefined') {
    console.error("Chart data not provided by PHP");
    return;
  }

  initYAxis();
  initGridLines();
  updateDataPoints();
}

// ----------------------------
// Event Listeners
// ----------------------------
// Redraw chart on window resize to maintain responsiveness
window.addEventListener("resize", () => {
  updateDataPoints();
});

// Initialize chart when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChart);
} else {
  // DOM is already ready
  initChart();
}