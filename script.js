const playerData = [
  { player: "PLAYER 26", date: "2023-04-02", phase: "Pre-Season Assessment", trial1: 1.99, trial2: 1.90, best: 1.90 },
  { player: "PLAYER 29", date: "2023-04-02", phase: "Pre-Season Assessment", trial1: 1.94, trial2: 1.91, best: 1.91 },
  { player: "PLAYER 66", date: "2023-04-05", phase: "Pre-Season Assessment", trial1: 2.12, trial2: 2.00, best: 2.00 },
  { player: "PLAYER 78", date: "2023-04-05", phase: "Pre-Season Assessment", trial1: 2.09, trial2: 2.00, best: 2.00 },
  { player: "PLAYER 40", date: "2023-08-08", phase: "Buchi Babu Trophy", trial1: 1.97, trial2: 1.97, best: 1.97 },
  { player: "PLAYER 40", date: "2024-03-07", phase: "Post Season IFA", trial1: 2.07, trial2: 2.07, best: 2.07 },
];

const injuryData = [
  { name: "PLAYER 26", seasonInjury: "Nil", history: "Nil", category: "Under 23" },
  { name: "PLAYER 29", seasonInjury: "Nil", history: "Nil", category: "Senior" },
  { name: "PLAYER 40", seasonInjury: "Nil", history: "Right ACL complete tear 2021, Left Hamstring pull 2023", category: "Under 23" },
  { name: "PLAYER 78", seasonInjury: "Right hand middle finger split webbing- 4 stitches, Right adductor strain", history: "Right scapula tightness", category: "Senior" },
];

const playerSelect = document.getElementById("playerSelect");
const reportContainer = document.getElementById("reportContainer");

const uniquePlayers = [...new Set(playerData.map(d => d.player))];
uniquePlayers.forEach(p => {
  const option = document.createElement("option");
  option.value = p;
  option.textContent = p;
  playerSelect.appendChild(option);
});

function generateReport() {
  const player = playerSelect.value;
  const count = parseInt(document.getElementById("recentCount").value);
  const include10m = document.getElementById("test10m").checked;

  reportContainer.innerHTML = "";

  // Update header
  document.getElementById("playerName").textContent = player;
  document.getElementById("playerAge").textContent = "28.19";
  document.getElementById("playerRole").textContent = "Batsman";

  if (include10m) {
    const filtered = playerData.filter(d => d.player === player).slice(0, count);
    const ctx = document.createElement("canvas");
    reportContainer.appendChild(ctx);

    new Chart(ctx, {
      type: "bar",
      data: {
        labels: filtered.map(d => d.date + " (" + d.phase + ")"),
        datasets: [{
          label: "10m Best (sec)",
          data: filtered.map(d => d.best),
          backgroundColor: "#3498db"
        }]
      },
      options: {
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  const injury = injuryData.find(i => i.name === player);
  if (injury) {
    const heading = document.createElement("h2");
    heading.textContent = "Injury History";
    reportContainer.appendChild(heading);

    const table = document.createElement("table");
    table.innerHTML = `
      <thead>
        <tr>
          <th>Injuries (2023-24)</th>
          <th>Injury History</th>
          <th>Eligible Category</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${injury.seasonInjury}</td>
          <td>${injury.history}</td>
          <td>${injury.category}</td>
        </tr>
      </tbody>
    `;
    reportContainer.appendChild(table);
  }
}

// Load default
generateReport();
