// Global state variables
let playerData = [];
let headers = [];
let chartInstances = [];
const MAX_SELECTED_TESTS = 4; // Updated from 2 to 4

// List of allowed test headers from the user
const allowedTestHeaders = [
  "10m Best (sec)",
  "20m Best (sec)",
  "40m Best (sec)",
  "Yo-Yo Level",
  "SBJ Best (mts)",
  "S/L Glute Bridges (Sec)",
  "SL Lunge Calf Raises",
  "MB Rotational Throws",
  "Copenhagen (Sec)",
  "S/L Hop Left",
  "Run A 3 Best(sec)",
  "Run A 3×6 Best(sec)",
  "1 Mile Time (min)",
  "Push-ups Count",
  "2 KM Time (min)",
  "CMJ Score",
];

// Map CSV headers to nicer labels for display
const testHeaders = {
  "10m Best (sec)": "10m",
  "20m Best (sec)": "20m",
  "40m Best (sec)": "40m",
  "Yo-Yo Level": "YoYo",
  "SBJ Best (mts)": "SBJ",
  "S/L Glute Bridges (Sec)": "S/L Glute Bridges",
  "SL Lunge Calf Raises": "SL Lunge Calf Raises",
  "MB Rotational Throws": "MB Rotational Throws",
  "Copenhagen (Sec)": "Copenhagen",
  "S/L Hop Left": "S/L Hop",
  "Run A 3 Best(sec)": "Run A 3",
  "Run A 3×6 Best(sec)": "Run A 3×6",
  "1 Mile Time (min)": "1 Mile",
  "Push-ups Count": "Push-ups",
  "2 KM Time (min)": "2 KM",
  "CMJ Score": "CMJ Scores",
  "WEIGHT": "WEIGHT",
  "Coach Name": "Coach Name",
};

// DOM element references
const uploadEl = document.getElementById("uploadCSV");
const playerSelect = document.getElementById("playerSelect");
const testCountSelect = document.getElementById("testCountSelect");
const dateInput = document.getElementById("dateInput");
const dragDropContainer = document.getElementById("dragDropContainer");
const availableTestsCol = document.getElementById("availableTests");
const selectedTestsCol = document.getElementById("selectedTests");
const chartArea = document.getElementById("chartArea");
const chartCanvases = [
  document.getElementById("chartCanvas1"),
  document.getElementById("chartCanvas2"),
  document.getElementById("chartCanvas3"),
  document.getElementById("chartCanvas4"),
];
const playerNameTitle = document.getElementById("playerNameTitle");
const playerInfoTable = document.querySelector(".player-info-table");

// Set initial visibility
dragDropContainer.style.display = "none";
chartArea.style.display = "none";

/**
 * Parses a CSV text string into an array of objects.
 * @param {string} text The CSV content.
 * @returns {{hdr: string[], data: object[]}} An object containing headers and parsed data.
 */
function parseCSVText(text) {
  const rows = text.replace(/\r/g, "").split("\n").filter((r) => r.trim() !== "");
  if (rows.length === 0) return { hdr: [], data: [] };

  const headerIdx = rows.findIndex((r) => r.split(",").map((c) => c.trim().toLowerCase()).includes("player"));
  const headerCells = rows[headerIdx === -1 ? 0 : headerIdx].split(",").map((h) => h.trim());

  const dataRows = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const cells = rows[i].split(",");
    if (cells.length <= 1 && !cells[0]?.trim()) continue;
    const obj = {};
    for (let j = 0; j < headerCells.length; j++) {
      obj[headerCells[j]] = cells[j] !== undefined ? cells[j].trim() : "";
    }
    dataRows.push(obj);
  }
  return { hdr: headerCells, data: dataRows };
}

/**
 * Populates the player dropdown with unique player names from the parsed data.
 */
function populatePlayerDropdown() {
  playerSelect.innerHTML = '<option value="" disabled selected>-- Select Player --</option>';
  const uniquePlayers = [...new Set(playerData.map((r) => r["Player"]).filter(Boolean))];
  uniquePlayers.forEach((player) => {
    const opt = document.createElement("option");
    opt.value = player;
    opt.textContent = player;
    playerSelect.appendChild(opt);
  });
}

/**
 * Creates and appends the draggable test cards to the 'Available Tests' column.
 */
function createTestCards() {
  dragDropContainer.style.display = "flex"; // Show drag-and-drop container

  availableTestsCol.innerHTML = "<h3>Available Tests</h3>";
  selectedTestsCol.innerHTML = "<h3>Selected Tests</h3>";

  // Filter headers to only include the allowed tests
  const availableCSVTests = headers.filter((h) => allowedTestHeaders.includes(h));

  availableCSVTests.forEach((csvHeader) => {
    const card = document.createElement("div");
    card.className = "test-card";
    card.draggable = true;
    card.dataset.header = csvHeader;
    card.dataset.label = testHeaders[csvHeader] || csvHeader;
    card.textContent = testHeaders[csvHeader] || csvHeader;

    card.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", csvHeader);
      card.classList.add("dragging");
    });
    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
    });
    card.addEventListener("click", () => {
      if (card.parentElement === availableTestsCol) {
        tryMoveToSelected(card);
      } else {
        availableTestsCol.appendChild(card);
      }
    });
    availableTestsCol.appendChild(card);
  });

  enableColumnDnD(availableTestsCol);
  enableColumnDnD(selectedTestsCol);
}

/**
 * Enables drag-and-drop functionality for a given column element.
 * @param {HTMLElement} columnEl The column to enable D&D on.
 */
function enableColumnDnD(columnEl) {
  columnEl.addEventListener("dragover", (e) => {
    e.preventDefault();
    const draggingCard = document.querySelector(".test-card.dragging");
    if (!draggingCard) return;

    if (columnEl === selectedTestsCol) {
      const afterEl = getDragAfterElement(columnEl, e.clientY);
      if (afterEl == null) {
        columnEl.appendChild(draggingCard);
      } else {
        columnEl.insertBefore(draggingCard, afterEl);
      }
    } else {
      e.dataTransfer.dropEffect = "move";
    }
  });

  columnEl.addEventListener("drop", (e) => {
    e.preventDefault();
    const csvHeader = e.dataTransfer.getData("text/plain");
    if (!csvHeader) return;
    const card = document.querySelector(`.test-card[data-header="${cssEscape(csvHeader)}"]`);
    if (!card) return;

    if (columnEl === selectedTestsCol) {
      tryMoveToSelected(card);
    } else {
      availableTestsCol.appendChild(card);
    }
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll(".test-card:not(.dragging)")];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function tryMoveToSelected(card) {
  const count = selectedTestsCol.querySelectorAll(".test-card").length;
  if (count >= MAX_SELECTED_TESTS) {
    alert(`You can select up to ${MAX_SELECTED_TESTS} tests.`);
    return;
  }
  selectedTestsCol.appendChild(card);
}

/**
 * Gets the headers of all test cards currently in the "Selected Tests" column.
 * @returns {string[]} An array of CSV headers.
 */
function getSelectedTestHeaders() {
  return [...selectedTestsCol.querySelectorAll(".test-card")].map((c) => c.dataset.header);
}

// Populate test count dropdown (1 to 20)
function populateTestCountDropdown() {
  for (let i = 1; i <= 20; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = i;
    testCountSelect.appendChild(opt);
  }
}

/**
 * Handles the file upload event, parses the CSV, and updates the UI.
 */
function handleCSVUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    const text = ev.target.result;
    const parsed = parseCSVText(text);
    headers = parsed.hdr || [];
    playerData = parsed.data || [];

    if (!headers.some((h) => h.toLowerCase() === "player")) {
      alert("CSV does not contain a 'Player' header. Please check your file.");
      return;
    }

    // Reset and update UI
    chartArea.style.display = "none";
    populatePlayerDropdown();
    createTestCards();
    destroyCharts();
    clearCanvases();
  };
  reader.readAsText(file);
}

// Chart utility functions
function destroyCharts() {
  chartInstances.forEach((c) => c.destroy());
  chartInstances = [];
}
function clearCanvases() {
  chartCanvases.forEach((canvas) => {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });
}

/**
 * Updates the player info table with data from the selected player's row.
 * @param {string} playerName The name of the selected player.
 */
function updatePlayerInfo(playerName) {
  const row = playerData.find(r => r["Player"] === playerName) || {};
  const name = row["Player"] || "-";
  const gender = row["Gender"] || "N/A";
  const age = row["Age Category"] || "N/A";
  const handedness = row["Handedness"] || "N/A";
  const role = row["Role"] || "Batsman";
  const coachName = row["Coach Name"] || "N/A";

  // Update the DOM directly instead of using a HTML string
  playerNameTitle.textContent = name.toUpperCase();
  document.getElementById("playerName").textContent = name;
  document.getElementById("playerGender").textContent = gender;
  document.getElementById("playerAge").textContent = age;
  document.getElementById("playerHandedness").textContent = handedness;
  document.getElementById("playerRole").textContent = role;
  document.getElementById("coachName").textContent = coachName;

  chartArea.style.display = "block";
}

/**
 * Generates and renders the charts based on the form selections.
 */
function generateReport() {
  const playerName = playerSelect.value;
  const selectedHeaders = getSelectedTestHeaders();
  const testCount = parseInt(testCountSelect.value, 10);

  if (!playerName) {
    alert("Please select a player.");
    return;
  }
  if (selectedHeaders.length === 0) {
    alert("Please drag tests to 'Selected Tests' (up to 4).");
    return;
  }
  if (selectedHeaders.length > MAX_SELECTED_TESTS) {
    alert(`Please keep only ${MAX_SELECTED_TESTS} tests in 'Selected Tests'.`);
    return;
  }
  if (!testCount || isNaN(testCount)) {
    alert("Please select the Number of Recent Tests.");
    return;
  }

  const endDate = dateInput.value ? new Date(dateInput.value) : null;
  updatePlayerInfo(playerName);
  destroyCharts();

  selectedHeaders.forEach((testHeader, idx) => {
    const canvas = chartCanvases[idx];
    if (!canvas) return;

    const groupAvgHeader = `${testHeader} GRP Average`;
    const indvAvgHeader = `${testHeader} INDV Average`;
    const targetHeader = `${testHeader} Target`;

    let rows = playerData.filter((r) => r["Player"] === playerName && r[testHeader] !== undefined && r[testHeader] !== "");
    if (endDate) {
      rows = rows.filter((r) => {
        const d = new Date(r["Date"]);
        return !isNaN(d) && d <= endDate;
      });
    }

    // Sort by date ascending
    rows.sort((a, b) => new Date(a["Date"]) - new Date(b["Date"]));

    const lastRows = rows.slice(-testCount);
    const labels = lastRows.map((r) => r["Date"] || r["Phase"] || "N/A");
    const values = lastRows.map((r) => parseFloat(String(r[testHeader]).replace(/[^\d.\-]/g, '')) || null);
    const grpAvgValues = lastRows.map((r) => parseFloat(String(r[groupAvgHeader]).replace(/[^\d.\-]/g, '')) || null);
    const indvAvgValues = lastRows.map((r) => parseFloat(String(r[indvAvgHeader]).replace(/[^\d.\-]/g, '')) || null);
    const targetValues = lastRows.map((r) => parseFloat(String(r[targetHeader]).replace(/[^\d.\-]/g, '')) || null);

    const labelNice = testHeaders[testHeader] || testHeader;
    const ctx = canvas.getContext("2d");

    const datasets = [
      {
        label: `Value`,
        data: values,
        backgroundColor: "#3b82f6",
        borderRadius: 6,
      },
    ];

    // Add average and target lines if their headers exist in the data
    if (headers.includes(groupAvgHeader)) {
      datasets.push({
        label: `GRP Average`,
        data: grpAvgValues,
        type: 'line',
        borderColor: 'red',
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
      });
    }

    if (headers.includes(indvAvgHeader)) {
      datasets.push({
        label: `INDV Average`,
        data: indvAvgValues,
        type: 'line',
        borderColor: 'orange',
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
      });
    }

    if (headers.includes(targetHeader)) {
      datasets.push({
        label: `Target`,
        data: targetValues,
        type: 'line',
        borderColor: 'green',
        fill: false,
        pointRadius: 0,
      });
    }

    const newChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, title: { display: true, text: "Value" } }
        },
        plugins: {
          title: { display: false },
          tooltip: { callbacks: { label: (tooltipItem) => `${tooltipItem.dataset.label}: ${tooltipItem.raw}` } },
          legend: { display: true, position: 'top', align: 'start' },
        },
      },
    });
    chartInstances.push(newChart);
  });
}

// Event listeners and initial setup
uploadEl.addEventListener("change", handleCSVUpload);
populateTestCountDropdown();
window.generateReport = generateReport; // Expose to global scope for the button

// Helper function for escaping CSS selectors
function cssEscape(str) {
  return String(str).replace(/["\\\]]/g, "\\$&");
}
