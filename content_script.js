function extractPuzzle() {
  const anchors = document.querySelectorAll('a[href^="/training/"]');
  for (const a of anchors) {
    const text = (a.textContent || "").trim();
    if (!text.startsWith("#")) continue;
    const match = a.getAttribute("href").match(/^\/training\/([A-Za-z0-9]{3,})$/);
    if (!match) continue;
    const id = match[1];
    return { id, url: `https://lichess.org/training/${id}` };
  }
  return null;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "getCurrentPuzzle") {
    sendResponse(extractPuzzle());
  }
  return true;
});
