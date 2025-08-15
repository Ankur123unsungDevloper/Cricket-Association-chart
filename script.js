let playerData = [];      // parsed CSV rows (objects keyed by headers)
let headers = [];         // CSV headers
let chartInstances = [];  // Chart.js instances (for 2 canvases)
const MAX_SELECTED_TESTS = 2;

// Map CSV headers -> nice labels shown on cards
const testHeaders = {
  "10m Best (sec)": "10m",
  "20m Best (sec)": "20m",
  "40m Best (sec)": "40m",
  "Yo-Yo Level": "YoYo",
  "SBJ Best (mts)": "SBJ",
  "S/L Glute Bridges (Sec)": "S/L Glute Bridges (Sec)",
  "SL Lunge Calf Raises": "SL Lunge Calf Raises",
  "MB Rotational Throws": "MB Rotational Throws",
  "Copenhagen (Sec)": "Copenhagen (Sec)",
  "S/L Hop Left": "S/L Hop",
  "Run A 3 Best(sec)": "Run A 3",
  "Run A 3×6 Best(sec)": "Run A 3×6",
  "1 Mile Time (min)": "1 Mile",
  "Push-ups Count": "Push-ups",
  "2 KM Time (min)": "2 KM",
  "CMJ Score": "CMJ Scores",
  // your CSV example fields (these won't be plotted; just here so they don't show up as tests)
  "WEIGHT": "WEIGHT"
};

/* ======= DOM refs (must exist in your HTML) ======= */
const uploadEl        = document.getElementById("uploadCSV");
const playerSelect    = document.getElementById("playerSelect");
const testCountSelect = document.getElementById("testCountSelect");
const dateInput       = document.getElementById("dateInput");
const canvas1         = document.getElementById("chartCanvas1");
const canvas2         = document.getElementById("chartCanvas2");
const availableCol    = document.getElementById("availableTests");
const selectedCol     = document.getElementById("selectedTests");
const dragDropWrap    = document.querySelector(".drag-drop-container");
const chartHeader     = document.querySelector(".chart-header"); // header card target

/* ======= Hide areas until CSV is uploaded / form is valid ======= */
if (dragDropWrap) dragDropWrap.style.display = "none";
if (chartHeader)  chartHeader.style.display  = "none";

/* ======= CSV parsing ======= */
function parseCSVText(text) {
  const rows = text.replace(/\r/g, "").split("\n").filter(r => r.trim() !== "");
  if (rows.length === 0) return { hdr: [], data: [] };

  let headerIdx = rows.findIndex(r => r.split(",").map(c => c.trim().toLowerCase()).includes("player"));
  if (headerIdx === -1) headerIdx = 0;

  const hdrCells = rows[headerIdx].split(",").map(h => h.trim());
  const dataRows = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const cells = rows[i].split(",");
    if (cells.length <= 1 && !cells[0]?.trim()) continue;
    const obj = {};
    for (let j = 0; j < hdrCells.length; j++) {
      obj[hdrCells[j]] = (cells[j] !== undefined) ? cells[j].trim() : "";
    }
    dataRows.push(obj);
  }
  return { hdr: hdrCells, data: dataRows };
}

/* ======= Populate players ======= */
function populatePlayerDropdown() {
  playerSelect.innerHTML = '<option disabled selected>Select a player</option>';
  const uniquePlayers = [...new Set(playerData.map(r => r["Player"]).filter(Boolean))];
  uniquePlayers.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    playerSelect.appendChild(opt);
  });
}

/* ======= Build test cards (Available column) ======= */
function buildAvailableTestCards() {
  if (dragDropWrap) dragDropWrap.style.display = "";

  availableCol.innerHTML = "<h3>Available Tests</h3>";
  selectedCol.innerHTML  = "<h3>Selected Tests</h3>";

  // Only include tests that exist in this CSV and are numeric-ish metrics (exclude identity fields)
  const nonTestFields = new Set([
    "Player","Date","Phase","Age Category","Gender","Sex","DOB","Role",
    "Position","Dominant Hand","Handedness","Coach Name", "WEIGHT"
  ]);
  const availableCSVTests = Object.keys(testHeaders)
    .filter(h => headers.includes(h) && !nonTestFields.has(h));

  const listToUse = availableCSVTests.length ? availableCSVTests
    : headers.filter(h => !nonTestFields.has(h));

  listToUse.forEach(csvHeader => {
    const card = makeTestCard(csvHeader, testHeaders[csvHeader] || csvHeader);
    availableCol.appendChild(card);
  });

  enableColumnDnD(availableCol);
  enableColumnDnD(selectedCol);
}

/* ======= Create a draggable test card ======= */
function makeTestCard(csvHeader, label) {
  const card = document.createElement("div");
  card.className = "test-card";
  card.draggable = true;
  card.dataset.header = csvHeader;
  card.dataset.label  = label;
  card.style.padding = "8px 10px";
  card.style.marginTop = "8px";
  card.style.background = "#f8fafc";
  card.style.border = "1px solid #e5e7eb";
  card.style.borderRadius = "8px";
  card.style.cursor = "grab";
  card.textContent = label;

  card.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", csvHeader);
    e.currentTarget.style.opacity = "0.5";
    card.classList.add("dragging");
  });
  card.addEventListener("dragend", (e) => {
    e.currentTarget.style.opacity = "1";
    card.classList.remove("dragging");
  });

  // Click to toggle between columns (useful on mobile)
  card.addEventListener("click", () => {
    if (card.parentElement === availableCol) {
      tryMoveToSelected(card);
    } else {
      availableCol.appendChild(card);
    }
  });

  return card;
}

/* ======= Enable drop behavior on a column ======= */
function enableColumnDnD(colEl) {
  colEl.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  });

  colEl.addEventListener("drop", (e) => {
    e.preventDefault();
    const csvHeader = e.dataTransfer.getData("text/plain");
    if (!csvHeader) return;
    const card = document.querySelector(`.test-card[data-header="${cssEscape(csvHeader)}"]`);
    if (!card) return;

    if (colEl === selectedCol) {
      tryMoveToSelected(card, e);
    } else {
      availableCol.appendChild(card);
    }
  });

  // Reorder inside selected column by pointer position
  if (colEl === selectedCol) {
    colEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      const afterEl = getDragAfterElement(colEl, e.clientY);
      const draggingHeader = e.dataTransfer.getData("text/plain");
      const draggingCard = document.querySelector(`.test-card[data-header="${cssEscape(draggingHeader)}"]`);
      if (!draggingCard) return;
      if (afterEl == null) {
        colEl.appendChild(draggingCard);
      } else if (afterEl !== draggingCard) {
        colEl.insertBefore(draggingCard, afterEl);
      }
    });
  }
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll(".test-card:not(.dragging)")];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

/* ======= Move to Selected with cap of 2 ======= */
function tryMoveToSelected(card, dropEvent = null) {
  const count = getSelectedTestHeaders().length;
  if (count >= MAX_SELECTED_TESTS) {
    alert(`You can select up to ${MAX_SELECTED_TESTS} tests.`);
    return;
  }
  if (dropEvent) {
    const afterEl = getDragAfterElement(selectedCol, dropEvent.clientY);
    if (afterEl == null) selectedCol.appendChild(card);
    else selectedCol.insertBefore(card, afterEl);
  } else {
    selectedCol.appendChild(card);
  }
}

function getSelectedTestHeaders() {
  return [...selectedCol.querySelectorAll(".test-card")].map(c => c.dataset.header);
}

/* ======= CSV upload handler ======= */
uploadEl.addEventListener("change", handleCSVUpload);

function handleCSVUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    const text = ev.target.result;
    const parsed = parseCSVText(text);
    headers = (parsed.hdr || []).map(h => h.trim());
    playerData = parsed.data || [];

    if (!headers.some(h => h.toLowerCase() === "player")) {
      alert("CSV does not contain 'Player' header. Please check file.");
      return;
    }

    // Reset UI
    if (chartHeader) chartHeader.style.display = "none";
    populatePlayerDropdown();
    buildAvailableTestCards();
    destroyCharts();
    clearCanvas(canvas1);
    clearCanvas(canvas2);
  };
  reader.readAsText(file);
}

/* ======= Chart helpers ======= */
function destroyCharts() {
  chartInstances.forEach(c => { try { c.destroy(); } catch(e){} });
  chartInstances = [];
}
function clearCanvas(cv) {
  if (!cv) return;
  const ctx = cv.getContext("2d");
  ctx.clearRect(0, 0, cv.width, cv.height);
}

/* ======= Date parser ======= */
function parseDateVal(val) {
  if (!val) return null;
  const iso = new Date(val);
  if (!isNaN(iso)) return iso;
  const m = val.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})/);
  if (m) {
    const d = parseInt(m[1],10), mm = parseInt(m[2],10)-1, y = parseInt(m[3],10);
    return new Date(y, mm, d);
  }
  return null;
}

/* ======= Build + render header card (only after valid form) ======= */
function getPlayerRow(playerName) {
  return playerData.find(r => r["Player"] === playerName) || {};
}

function buildHeaderHTML(playerName) {
  const row = getPlayerRow(playerName);
  const name = row["Player"] || playerName || "-";
  const gender = row["Gender"] || "";                 // not in your CSV
  const age = row["Age Category"] || "";              // in your CSV
  const handed = row["Handedness"] || "";             // not in your CSV
  const role = row["Role"] || "Batsman";              // default if missing

  // Inline-styled card (green theme)
  return `
  <div style="width:100%; background:#1b4d2e; border:2px solid #f59e0b; color:#fff; border-radius:8px; overflow:hidden;">
    <div style="padding:6px 10px; text-align:center; font-weight:700; font-style:italic; border-bottom:1px solid rgba(255,255,255,.2);">
      Individual Report - ${name.toUpperCase()}
    </div>
    <div style="display:flex; gap:10px; padding:10px;">
      <div style="flex:0 0 90px; background:#114224; border:1px solid rgba(255,255,255,.15); border-radius:4px; min-height:90px;"></div>
      <div style="flex:1;">
        <table style="width:100%; border-collapse:collapse; font-size:13px;">
          <thead style="display:none"></thead>
          <tbody>
            ${rowCell('Name', name)}
            ${rowCell('Gender', gender)}
            ${rowCell('Age', age)}
            ${rowCell('Handedness', handed)}
            ${rowCell('Role', role)}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  `;
  function rowCell(label, value){
    return `
      <tr>
        <td style="width:40%; border:1px solid rgba(255,255,255,.25); padding:6px 8px; text-align:center; font-weight:600;">${label}</td>
        <td id="player${label}Cell" style="border:1px solid rgba(255,255,255,.25); padding:6px 8px; text-align:center;">${value || ""}</td>
      </tr>`;
  }
}

/* ======= Generate Report (plots two charts + shows header) ======= */
function generateReport() {
  const playerName = playerSelect.value;
  if (!playerName) { alert("Please select a player."); return; }

  const selectedHeaders = getSelectedTestHeaders();
  if (selectedHeaders.length === 0) {
    alert("Please drag tests to 'Selected Tests' (up to 2).");
    return;
  }
  if (selectedHeaders.length > MAX_SELECTED_TESTS) {
    alert(`Please keep only ${MAX_SELECTED_TESTS} tests in 'Selected Tests'.`);
    return;
  }

  const testCount = parseInt(testCountSelect.value, 10);
  if (!testCount || isNaN(testCount)) { alert("Please select Number of Recent Tests."); return; }

  const endDate = parseDateVal(dateInput.value);

  // Header: show only now (form is valid) and fill with CSV info
  if (chartHeader) {
    chartHeader.innerHTML = buildHeaderHTML(playerName);
    chartHeader.style.display = ""; // reveal
  }

  // Charts
  destroyCharts();
  clearCanvas(canvas1);
  clearCanvas(canvas2);

  const canvases = [canvas1, canvas2];
  selectedHeaders.forEach((testHeader, idx) => {
    if (!canvases[idx]) return;

    let rows = playerData.filter(r => r["Player"] === playerName && r[testHeader] !== undefined && r[testHeader] !== "");

    if (endDate) {
      rows = rows.filter(r => {
        const d = parseDateVal(r["Date"]);
        if (!d) return false;
        return d <= endDate;
      });
    }

    // sort by date asc
    rows.sort((a,b) => {
      const da = parseDateVal(a["Date"]); const db = parseDateVal(b["Date"]);
      if (da && db) return da - db;
      if (da && !db) return 1;
      if (!da && db) return -1;
      return 0;
    });

    const lastRows = rows.slice(-testCount);
    const labels = lastRows.map(r => (r["Date"] || r["Phase"] || "").toString());
    const values = lastRows.map(r => {
      const v = r[testHeader];
      const num = parseFloat(String(v).replace(/[^\d.\-]/g,''));
      return isNaN(num) ? null : num;
    });

    const labelNice = testHeaders[testHeader] || testHeader;
    const ctx = canvases[idx].getContext("2d");

    const c = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: `${playerName} - ${labelNice}`,
          data: values,
          backgroundColor: "#3b82f6",
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, title: { display: true, text: "Value" } }
        },
        plugins: {
          title: { display: false },
          tooltip: {
            callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}` }
          },
          legend: { display: true }
        }
      }
    });
    chartInstances.push(c);
  });

  if (selectedHeaders.length === 1) clearCanvas(canvas2);
}

// Attach generateReport for your button onclick
window.generateReport = generateReport;

/* ======= Enter key triggers report when focus is on inputs ======= */
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter') {
    const active = document.activeElement;
    if ([playerSelect, testCountSelect, dateInput].includes(active)) {
      ev.preventDefault();
      generateReport();
    }
  }
});

/* ======= Small helper to escape attribute selectors ======= */
function cssEscape(str) {
  return String(str).replace(/["\\\]]/g, "\\$&");
}
