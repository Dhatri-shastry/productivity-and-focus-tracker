console.log("Background script executed");

let currentSite = null;
let startTime = null;

// Helper: finish timing current site
  let siteTime = {};

  chrome.storage.local.get("siteTime",(result) => {
  siteTime=result.Sitetime || {};
  console.log("loaded siteTime:",siteTime);
  });

function stopTracking() {
  if (!currentSite || !startTime) return;

  const timeSpent = Math.floor((Date.now() - startTime) / 1000);

  siteTime[currentSite] = (siteTime[currentSite] || 0) + timeSpent;

  console.log("Updated siteTime:", siteTime);
}


// When URL changes inside same tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!changeInfo.url) return;
  if (!changeInfo.url.startsWith("http")) return;

  stopTracking();

  currentSite = new URL(changeInfo.url).hostname;
  startTime = Date.now();

  console.log("🔁 URL changed, new site:", currentSite);
});


// When user switches tabs
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  stopTracking();

  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (!tab.url || !tab.url.startsWith("http")) return;

  currentSite = new URL(tab.url).hostname;
  startTime = Date.now();

  console.log("▶ Active site:", currentSite);
});
