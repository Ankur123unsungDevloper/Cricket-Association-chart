let playerData = [];

document.getElementById("uploadCSV").addEventListener("change", handleCSVUpload);

function handleCSVUpload(e) {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = function (event) {
    const data = event.target.result;
    const workbook = XLSX.read(data, { type: "binary" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    playerData = [];
    let headers = [];
    let collecting = false;

    for (let row of rows) {
      if (row.includes("Player") && row.includes("Trial1")) {
        headers = row;
        collecting = true;
        continue;
      }

      if (collecting) {
        const obj = {};
        headers.forEach((h, i) => (obj[h] = row[i]));
        if (obj.Player) playerData.push(obj);
      }
    }

    populatePlayerDropdown();
  };

  reader.readAsBinaryString(file);
}

function populatePlayerDropdown() {
  const playerSelect = document.getElementById("playerSelect");
  playerSelect.innerHTML = '<option disabled selected>Select a player</option>';

  const uniqueNames = [...new Set(playerData.map(d => d.Player).filter(Boolean))];
  uniqueNames.forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    playerSelect.appendChild(option);
  });
}

document.getElementById("playerSelect").addEventListener("change", function () {
  const selectedPlayer = this.value;
  const tests = [...new Set(playerData
    .filter(d => d.Player === selectedPlayer)
    .map(d => d.Test)
    .filter(Boolean)
  )];

  const testSelect = document.getElementById("testTypeSelect");
  testSelect.innerHTML = '<option disabled selected>Select test</option>';

  tests.forEach(test => {
    const option = document.createElement("option");
    option.value = test;
    option.textContent = test;
    testSelect.appendChild(option);
  });
});
