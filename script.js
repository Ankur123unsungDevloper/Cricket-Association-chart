const playerData = [];
const injuryData = [
  { name: "PLAYER 78", current: "Right hand middle finger split webbing, Right adductor strain", history: "Right scapula tightness", category: "Senior" },
  { name: "PLAYER 40", current: "Nil", history: "Right ACL tear 2021, Left Hamstring pull 2023", category: "Under 23" }
];

// Parse CSV into array of objects
function parseCSV(text) {
  const rows = text.trim().split('\n');
  const headers = rows[0].split(',');
  return rows.slice(1).map(row => {
    const values = row.split(',');
    const obj = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = values[i].trim();
    });
    return obj;
  });
}

// Handle CSV upload
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
    generateReport();
  };
  reader.readAsText(file);
}

// Populate dropdown with unique player names
function populatePlayerSelect() {
  const select = document.getElementById("playerSelect");
  select.innerHTML = "";
  const players = [...new Set(playerData.map(p => p.player))];
  players.forEach(player => {
    const option = document.createElement("option");
    option.value = player;
    option.textContent = player;
    select.appendChild(option);
  });
}

// Generate chart and injury report
function generateReport() {
  const player = document.getElementById('playerSelect').value;
  const testCount = parseInt(document.getElementById('testCount').value);
  const tests = [...document.querySelectorAll('#testOptions input:checked')].map(e => e.value);

  const filtered = playerData
    .filter(p => p.player === player && tests.includes(p.test))
    .slice(-testCount)
    .map(p => ({ ...p, best: Math.min(p.trial1, p.trial2) }));

  const labels = filtered.map(p => `${p.date} (${p.phase})`);
  const data = filtered.map(p => p.best);

  const ctx = document.getElementById('chartCanvas').getContext('2d');
  if (window.bar) window.bar.destroy();
  window.bar = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: `${player} 10m Best Time`,
        data,
        backgroundColor: '#3498db'
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });

  // Show injury report
  const injury = injuryData.find(i => i.name === player);
  const container = document.getElementById("injuryHistory");
  if (injury) {
    container.innerHTML = `
      <h2>Injury History</h2>
      <table>
        <thead>
          <tr>
            <th>Injuries (2023-24)</th>
            <th>History</th>
            <th>Category</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${injury.current}</td>
            <td>${injury.history}</td>
            <td>${injury.category}</td>
          </tr>
        </tbody>
      </table>
    `;
  } else {
    container.innerHTML = "<p>No injury history available.</p>";
  }
}

document.getElementById("uploadCSV").addEventListener("change", handleCSVUpload);
