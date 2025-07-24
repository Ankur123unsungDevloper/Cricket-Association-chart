document.getElementById("generateReport").addEventListener("click", () => {
  const player = document.getElementById("playerSelect").value;
  const count = parseInt(document.getElementById("testCount").value);
  const tests = Array.from(document.querySelectorAll("#testList li"))
    .map((li) => li.getAttribute("data-test"));

  console.log("Selected Player:", player);
  console.log("Recent Test Count:", count);
  console.log("Selected Tests:", tests);

  document.getElementById("reportArea").innerHTML = `
    <h2>📋 Report for ${player}</h2>
    <p>Showing last <strong>${count}</strong> tests:</p>
    <ul>${tests.map((test) => `<li>${test}</li>`).join("")}</ul>
    <p><i>Charts will be shown here...</i></p>
  `;
});

// Reorder Logic
document.querySelectorAll("#testList").forEach((list) => {
  list.addEventListener("click", (e) => {
    if (!e.target.classList.contains("up") && !e.target.classList.contains("down")) return;

    const li = e.target.closest("li");
    const parent = li.parentElement;

    if (e.target.classList.contains("up") && li.previousElementSibling) {
      parent.insertBefore(li, li.previousElementSibling);
    } else if (e.target.classList.contains("down") && li.nextElementSibling) {
      parent.insertBefore(li.nextElementSibling, li);
    }
  });
});
