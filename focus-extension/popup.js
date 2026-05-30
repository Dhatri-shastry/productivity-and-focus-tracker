

const dataDiv = document.getElementById("data");

function formatTime(seconds) {
    if (!seconds && seconds !== 0) return "0s";

    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    let parts = [];
    if (hrs > 0) parts.push(`${hrs}h`);
    if (mins > 0 || hrs > 0) parts.push(`${mins}m`);
    parts.push(`${secs}s`);

    return parts.join(" ");
}

function loadData() {
    chrome.storage.local.get("siteTime", (result) => {
        const siteTime = result.siteTime || {};

        if (Object.keys(siteTime).length === 0) {
            dataDiv.innerHTML = '<p style="color:#777; font-style:italic;">No data yet — start browsing!</p>';
            return;
        }

        // Prepare sorted list
        const sortedSites = Object.entries(siteTime)
            .map(([site, seconds]) => ({ site, seconds }))
            .sort((a, b) => b.seconds - a.seconds); // descending order

        // Build HTML
        let html = '';

        // Optional: show total time at the top
        const totalSeconds = Object.values(siteTime).reduce((sum, s) => sum + s, 0);
        if (totalSeconds > 0) {
            html += `
                <div style="margin-bottom:12px; padding:8px; background:#f8f9fa; border-radius:6px; text-align:center;">
                    <strong>Total tracked time:</strong> ${formatTime(totalSeconds)}
                </div>
                <hr style="border:none; border-top:1px solid #eee; margin:12px 0;">
            `;
        }

        // Site list
        sortedSites.forEach(({ site, seconds }) => {
            let color = "#2c3e50"; // default dark gray
            if (seconds >= 1800) color = "#e74c3c";     // > 30 min — red
            else if (seconds >= 600) color = "#f39c12"; // > 10 min — orange
            else if (seconds >= 120) color = "#27ae60"; // > 2 min — green

            html += `
                <div style="padding:6px 0; color:${color};">
                    <strong>${site}</strong> — ${formatTime(seconds)}
                </div>
            `;
        });

        dataDiv.innerHTML = html;
    });
}

// Clear button handler
const clearBtn = document.getElementById("clear");
if (clearBtn) {
    clearBtn.addEventListener("click", () => {
        if (!confirm("Delete ALL tracked data? This cannot be undone.")) return;

        // Immediately show cleared state (optimistic UI)
        dataDiv.innerHTML = '<p style="color:#27ae60; font-weight:bold;">Clearing data...</p>';

        chrome.storage.local.set({ siteTime: {} }, () => {   // ← use set({siteTime: {}}) instead of remove
            console.log("Storage cleared via popup");
            loadData();  // refresh immediately
        });

        // Also notify background to reset its in-memory state (prevents quick re-save)
        chrome.runtime.sendMessage({ action: "clearData" });
    });
}

// Initial load + live updates
loadData();
setInterval(loadData, 1500);