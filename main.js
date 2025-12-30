const TOTAL_CTA_STATIONS = 146;

const svg = document.querySelector("svg");

const visitedStations = new Set();

const lines = {
  Red: {
    emoji: "🔴",
    visited: 0,
    total: 33,
    percentage: 0.0,
  },
  Blue: {
    emoji: "🔵",
    visited: 0,
    total: 33,
    percentage: 0.0,
  },
  Green: {
    emoji: "🟢",
    visited: 0,
    total: 31,
    percentage: 0.0,
  },
  Purple: {
    emoji: "🟣",
    visited: 0,
    total: 26,
    percentage: 0.0,
  },
  Brown: {
    emoji: "🟤",
    visited: 0,
    total: 27,
    percentage: 0.0,
  },
  Yellow: {
    emoji: "🟡",
    visited: 0,
    total: 3,
    percentage: 0.0,
  },
  Orange: {
    emoji: "🟠",
    visited: 0,
    total: 16,
    percentage: 0.0,
  },
  Pink: {
    emoji: "🩷",
    visited: 0,
    total: 22,
    percentage: 0.0,
  },
}

const parseTransform = (transformStr) => {
  let x = 0,
    y = 0;

  if (!transformStr) return {
    x,
    y
  };

  const translateMatch = transformStr.match(/translate\(([-\d.]+)[,\s]+([-\d.]+)\)/);
  if (translateMatch) {
    x = parseFloat(translateMatch[1]);
    y = parseFloat(translateMatch[2]);
  }

  return {
    x,
    y
  };
};

const getElementPosition = (element) => {
  let totalX = 0;
  let totalY = 0;

  let current = element;
  while (current && current !== svg) {
    const x = parseFloat(current.getAttribute("x") || 0);
    const y = parseFloat(current.getAttribute("y") || 0);
    totalX += x;
    totalY += y;

    const transform = current.getAttribute("transform");
    const {
      x: tx,
      y: ty
    } = parseTransform(transform);
    totalX += tx;
    totalY += ty;

    current = current.parentElement;
  }

  return {
    x: totalX,
    y: totalY
  };
};

const createStatsHeading = (visitedCount) => {
  const h3 = document.createElement("h3");
  h3.id = "statsHeading";
  const percentage = ((visitedCount / TOTAL_CTA_STATIONS) * 100).toFixed(2);
  h3.textContent = `You have visited ${visitedCount} out of ${TOTAL_CTA_STATIONS} total CTA stations (${percentage}%)! 😎`;
  return h3;
};

const createProgressBar = (percentage) => {
  const progressDiv = document.createElement("div");
  progressDiv.className = "progress";
  progressDiv.id = "statsProgress";
  progressDiv.setAttribute("role", "progressbar");
  progressDiv.setAttribute("aria-label", "Progress");
  progressDiv.setAttribute("aria-valuenow", percentage);
  progressDiv.setAttribute("aria-valuemin", "0");
  progressDiv.setAttribute("aria-valuemax", "100");
  progressDiv.style.height = "60px";

  const progressBar = document.createElement("div");
  progressBar.className = "progress-bar";
  progressBar.style.width = `${percentage}%`;
  progressBar.textContent = `${percentage}%`;

  progressDiv.appendChild(progressBar);

  return progressDiv;
};

const showStats = () => {
  const statsContainer = document.getElementById("stats");

  statsContainer.innerHTML = '';

  const table = document.createElement("table");
  table.className = "table";
  table.id = "statsTable";

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  ["Line", "Number of stations visited", "Percentage"].forEach((text) => {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = text;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tableBody = document.createElement("tbody");
  for (const [lineName, lineData] of Object.entries(lines)) {
    const tr = document.createElement("tr");

    const th = document.createElement("th");
    th.scope = "row";
    th.textContent = `${lineData.emoji} ${lineName}`;
    tr.appendChild(th);

    const tdCount = document.createElement("td");
    tdCount.textContent = lineData.visited;
    tr.appendChild(tdCount);

    const tdPercent = document.createElement("td");
    let linePercentage = `${(lineData.percentage * 100).toFixed(2)}%`;
    if (lineData.visited == lineData.total) {
      linePercentage += " 🎉";
    }
    tdPercent.textContent = linePercentage;
    tr.appendChild(tdPercent);

    tableBody.appendChild(tr);
  }

  table.appendChild(tableBody);

  const totalVisited = visitedStations.size;
  const overallPercentage = ((totalVisited / TOTAL_CTA_STATIONS) * 100).toFixed(2);

  const progressBar = createProgressBar(overallPercentage);
  const heading = createStatsHeading(totalVisited);

  statsContainer.appendChild(heading);
  statsContainer.appendChild(progressBar);
  statsContainer.appendChild(table);
};

document.addEventListener("click", (e) => {
  let stationElement = e.target.closest("[data-line]");
  if (!stationElement) return;

  let stationTitleElement = stationElement.querySelector("title");

  if (!stationTitleElement && stationElement.parentElement) {
    stationTitleElement = stationElement.parentElement.querySelector("title");
  }

  if (!stationTitleElement) return;

  const stationTitle = stationTitleElement.textContent.trim();
  const associatedLines = stationElement.dataset.line.split(",");

  let positionElement = stationElement;

  if (stationElement.tagName === 'use') {
    positionElement = stationElement;
  } else if (stationElement.tagName === 'g' && stationElement.id && stationElement.id.includes('base')) {
    positionElement = stationElement.parentElement;
  }

  const {
    x,
    y
  } = getElementPosition(positionElement);

  // Lines can have multiple stations with the same name (ex. Blue has two Western stops)
  const stationId = `${stationTitle}-${Math.round(x)}-${Math.round(y)}`;

  const existing = svg.querySelector(`text[data-station="${stationId}"]`);
  if (existing) {
    existing.remove();
    visitedStations.delete(stationId);
    associatedLines.forEach(associatedLine => {
      lines[associatedLine].visited--;
      lines[associatedLine].percentage = lines[associatedLine].visited / lines[associatedLine].total;
    });
    return;
  }

  const svgNS = "http://www.w3.org/2000/svg";
  const text = document.createElementNS(svgNS, "text");
  text.setAttribute("x", x);
  text.setAttribute("y", y);
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("dominant-baseline", "middle");
  text.setAttribute("font-size", "20");
  text.setAttribute("data-station", stationId);
  text.setAttribute("pointer-events", "none");
  text.textContent = "✅";

  svg.appendChild(text);

  visitedStations.add(stationId);
  associatedLines.forEach(associatedLine => {
    lines[associatedLine].visited++;
    lines[associatedLine].percentage = lines[associatedLine].visited / lines[associatedLine].total;
  });
});