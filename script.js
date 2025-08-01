let playerData = [];
let chart;

document.getElementById("uploadCSV").addEventListener("change", handleCSVUpload);

function handleCSVUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const content = e.target.result;
    parseCSV(content);
  };
  reader.readAsText(file);
}

function parseCSV(csv) {
  const lines = csv.trim().split(/\r?\n/).map(row => row.split(",").map(cell => cell.trim()));
  let headerIndex = lines.findIndex(row => row.includes("Player") && row.includes("Date"));

  if (headerIndex === -1) {
    alert("CSV must include 'Player' and 'Date' columns.");
    return;
  }

  const headers = lines[headerIndex];
  playerData = lines.slice(headerIndex + 1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h.trim()] = row[i] || "");
    return obj;
  });

  populatePlayerDropdown();
  populateTestDropdown(headers);
}

function populatePlayerDropdown() {
  const playerSelect = document.getElementById("playerSelect");
  playerSelect.innerHTML = `<option disabled selected>Select a player</option>`;

  const uniquePlayers = [...new Set(playerData.map(d => d["Player"]).filter(Boolean))];

  uniquePlayers.forEach(player => {
    const opt = document.createElement("option");
    opt.value = player;
    opt.textContent = player;
    playerSelect.appendChild(opt);
  });
}

function populateTestDropdown(headers) {
  const testSelect = document.getElementById("testTypeSelect");
  testSelect.innerHTML = `<option disabled selected>Select a test</option>`;

  const testColumns = headers.filter(h => !["Player", "Date", "Phase", "Age Category"].includes(h));
  testColumns.forEach(test => {
    const opt = document.createElement("option");
    opt.value = test;
    opt.textContent = test;
    testSelect.appendChild(opt);
  });
}

function generateReport() {
  const player = document.getElementById("playerSelect").value;
  const test = document.getElementById("testTypeSelect").value;
  const count = parseInt(document.getElementById("testCountSelect").value);

  if (!player || !test || isNaN(count)) {
    alert("Please select all fields");
    return;
  }

  const filtered = playerData
    .filter(row => row["Player"] === player && row[test])
    .slice(-count);

  if (filtered.length === 0) {
    alert("No matching data found for this player and test.");
    return;
  }

  const labels = filtered.map(d => d["Date"] || "");
  const values = filtered.map(d => parseFloat(d[test]) || 0);

  if (chart) chart.destroy();

  const ctx = document.getElementById("chartCanvas").getContext("2d");
  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: `${player} - ${test}`,
        data: values,
        backgroundColor: "#3b82f6",
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Performance Chart",
          font: { size: 18 }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Score / Time / Value" }
        }
      }
    }
  });
}
