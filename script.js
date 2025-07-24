const data10m = [
  {
    player: "PLAYER 26",
    date: "2023-04-02",
    phase: "Pre-Season Assessment 2023-24",
    trial1: 1.99,
    trial2: 1.90,
    best: 1.90,
    grpAvg: 1.98,
    indvAvg: 1.91,
    target: 1.88
  },
  {
    player: "PLAYER 29",
    date: "2023-04-02",
    phase: "Pre-Season Assessment 2023-24",
    trial1: 1.94,
    trial2: 1.91,
    best: 1.91,
    grpAvg: 1.98,
    indvAvg: 1.91,
    target: 1.88
  },
  {
    player: "PLAYER 66",
    date: "2023-04-05",
    phase: "Pre-Season Assessment 2023-24",
    trial1: 2.12,
    trial2: 2.00,
    best: 2.00,
    grpAvg: 1.98,
    indvAvg: 2.01,
    target: 1.88
  }
];

window.onload = () => {
  const uniquePlayers = [...new Set(data10m.map(d => d.player))];
  const playerSelect = document.getElementById("playerSelect");
  playerSelect.innerHTML = uniquePlayers.map(p => `<option>${p}</option>`).join('');
  updatePlayerInfo(uniquePlayers[0]);
};

document.getElementById("playerSelect").addEventListener("change", e => {
  updatePlayerInfo(e.target.value);
});

function updatePlayerInfo(player) {
  const playerInfoBox = document.getElementById("playerInfoBox");
  playerInfoBox.innerHTML = `
    <p><strong>Player:</strong> ${player}</p>
    <p><strong>Age:</strong> 28.19</p>
    <p><strong>Role:</strong> Batsman</p>
  `;
}

function generateReport() {
  const player = document.getElementById("playerSelect").value;
  const container = document.getElementById("reportContainer");
  const testCount = parseInt(document.getElementById("testCount").value);

  const playerTests = data10m
    .filter(d => d.player === player)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, testCount);

  container.innerHTML = "";

  playerTests.forEach(entry => {
    const canvas = document.createElement("canvas");
    container.appendChild(canvas);

    new Chart(canvas, {
      type: "bar",
      data: {
        labels: [entry.phase],
        datasets: [{
          label: "10m Best (sec)",
          data: [entry.best],
          backgroundColor: "#3399ff"
        }]
      },
      options: {
        plugins: {
          legend: { labels: { color: "white" } },
          title: {
            display: true,
            text: "10m Best (sec)",
            color: "white",
            font: { size: 16 }
          }
        },
        scales: {
          x: { ticks: { color: "white" }, grid: { color: "#444" } },
          y: {
            beginAtZero: true,
            ticks: { color: "white" },
            grid: { color: "#444" }
          }
        }
      },
      plugins: [{
        id: 'customLines',
        afterDatasetsDraw(chart) {
          const { ctx, chartArea: { left, right }, scales: { y } } = chart;
          const lines = [
            { label: 'GRP Avg', value: entry.grpAvg, color: 'yellow' },
            { label: 'INDV Avg', value: entry.indvAvg, color: 'gray' },
            { label: 'Target', value: entry.target, color: 'lime' }
          ];

          lines.forEach(line => {
            const yPos = y.getPixelForValue(line.value);
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(left, yPos);
            ctx.lineTo(right, yPos);
            ctx.setLineDash([5, 5]);
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = line.color;
            ctx.stroke();
            ctx.fillStyle = line.color;
            ctx.fillText(`${line.label} (${line.value})`, right - 100, yPos - 6);
            ctx.restore();
          });
        }
      }]
    });

    const table = document.createElement("table");
    table.innerHTML = `
      <thead>
        <tr>
          <th>Date</th><th>Phase</th><th>Trial 1</th><th>Trial 2</th>
          <th>Best</th><th>GRP Avg</th><th>INDV Avg</th><th>Target</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${entry.date}</td>
          <td>${entry.phase}</td>
          <td>${entry.trial1}</td>
          <td>${entry.trial2}</td>
          <td>${entry.best}</td>
          <td>${entry.grpAvg}</td>
          <td>${entry.indvAvg}</td>
          <td>${entry.target}</td>
        </tr>
      </tbody>
    `;
    container.appendChild(table);
  });
}
