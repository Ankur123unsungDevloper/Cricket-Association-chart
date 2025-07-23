const chartCanvas = document.getElementById("chartDynamic");
let chartInstance = null;

const sampleData = {
  "10m": [
    { player: "PLAYER 29", phase: "Pre-Season 2023-24", value: 1.91 }
  ],
  "20m": [
    { player: "PLAYER 29", phase: "SMAT 2020-21", value: 3.16 },
    { player: "PLAYER 29", phase: "Pre-Season 2023-24", value: 3.19 }
  ],
  "YoYo": [
    { player: "PLAYER 29", phase: "SMAT 2020/21", value: 16.2 },
    { player: "PLAYER 29", phase: "Pre-Season 2022-23", value: 16.3 },
    { player: "PLAYER 29", phase: "Pre-Season 2023-24", value: 16.9 },
    { player: "PLAYER 29", phase: "Post Season IPA 2023-24", value: 16.7 },
    { player: "PLAYER 29", phase: "Pre-Season 2021-22", value: 16.5 }
  ],
  "SBJ": [
    { player: "PLAYER 29", phase: "Pre-Season 2023-24", value: 2.28 }
  ],
  "Glute": [
    { player: "PLAYER 29", phase: "Post Season IPA 2024 March", left: 53, right: 23 }
  ],
  "Copen": [
    { player: "PLAYER 29", phase: "Post Season IPA 2024 March", left: 19, right: 36 }
  ]
};

function renderChart(testType) {
  const data = sampleData[testType];
  const ctx = chartCanvas.getContext("2d");
  if (chartInstance) chartInstance.destroy();

  let labels, dataset;

  if (testType === "Glute" || testType === "Copen") {
    labels = data.map((d) => d.phase);
    dataset = [
      {
        label: "Left",
        data: data.map((d) => d.left),
        backgroundColor: "#4caf50"
      },
      {
        label: "Right",
        data: data.map((d) => d.right),
        backgroundColor: "#f44336"
      }
    ];
  } else {
    labels = data.map((d) => d.phase);
    dataset = [
      {
        label: testType + " Value",
        data: data.map((d) => d.value),
        backgroundColor: "#80deea"
      }
    ];
  }

  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: dataset
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true
        },
        title: {
          display: false
        }
      }
    }
  });

  document.getElementById("dynamicTitle").textContent = `Performance Chart - ${testType}`;
  renderTable(data, testType);
}

function renderTable(data, testType) {
  const table = document.createElement("table");
  let headers = "<tr><th>Player</th><th>Phase</th>";
  let rows = "";

  if (testType === "Glute" || testType === "Copen") {
    headers += "<th>Left</th><th>Right</th></tr>";
    data.forEach((d) => {
      rows += `<tr><td>${d.player}</td><td>${d.phase}</td><td>${d.left}</td><td>${d.right}</td></tr>`;
    });
  } else {
    headers += "<th>Value</th></tr>";
    data.forEach((d) => {
      rows += `<tr><td>${d.player}</td><td>${d.phase}</td><td>${d.value}</td></tr>`;
    });
  }

  table.innerHTML = headers + rows;
  const container = document.getElementById("playerData");
  container.innerHTML = "";
  container.appendChild(table);
}

document.getElementById("testSelect").addEventListener("change", function () {
  renderChart(this.value);
});

document.addEventListener("DOMContentLoaded", () => {
  renderChart("YoYo");
});