const rowsEl = document.getElementById("rows");
const emptyEl = document.getElementById("empty");
const tblEl = document.getElementById("tbl");

function dueClass(puzzle, now) {
  if (puzzle.dueAt <= now) return "due-overdue";
  if (puzzle.dueAt - now <= 2 * SM2.DAY_MS) return "due-soon";
  return "";
}

function render(puzzles) {
  rowsEl.innerHTML = "";
  const now = Date.now();
  document.getElementById("dueCount").textContent = puzzles.filter((p) => p.dueAt <= now).length;
  document.getElementById("totalCount").textContent = puzzles.length;

  if (puzzles.length === 0) {
    tblEl.classList.add("hidden");
    emptyEl.classList.remove("hidden");
    return;
  }
  tblEl.classList.remove("hidden");
  emptyEl.classList.add("hidden");

  for (const p of Priority.rank(puzzles, now)) {
    const tr = document.createElement("tr");
    tr.dataset.id = p.id;

    const link = document.createElement("a");
    link.href = p.url;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "#" + p.id;

    const tdId = document.createElement("td");
    tdId.appendChild(link);

    const due = Priority.relativeDue(p, now);
    const dueCls = dueClass(p, now);

    tr.innerHTML = `
      <td></td>
      <td>${p.interval}d</td>
      <td>${p.ease.toFixed(2)}</td>
      <td>${p.repetitions}</td>
      <td class="${dueCls}">${due}</td>
      <td></td>
    `;
    tr.children[0].appendChild(link);

    const actionsTd = tr.children[5];

    const openBtn = document.createElement("button");
    openBtn.className = "btn";
    openBtn.textContent = "Open";
    openBtn.addEventListener("click", () => chrome.tabs.create({ url: p.url }));

    const passBtn = document.createElement("button");
    passBtn.className = "btn btn-pass";
    passBtn.textContent = "Pass";
    passBtn.addEventListener("click", () => grade(p.id, true));

    const failBtn = document.createElement("button");
    failBtn.className = "btn btn-fail";
    failBtn.textContent = "Fail";
    failBtn.addEventListener("click", () => grade(p.id, false));

    const delBtn = document.createElement("button");
    delBtn.className = "btn btn-del";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => remove(p.id));

    actionsTd.append(openBtn, passBtn, failBtn, delBtn);
    rowsEl.appendChild(tr);
  }
}

async function grade(id, passed) {
  const puzzle = await Storage.get(id);
  if (!puzzle) return;
  const now = Date.now();
  const updated = passed ? SM2.pass(puzzle, now) : SM2.fail(puzzle, now);
  await Storage.update(id, updated);
  const all = await Storage.list();
  render(all);
}

async function remove(id) {
  await Storage.remove(id);
  const all = await Storage.list();
  render(all);
}

(async () => {
  const all = await Storage.list();
  render(all);
})();
