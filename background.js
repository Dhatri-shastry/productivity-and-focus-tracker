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

  chrome.storage.local.set({ siteTime }, () => {
    console.log("Saved siteTime:", siteTime);
  });

  // Optional: reset so we don't double-count if called again
  currentSite = null;
  startTime = null;
}

function startTracking(hostname) {
  if (!hostname) return;
  
  stopTracking();           // save previous if any
  currentSite = hostname;
  startTime = Date.now();
  console.log("Started tracking:", currentSite);
}


async function initCurrentTab() {
  try {
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const tab = tabs[0];

    if (!tab?.url || !tab.url.startsWith("http") || !tab.url.startsWith("https")) {
      console.log("No valid active http/https tab right now");
      return;
    }

    const hostname = new URL(tab.url).hostname;
    startTracking(hostname);
  } catch (err) {
    console.error("Failed to init current tab:", err);
  }
}

// Run init once when service worker starts / wakes up
initCurrentTab();

// ────────────────────────────────────────────────
// Tab switch
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  stopTracking();

  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (!tab.url || !tab.url.startsWith("http")) return;

    const hostname = new URL(tab.url).hostname;
    startTracking(hostname);
  } catch (err) {
    console.error("onActivated error:", err);
  }
});

// Navigation / reload in current tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;   // only when fully loaded
  if (!tab?.url || !tab.url.startsWith("http")) return;

  // Only act if this is the active tab (avoids tracking background tabs)
  chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
    if (activeTabs[0]?.id !== tabId) return;

    stopTracking();
    const hostname = new URL(tab.url).hostname;
    startTracking(hostname);
  });
});

// Bonus: re-init when window regains focus (common after minimize/switch app)
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;
  initCurrentTab();
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "clearData") {
    // Stop current tracking
    stopTracking();
    
    // Reset in-memory object
    siteTime = {};
    
    // Clear storage
    chrome.storage.local.set({ siteTime: {} }, () => {
      console.log("Background: data cleared and memory reset");
    });
    
    sendResponse({ status: "cleared" });
  }
  return true; // keep message channel open for async response (optional but good practice)
});