const chartCanvas = document.getElementById("chartDynamic");
let chartInstance = null;

const sampleData = {
  "YoYo": {
    player: "PLAYER 29",
    test: "YoYo",
    values: [
      { phase: "SMAT 2020/21", value: 16.2, grpAverage: 14.8, indvAverage: 16.0, target: 18 },
      { phase: "Pre-Season 2022/23", value: 16.5, grpAverage: 15.0, indvAverage: 16.2, target: 18 },
      { phase: "Pre-Season 2023/24", value: 16.8, grpAverage: 15.4, indvAverage: 16.5, target: 18 },
      { phase: "Post Season 2023", value: 16.4, grpAverage: 15.1, indvAverage: 16.3, target: 18 },
      { phase: "SMAT 2024/25", value: 16.7, grpAverage: 15.3, indvAverage: 16.4, target: 18 }
    ]
  }
};

function renderChart(testType) {
  const testData = sampleData[testType];
  const ctx = chartCanvas.getContext("2d");
  if (chartInstance) chartInstance.destroy();

  const labels = testData.values.map((item) => item.phase);
  const values = testData.values.map((item) => item.value);
  const grpAvg = testData.values.map((item) => item.grpAverage);
  const indvAvg = testData.values.map((item) => item.indvAverage);
  const target = testData.values.map((item) => item.target);

  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Value",
          data: values,
          backgroundColor: "#80deea"
        },
        {
          label: "GRP Average",
          data: grpAvg,
          type: "line",
          borderColor: "orange",
          borderWidth: 2,
          borderDash: [4, 4],
          fill: false
        },
        {
          label: "INDV Average",
          data: indvAvg,
          type: "line",
          borderColor: "white",
          borderWidth: 2,
          borderDash: [8, 4],
          fill: false
        },
        {
          label: "Target",
          data: target,
          type: "line",
          borderColor: "green",
          borderWidth: 2,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "#444" },
          ticks: { color: "#fff" }
        },
        x: {
          grid: { color: "#444" },
          ticks: { color: "#fff" }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: "#fff"
          }
        },
        title: {
          display: true,
          text: `Performance Chart - ${testData.test}`,
          color: "#fff",
          font: {
            size: 16,
            weight: "bold"
          }
        }
      }
    }
  });
}

// Call chart
renderChart("YoYo");
