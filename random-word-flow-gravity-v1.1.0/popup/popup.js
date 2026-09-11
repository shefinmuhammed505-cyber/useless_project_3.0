const toggle = document.getElementById("toggle");
const status = document.getElementById("status");
chrome.storage.local.get(["enabled"], result => { const enabled = result.enabled !== false; toggle.checked = enabled; updateStatus(enabled); });
toggle.addEventListener("change", async () => { const enabled = toggle.checked; await chrome.storage.local.set({ enabled }); updateStatus(enabled); const tabs = await chrome.tabs.query({ active: true, currentWindow: true }); if (tabs[0]?.id) chrome.tabs.reload(tabs[0].id); });
function updateStatus(enabled) { status.textContent = enabled ? "Enabled" : "Disabled"; }
