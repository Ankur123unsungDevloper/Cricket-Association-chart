// ✅ Global variables
let playerData = [];
let chart;

// ✅ Headers to be treated as test categories
const testHeaders = {
  "Yo-Yo Level": "Yo-Yo Test",
  "20m Best (sec)": "20m",
  "10m Best (sec)": "10m",
  "SBJ Best (mts)": "SBJ",
  "S/L Hop Left": "S/L Hop",
  "Copenhagen (Sec)": "Copenhagen (Sec)",
  "Push Ups": "Push Ups",
  "2 KM": "2 KM",
  "Run A 3 Best(sec)": "Run A 3*6",
  "1 Mile": "1 Mile",
  "MB Abs Throws": "MB Abs Throws",
  "Counter Movement Jump": "Counter Movement Jump",
  "SL Lunge Calf Raises": "SL Lunge Calf Raises"
};

// ✅ Handle CSV Upload
document.getElementById("uploadCSV").addEventListener("change", function (e) {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = function (event) {
    const csv = event.target.result;
    const rows = csv.split("\n").map(row => row.split(","));

    let headers = [];
    let collecting = false;
    playerData = [];

    for (let row of rows) {
      if (row.includes("Player") && row.includes("Phase")) {
        headers = row.map(h => h.trim());
        collecting = true;
        continue;
      }

      if (collecting && row.length > 1) {
        const obj = {};
        headers.forEach((h, i) => (obj[h] = row[i]?.trim()));
        if (obj["Player"]) playerData.push(obj);
      }
    }

    if (headers.length === 0) {
      alert("Couldn't find header row with 'Player'.");
      return;
    }

    populatePlayerDropdown();
    populateTestDropdown(headers);
  };

  reader.readAsText(file);
});

// ✅ Populate Player List
function populatePlayerDropdown() {
  const playerSelect = document.getElementById("playerSelect");
  playerSelect.innerHTML = '<option disabled selected>Select a player</option>';
  const uniquePlayers = [...new Set(playerData.map(d => d.Player).filter(Boolean))];
  uniquePlayers.forEach(player => {
    const option = document.createElement("option");
    option.value = player;
    option.textContent = player;
    playerSelect.appendChild(option);
  });
}

// ✅ Populate Test List
function populateTestDropdown(headers) {
  const testSelect = document.getElementById("testTypeSelect");
  testSelect.innerHTML = '<option disabled selected>Select a test</option>';
  const availableHeaders = Object.keys(testHeaders).filter(header => headers.includes(header));
  availableHeaders.forEach(header => {
    const option = document.createElement("option");
    option.value = header; // use actual CSV header
    option.textContent = testHeaders[header]; // show friendly label
    testSelect.appendChild(option);
  });
}

// ✅ Generate Chart
function generateReport() {
  const playerName = document.getElementById("playerSelect").value;
  const selectedTestHeader = document.getElementById("testTypeSelect").value;
  const testCount = parseInt(document.getElementById("testCountSelect").value);

  if (!playerName || !selectedTestHeader || isNaN(testCount)) {
    alert("Please select all fields");
    return;
  }

  const filtered = playerData
    .filter(d => d.Player === playerName && d[selectedTestHeader])
    .slice(-testCount);

  if (filtered.length === 0) {
    alert("No data available for selected player & test");
    return;
  }

  const labels = filtered.map(d => d.Date || d.Phase || "");
  const values = filtered.map(d => parseFloat(d[selectedTestHeader]) || null);

  if (chart) chart.destroy();

  const ctx = document.getElementById("chartCanvas").getContext("2d");
  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: `${playerName} - ${testHeaders[selectedTestHeader]}`,
          data: values,
          backgroundColor: "#3b82f6",
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Performance Chart",
          font: { size: 20 },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Score / Time" },
        },
      },
    },
  });
}
