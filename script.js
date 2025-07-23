const chartCanvas = document.getElementById("chartDynamic");
let chartInstance = null;

const sampleData = {
  "10m": [
    { player: "PLAYER 29", value: 1.91, date: "2023-04-07" }
  ],
  "20m": [
    { player: "PLAYER 29", value: 3.19, date: "2023-04-07" }
  ],
  "YoYo": [
    { player: "PLAYER 29", value: 16.2, date: "2024-04-17" }
  ],
  "SBJ": [
    { player: "PLAYER 29", value: 2.28, date: "2023-04-07" }
  ],
  "Glute": [
    { player: "PLAYER 29", left: 53, right: 23, date: "2024-03-16" }
  ],
  "Copen": [
    { player: "PLAYER 29", left: 19, right: 36, date: "2024-03-16" }
  ]
};

function renderChart(testType) {
  const data = sampleData[testType];
  const ctx = chartCanvas.getContext("2d");
  if (chartInstance) chartInstance.destroy();

  let labels = data.map((d) => d.player);
  let dataset;

  if (testType === "Glute" || testType === "Copen") {
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
  let headers = "<tr><th>Player</th><th>Date</th>";
  let rows = "";

  if (testType === "Glute" || testType === "Copen") {
    headers += "<th>Left</th><th>Right</th></tr>";
    data.forEach((d) => {
      rows += `<tr><td>${d.player}</td><td>${d.date}</td><td>${d.left}</td><td>${d.right}</td></tr>`;
    });
  } else {
    headers += "<th>Value</th></tr>";
    data.forEach((d) => {
      rows += `<tr><td>${d.player}</td><td>${d.date}</td><td>${d.value}</td></tr>`;
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

// Initial load
document.addEventListener("DOMContentLoaded", () => {
  renderChart("10m");
});
