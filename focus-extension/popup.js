const dataDiv = document.getElementById("data");

function loadData() {
  chrome.storage.local.get("siteTime", (result) => {
    console.log("Popup got:", result);

    const siteTime = result.siteTime || {};

    if (Object.keys(siteTime).length === 0) {
      dataDiv.innerText = "No data yet";
      return;
    }

    dataDiv.innerHTML = "";

    for (const site in siteTime) {
      const seconds = siteTime[site];
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;

      const p = document.createElement("p");
      p.innerText = `${site} : ${mins}m ${secs}s`;
      dataDiv.appendChild(p);
    }
  });
}

// 🔴 FORCE reload when popup opens
loadData();
