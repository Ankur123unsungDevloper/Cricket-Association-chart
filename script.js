let playerData = [];      // raw rows (objects keyed by headers)
let headers = [];         // CSV headers
let chartInstances = [];  // keep references to charts to destroy later
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
  "CMJ Score": "CMJ Scores"
};

// DOM refs
const uploadEl = document.getElementById("uploadCSV");
const playerSelect = document.getElementById("playerSelect");
const testSelect = document.getElementById("testTypeSelect");
const testCountSelect = document.getElementById("testCountSelect");
const dateInput = document.getElementById("dateInput");
const chartContainer = document.querySelector(".chart-container");

// Create and insert selected-tests box (if not present in HTML)
let selectedBox = document.getElementById("selectedTestsBox");
if (!selectedBox) {
  selectedBox = document.createElement("div");
  selectedBox.id = "selectedTestsBox";
  selectedBox.style.marginTop = "8px";
  selectedBox.style.padding = "8px";
  selectedBox.style.border = "1px dashed #d1d5db";
  selectedBox.style.borderRadius = "8px";
  selectedBox.style.minHeight = "40px";
  selectedBox.style.background = "#fff";
  selectedBox.innerHTML = `<small style="color:#6b7280">Selected tests (drag to reorder)</small>`;
  // place after testSelect
  testSelect.parentNode.insertBefore(selectedBox, testSelect.nextSibling);
}

// Make the test select allow multi-selection (JS change so no HTML edit required)
testSelect.multiple = true;
testSelect.size = 6; // give visible rows

// Utility: simple CSV parse (handles basic commas; expects header row present)
function parseCSVText(text) {
  // normalize line endings
  const rows = text.replace(/\r/g, "").split("\n").filter(r => r.trim() !== "");
  if (rows.length === 0) return { hdr: [], data: [] };

  // find header row index (we search for a row containing "Player" header)
  let headerIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].split(",").map(c => c.trim());
    if (cells.some(c => c.toLowerCase() === "player")) { headerIdx = i; break; }
  }
  if (headerIdx === -1) {
    // fallback use first row
    headerIdx = 0;
  }

  const hdrCells = rows[headerIdx].split(",").map(h => h.trim());
  const dataRows = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const cells = rows[i].split(",");
    // ignore rows that are too short or empty
    if (cells.length <= 1 && !cells[0].trim()) continue;
    const obj = {};
    for (let j = 0; j < hdrCells.length; j++) {
      obj[hdrCells[j]] = (cells[j] !== undefined) ? cells[j].trim() : "";
    }
    dataRows.push(obj);
  }
  return { hdr: hdrCells, data: dataRows };
}

// Populate players & tests after CSV parsing
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

// Populate tests select using testHeaders mapping but only show those headers present in CSV
function populateTestDropdown() {
  // preserve current selection if possible
  const prevSelected = Array.from(testSelect.selectedOptions).map(o => o.value);
  testSelect.innerHTML = '';
  // Build list of CSV headers that map to friendly names and exist in CSV
  const available = Object.keys(testHeaders).filter(h => headers.includes(h));
  // If none from mapping exist, optionally include any numeric-ish headers
  if (available.length === 0) {
    // include headers that look like tests (not Player/Date/Phase)
    const fallback = headers.filter(h => !["Player","Date","Phase","Age Category"].includes(h));
    fallback.forEach(h => {
      const opt = document.createElement("option"); opt.value = h; opt.textContent = h; testSelect.appendChild(opt);
    });
    return;
  }
  available.forEach(csvH => {
    const opt = document.createElement("option");
    opt.value = csvH;
    opt.textContent = testHeaders[csvH] || csvH;
    testSelect.appendChild(opt);
  });
  // restore previous selection where possible
  Array.from(testSelect.options).forEach(opt => {
    if (prevSelected.includes(opt.value)) opt.selected = true;
  });
  renderSelectedTestsBox(); // reflect any selection
}

// Renders selected-tests box and enables drag/drop ordering
function renderSelectedTestsBox() {
  // clear existing items except header hint
  selectedBox.innerHTML = `<small style="color:#6b7280">Selected tests (drag to reorder)</small>`;
  const selected = Array.from(testSelect.selectedOptions).map(o => ({ value: o.value, label: o.textContent }));
  if (selected.length === 0) {
    const p = document.createElement("div"); p.style.color = "#9ca3af"; p.style.marginTop = "8px";
    p.textContent = "No tests selected yet (select from list above)";
    selectedBox.appendChild(p);
    return;
  }

  const list = document.createElement("div");
  list.id = "testOrderList";
  list.style.marginTop = "8px";
  list.style.display = "flex";
  list.style.flexDirection = "column";
  list.style.gap = "6px";

  selected.forEach(item => {
    const it = document.createElement("div");
    it.className = "sel-test-item";
    it.draggable = true;
    it.dataset.value = item.value;
    it.style.padding = "8px 10px";
    it.style.background = "#f8fafc";
    it.style.border = "1px solid #e5e7eb";
    it.style.borderRadius = "8px";
    it.style.cursor = "grab";
    it.style.display = "flex";
    it.style.justifyContent = "space-between";
    it.style.alignItems = "center";
    it.innerHTML = `<span style="font-weight:600;color:#111827">${item.label}</span><small style="color:#6b7280;margin-left:8px">☰</small>`;

    // drag handlers
    it.addEventListener("dragstart", (ev) => {
      ev.dataTransfer.setData("text/plain", item.value);
      ev.currentTarget.style.opacity = "0.4";
    });
    it.addEventListener("dragend", (ev) => {
      ev.currentTarget.style.opacity = "1";
    });
    it.addEventListener("dragover", (ev) => {
      ev.preventDefault();
      ev.dataTransfer.dropEffect = "move";
    });
    it.addEventListener("drop", (ev) => {
      ev.preventDefault();
      const draggedValue = ev.dataTransfer.getData("text/plain");
      const target = ev.currentTarget.dataset.value;
      reorderSelectedTests(draggedValue, target);
    });

    list.appendChild(it);
  });

  selectedBox.appendChild(list);
}

// Reorder function: swap dragged item to before target
function reorderSelectedTests(draggedValue, targetValue) {
  // build current ordered array from box items
  const list = Array.from(document.querySelectorAll("#testOrderList .sel-test-item"));
  const values = list.map(n => n.dataset.value);
  const fromIdx = values.indexOf(draggedValue);
  let toIdx = values.indexOf(targetValue);
  if (fromIdx === -1 || toIdx === -1) return;
  // remove and insert dragged at toIdx (before target)
  values.splice(fromIdx, 1);
  values.splice(toIdx, 0, draggedValue);

  // reflect this order back to the <select> by setting selected options in new order
  // Clear selection, then set in order by re-appending options into select (to preserve order visually)
  const optionsMap = {};
  Array.from(testSelect.options).forEach(o => optionsMap[o.value] = o);
  testSelect.innerHTML = '';
  values.forEach(v => {
    const o = optionsMap[v];
    if (o) {
      const newOpt = document.createElement("option");
      newOpt.value = o.value;
      newOpt.textContent = o.textContent;
      newOpt.selected = true;
      testSelect.appendChild(newOpt);
    }
  });
  // append any remaining options (not selected)
  Object.values(optionsMap).forEach(o => {
    if (!values.includes(o.value)) {
      const newOpt = document.createElement("option");
      newOpt.value = o.value;
      newOpt.textContent = o.textContent;
      testSelect.appendChild(newOpt);
    }
  });

  // re-render the box to reflect new order
  renderSelectedTestsBox();
}


// Attach events
uploadEl.addEventListener("change", handleCSVUpload);
testSelect.addEventListener("change", renderSelectedTestsBox);

// CSV upload & parse
function handleCSVUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (ev) {
    const text = ev.target.result;
    const parsed = parseCSVText(text);
    headers = parsed.hdr || [];
    playerData = parsed.data || [];

    // Basic normalization: trim header names
    headers = headers.map(h => h.trim());

    if (!headers.some(h => h.toLowerCase() === "player")) {
      alert("CSV does not contain 'Player' header. Please check file.");
      return;
    }

    populatePlayerDropdown();
    populateTestDropdown();
    // clear charts area
    clearCharts();
  };
  reader.readAsText(file);
}

// helper to clear chart area and destroy Chart instances
function clearCharts() {
  chartInstances.forEach(c => { try { c.destroy(); } catch(e){} });
  chartInstances = [];
  chartContainer.innerHTML = `<canvas id="chartCanvas"></canvas>`;
}

// Helper: parse date string into Date object if possible
function parseDateVal(val) {
  if (!val) return null;
  // Try ISO first
  const iso = new Date(val);
  if (!isNaN(iso)) return iso;
  // try dd-mm-yyyy or dd/mm/yyyy
  const m = val.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})/);
  if (m) {
    const d = parseInt(m[1],10), mm = parseInt(m[2],10)-1, y = parseInt(m[3],10);
    return new Date(y, mm, d);
  }
  return null;
}

// Main: generate report -> build charts for all selected tests (in order)
function generateReport() {
  // validations
  const playerName = playerSelect.value;
  const selectedOptions = Array.from(testSelect.selectedOptions).map(o => o.value);
  const testCount = parseInt(testCountSelect.value, 10);
  const endDateVal = dateInput.value; // format YYYY-MM-DD from date input
  const endDate = parseDateVal(endDateVal);

  if (!playerName) { alert("Please select a player."); return; }
  if (!selectedOptions || selectedOptions.length === 0) { alert("Please select one or more tests."); return; }
  if (!testCount || isNaN(testCount)) { alert("Please select Number of Recent Tests."); return; }

  // for each test, collect rows for the player where that test has a value, up to endDate (if provided)
  // we will create one chart per test, in the same order as selectedOptions

  // Clear previous charts area and any table/header
  chartContainer.innerHTML = ""; // we'll append many canvases
  chartInstances.forEach(c => { try { c.destroy(); } catch(e){} });
  chartInstances = [];

  // Optional: Header area (player details) at top of chartContainer
  const headerDiv = document.createElement("div");
  headerDiv.style.width = "100%";
  headerDiv.style.marginBottom = "12px";
  headerDiv.innerHTML = buildPlayerHeaderHTML(playerName);
  chartContainer.appendChild(headerDiv);

  selectedOptions.forEach(testHeader => {
    // filter rows for player and present value
    let rows = playerData.filter(r => r["Player"] === playerName && r[testHeader] !== undefined && r[testHeader] !== "");
    // filter by endDate if provided: accept rows with Date or without Date (if Phase only, we keep them)
    if (endDate) {
      rows = rows.filter(r => {
        const d = parseDateVal(r["Date"]);
        if (!d) return false; // if we require up-to-date, skip rows w/o Date
        return d <= endDate;
      });
    }
    // sort by Date ascending where possible (to take last N)
    rows.sort((a,b) => {
      const da = parseDateVal(a["Date"]); const db = parseDateVal(b["Date"]);
      if (da && db) return da - db;
      if (da && !db) return 1;
      if (!da && db) return -1;
      // fallback stable
      return 0;
    });

    // take last N
    const lastRows = rows.slice(-testCount);

    // labels & values
    const labels = lastRows.map(r => (r["Date"] || r["Phase"] || "").toString());
    const values = lastRows.map(r => {
      const v = r[testHeader];
      // try to parse numeric
      const num = parseFloat(String(v).replace(/[^\d.\-]/g,'')); // remove stray chars
      return isNaN(num) ? null : num;
    });

    // Create a sub-container for this test (title + canvas + small table)
    const section = document.createElement("div");
    section.style.width = "100%";
    section.style.marginBottom = "18px";
    section.style.background = "#fff";
    section.style.padding = "12px";
    section.style.borderRadius = "8px";
    section.style.boxShadow = "0 4px 10px rgba(0,0,0,0.03)";
    // Title
    const title = document.createElement("h3");
    title.textContent = testHeaders[testHeader] || testHeader;
    title.style.margin = "0 0 8px 0";
    title.style.fontSize = "18px";
    section.appendChild(title);

    // canvas
    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "240px";
    section.appendChild(canvas);

    // small table under chart
    const tbl = document.createElement("table");
    tbl.style.width = "100%";
    tbl.style.borderCollapse = "collapse";
    tbl.style.marginTop = "10px";
    const thead = document.createElement("thead");
    const thr = document.createElement("tr");
    ["Date/Phase", (testHeaders[testHeader] || testHeader)].forEach(h => {
      const th = document.createElement("th");
      th.textContent = h;
      th.style.textAlign = "left";
      th.style.padding = "6px 8px";
      th.style.borderBottom = "1px solid #e6e6e6";
      th.style.fontSize = "13px";
      thr.appendChild(th);
    });
    thead.appendChild(thr);
    tbl.appendChild(thead);

    const tbody = document.createElement("tbody");
    lastRows.forEach((r) => {
      const tr = document.createElement("tr");
      const td1 = document.createElement("td");
      td1.textContent = r["Date"] || r["Phase"] || "";
      td1.style.padding = "6px 8px";
      const td2 = document.createElement("td");
      td2.textContent = r[testHeader] || "";
      td2.style.padding = "6px 8px";
      tr.appendChild(td1); tr.appendChild(td2);
      tbody.appendChild(tr);
    });
    tbl.appendChild(tbody);
    section.appendChild(tbl);

    chartContainer.appendChild(section);

    // draw chart using Chart.js
    const ctx = canvas.getContext("2d");
    const c = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: `${playerName} - ${testHeaders[testHeader] || testHeader}`,
          data: values,
          backgroundColor: "#3b82f6",
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: "Value" }
          }
        },
        plugins: {
          title: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                return `${ctx.dataset.label}: ${ctx.raw}`;
              }
            }
          }
        }
      }
    });
    chartInstances.push(c);
  });
}

// Build player header area HTML: tries to pull gender/age/role/handedness/coach from the first matching row in playerData
function buildPlayerHeaderHTML(playerName) {
  const row = playerData.find(r => r["Player"] === playerName) || {};
  const gender = row["Gender"] || row["Sex"] || "N/A";
  const age = row["Age"] || row["Age Category"] || row["DOB"] || "N/A";
  const handedness = row["Handedness"] || row["Dominant Hand"] || "N/A";
  const role = row["Role"] || row["Position"] || "N/A";
  const coachName = row["Coach Name"] || "Coach Name";

  // minimal styled header HTML: you can expand/adjust to match exact visual screenshot later in CSS
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#0b5fff;color:#fff;border-radius:8px;">
      <div>
        <div style="font-weight:700;font-size:18px">Cricket Association</div>
        <div style="margin-top:6px;font-weight:700">Individual Report - ${playerName}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:14px">Gender: ${gender}</div>
        <div style="font-size:14px">Age: ${age}</div>
        <div style="font-size:14px">Handedness: ${handedness}</div>
        <div style="font-size:14px">Role: ${role}</div>
        <div style="font-size:12px;margin-top:6px">Coach: ${coachName}</div>
      </div>
    </div>
  `;
}

// Expose generateReport globally if called from inline onclick
window.generateReport = generateReport;

// OPTIONAL: If you want the Fetch Report button to be triggered with Enter key when selects are focused
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter') {
    // don't accidentally submit when typing in other inputs
    // require that playerSelect is focused or testSelect focused
    const active = document.activeElement;
    if ([playerSelect, testSelect, testCountSelect, dateInput].includes(active)) {
      ev.preventDefault();
      generateReport();
    }
  }
});
