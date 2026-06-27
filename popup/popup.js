const el = (id) => document.getElementById(id);
const show = (view) => {
  ["capture", "review", "dash"].forEach((v) => el(`view-${v}`).classList.add("hidden"));
  el(`view-${view}`).classList.remove("hidden");
};

el("openMain").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: chrome.runtime.getURL("main/main.html") });
  window.close();
});

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function isTrainingUrl(url) {
  return /^https:\/\/lichess\.org\/training\//.test(url || "");
}

async function queryCurrentPuzzle(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: "getCurrentPuzzle" }, (resp) => {
      if (chrome.runtime.lastError) return resolve(null);
      resolve(resp);
    });
  });
}

async function renderDashboard() {
  const now = Date.now();
  const due = await Storage.getDueCount(now);
  const all = await Storage.list();
  el("dueCount").textContent = due;
  el("totalCount").textContent = all.length;
  show("dash");
}

let capturePuzzle = null;

async function renderCapture(puzzle) {
  const stored = await Storage.get(puzzle.id);
  capturePuzzle = stored || { ...puzzle, dueAt: 0 };
  el("capId").textContent = puzzle.id;
  el("capLink").href = puzzle.url;
  el("capMsg").textContent = "";
  el("capWarn").classList.add("hidden");
  el("capWarn").textContent = "";
  el("btnFail").disabled = false;
  el("btnPass").disabled = false;
  show("capture");
}

function captureLockedWarn(now = Date.now()) {
  const p = capturePuzzle;
  if (!p) return null;
  if (p.dueAt <= now) return null;
  return `#${p.id} is ${Priority.relativeDue(p, now)} — grading is locked until it's due. SM2 numbers will not change.`;
}

let reviewQueue = [];
let reviewIdx = 0;

async function startReviewSession() {
  const now = Date.now();
  const due = (await Storage.list()).filter((p) => p.dueAt <= now);
  reviewQueue = Priority.rank(due, now);
  reviewIdx = 0;
  renderReviewItem();
}

function renderReviewItem() {
  el("revWarn").classList.add("hidden");
  el("revWarn").textContent = "";
  if (reviewIdx >= reviewQueue.length) {
    el("revEmpty").classList.remove("hidden");
    el("revId").textContent = "—";
    el("btnOpenLichess").classList.add("hidden");
    el("btnRevFail").classList.add("hidden");
    el("btnRevPass").classList.add("hidden");
    el("revProgress").textContent = "";
    return;
  }
  el("revEmpty").classList.add("hidden");
  el("btnOpenLichess").classList.remove("hidden");
  el("btnRevFail").classList.remove("hidden");
  el("btnRevPass").classList.remove("hidden");
  const p = reviewQueue[reviewIdx];
  el("revId").textContent = p.id;
  el("revLink").href = p.url;
  el("revProgress").textContent = `${reviewIdx + 1} of ${reviewQueue.length}`;
}

async function gradeCurrent(passed) {
  if (reviewIdx >= reviewQueue.length) return;
  const p = reviewQueue[reviewIdx];
  const now = Date.now();
  if (p.dueAt > now) {
    const warn = el("revWarn");
    warn.textContent = `#${p.id} is ${Priority.relativeDue(p, now)} — grading is locked until it's due. SM2 numbers will not change.`;
    warn.classList.remove("hidden");
    return;
  }
  const warn = el("revWarn");
  warn.classList.add("hidden");
  warn.textContent = "";
  const updated = passed ? SM2.pass(p, now) : SM2.fail(p, now);
  await Storage.update(p.id, updated);
  reviewIdx++;
  renderReviewItem();
}

el("btnFail").addEventListener("click", async () => {
  const warn = captureLockedWarn();
  if (warn) {
    const w = el("capWarn");
    w.textContent = warn;
    w.classList.remove("hidden");
    return;
  }
  const tab = await getActiveTab();
  const puzzle = await queryCurrentPuzzle(tab.id);
  if (!puzzle) return;
  await Storage.saveOrReset(puzzle.id, puzzle.url);
  el("capMsg").textContent = "Saved for review ✓";
  el("btnFail").disabled = true;
  el("btnPass").disabled = true;
  setTimeout(() => window.close(), 700);
});

el("btnPass").addEventListener("click", () => {
  const warn = captureLockedWarn();
  if (warn) {
    const w = el("capWarn");
    w.textContent = warn;
    w.classList.remove("hidden");
    return;
  }
  window.close();
});

el("btnCapReview").addEventListener("click", async () => {
  await startReviewSession();
  show("review");
});

el("btnReview").addEventListener("click", async () => {
  await startReviewSession();
  show("review");
});

el("btnOpenLichess").addEventListener("click", () => {
  if (reviewIdx >= reviewQueue.length) return;
  chrome.tabs.create({ url: reviewQueue[reviewIdx].url });
});

el("btnRevPass").addEventListener("click", () => gradeCurrent(true));
el("btnRevFail").addEventListener("click", () => gradeCurrent(false));

el("btnEndSession").addEventListener("click", renderDashboard);

(async () => {
  const tab = await getActiveTab();
  if (isTrainingUrl(tab.url)) {
    const puzzle = await queryCurrentPuzzle(tab.id);
    if (puzzle) {
      renderCapture(puzzle);
      return;
    }
  }
  await renderDashboard();
})();
