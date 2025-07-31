const playerData = [];
const injuryData = [];

// Parse CSV into structured data
function parseCSV(text) {
  const rows = text.trim().split("\n").map(row => row.split(","));
  const headers = rows[0].map(h => h.trim());
  const data = rows.slice(1).map(row => {
    const obj = {};
    row.forEach((val, i) => {
      obj[headers[i]] = val.trim();
    });
    return obj;
  });

  const isTestData = headers.includes("Trial1") && headers.includes("Trial2");
  const isInjuryData = headers.includes("Injuries happened in 2023-24 season");

  return { data, isTestData, isInjuryData };
}

// Split the uploaded CSV file by type (test/injury)
function splitCSVSections(lines) {
  const sections = [];
  let current = [];

  lines.forEach(line => {
    if (
      line.includes("Player,Date,Phase,Test,Trial1,Trial2") ||
      line.includes("Name,Injuries happened in 2023-24 season")
    ) {
      if (current.length > 0) sections.push(current);
      current = [line];
    } else {
      current.push(line);
    }
  });

  if (current.length > 0) sections.push(current);
  return sections;
}

// Handle the uploaded file
function handleCSVUpload(event) {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    const lines = e.target.result.trim().split("\n");

    playerData.length = 0;
    injuryData.length = 0;

    const sections = splitCSVSections(lines);

    sections.forEach(sectionLines => {
      const sectionCSV = sectionLines.join("\n");
      const { data, isTestData, isInjuryData } = parseCSV(sectionCSV);

      if (isTestData) {
        data.forEach(row => {
          if (row.Player && row.Trial1 && row.Trial2) {
            playerData.push({
              player: row.Player.trim(),
              date: row.Date,
              phase: row.Phase,
              test: row.Test,
              trial1: parseFloat(row.Trial1),
              trial2: parseFloat(row.Trial2)
            });
          }
        });
      }

      if (isInjuryData) {
        data.forEach(row => {
          injuryData.push({
            name: row.Name.trim(),
            current: row["Injuries happened in 2023-24 season"],
            history: row["Injury history"],
            category: row["Eligible category"]
          });
        });
      }
    });

    populatePlayerSelect();
  };

  reader.readAsText(file);
}

// Populate player dropdown
function populatePlayerSelect() {
  const select = document.getElementById("playerSelect");
  select.innerHTML = '<option disabled selected>Select a player</option>';

  const allNames = new Set();
  playerData.forEach(p => allNames.add(p.player));
  injuryData.forEach(p => allNames.add(p.name));

  Array.from(allNames).forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });
}

// Generate Chart Report
function generateReport() {
  const player = document.getElementById("playerSelect").value;
  const testCount = parseInt(document.getElementById("testCountSelect").value);
  const selectedTest = document.getElementById("testTypeSelect").value;

  const filtered = playerData
    .filter(p => p.player === player && p.test === selectedTest)
    .slice(-testCount)
    .map(p => ({ ...p, best: Math.min(p.trial1, p.trial2) }));

  if (filtered.length === 0) {
    alert("No data available for selected player and test.");
    return;
  }

  const labels = filtered.map(p => `${p.date} (${p.phase})`);
  const data = filtered.map(p => p.best);

  const ctx = document.getElementById("chartCanvas").getContext("2d");
  if (window.bar) window.bar.destroy();
  window.bar = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: `${player} - Best Performance`,
        data,
        backgroundColor: "#2563eb"
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });

  displayInjuryInfo(player);
}

// Show injury info
function displayInjuryInfo(player) {
  const div = document.getElementById("injuryInfo");
  const info = injuryData.find(p => p.name === player);
  if (!info) {
    div.innerHTML = '';
    return;
  }

  div.innerHTML = `
    <h3>Injury Information</h3>
    <p><strong>Category:</strong> ${info.category}</p>
    <p><strong>2023-24 Injuries:</strong> ${info.current}</p>
    <p><strong>History:</strong> ${info.history}</p>
  `;
}

// Attach event
document.getElementById("uploadCSV").addEventListener("change", handleCSVUpload);
