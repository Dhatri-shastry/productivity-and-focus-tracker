console.log("Background script executed");

let siteTime = {};
let currentSite = null;
let startTime = null;

// Load stored data on startup
chrome.storage.local.get("siteTime", (result) => {
  siteTime = result.siteTime || {};
  console.log("Loaded siteTime:", siteTime);
});

function stopTracking() {
  if (!currentSite || !startTime) return;

  const timeSpent = Math.floor((Date.now() - startTime) / 1000);
  siteTime[currentSite] = (siteTime[currentSite] || 0) + timeSpent;

  //  THIS WAS THE MISSING PIECE
  chrome.storage.local.set({ siteTime }, () => {
    console.log("Saved siteTime:", siteTime);
  });
}

// When user switches tabs
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  stopTracking();

  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (!tab.url || !tab.url.startsWith("http")) return;

  currentSite = new URL(tab.url).hostname;
  startTime = Date.now();

  console.log("Active site:", currentSite);
});

// When URL changes in the same tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (!changeInfo.url || !changeInfo.url.startsWith("http")) return;

  stopTracking();

  currentSite = new URL(changeInfo.url).hostname;
  startTime = Date.now();

  console.log("URL changed, new site:", currentSite);
});
