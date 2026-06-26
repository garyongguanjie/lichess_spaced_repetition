const DAY_MS = 24 * 60 * 60 * 1000;
const STORAGE_KEY = "puzzles";

const Storage = {
  async getAll() {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    return data[STORAGE_KEY] || {};
  },

  async get(id) {
    const all = await this.getAll();
    return all[id] || null;
  },

  async save(puzzle) {
    const all = await this.getAll();
    all[puzzle.id] = puzzle;
    await chrome.storage.local.set({ [STORAGE_KEY]: all });
    return puzzle;
  },

  async update(id, patch) {
    const all = await this.getAll();
    if (!all[id]) return null;
    all[id] = { ...all[id], ...patch };
    await chrome.storage.local.set({ [STORAGE_KEY]: all });
    return all[id];
  },

  async remove(id) {
    const all = await this.getAll();
    delete all[id];
    await chrome.storage.local.set({ [STORAGE_KEY]: all });
  },

  async list() {
    const all = await this.getAll();
    return Object.values(all);
  },

  async getDueCount(now = Date.now()) {
    const all = await this.list();
    return all.filter((p) => p.dueAt <= now).length;
  },

  async saveOrReset(id, url, now = Date.now()) {
    const existing = await this.get(id);
    if (existing) {
      return await this.update(id, { ...SM2.newCard(now), lastReviewed: now });
    }
    return await this.save({
      id,
      url,
      addedAt: now,
      ...SM2.newCard(now),
    });
  },
};
