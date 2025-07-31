const playerData = [];

function parseCSV(text) {
  const rows = text.trim().split('\n');
  const headers = rows[0].split(',');
  return rows.slice(1).map(row => {
    const values = row.split(',');
    const obj = {};
    headers.forEach((h, i) => obj[h.trim()] = values[i].trim());
    return obj;
  });
}

function handleCSVUpload(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    const csvData = parseCSV(e.target.result);
    playerData.length = 0;
    csvData.forEach(row => {
      playerData.push({
        player: row.Player,
        date: row.Date,
        phase: row.Phase,
        test: row.Test,
        trial1: parseFloat(row.Trial1),
        trial2: parseFloat(row.Trial2)
      });
    });
    populatePlayerSelect();
  };
  reader.readAsText(file);
}

function populatePlayerSelect() {
  const select = document.getElementById("playerSelect");
  select.innerHTML = "<option>Select a player</option>";
  const players = [...new Set(playerData.map(p => p.player))];
  players.forEach(player => {
    const option = document.createElement("option");
    option.value = player;
    option.textContent = player;
    select.appendChild(option);
  });
}

function generateReport() {
  const player = document.getElementById("playerSelect").value;
  const testCount = parseInt(document.getElementById("testCountSelect").value);
  const selectedTest = document.getElementById("testTypeSelect").value;

  const filtered = playerData
    .filter(p => p.player === player && p.test === selectedTest)
    .slice(-testCount)
    .map(p => ({ ...p, best: Math.min(p.trial1, p.trial2) }));

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
}

document.getElementById("uploadCSV").addEventListener("change", handleCSVUpload);
