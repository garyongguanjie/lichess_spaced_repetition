chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "getCurrentPuzzle") {
    sendResponse(extractPuzzle());
  }
  return true;
});
