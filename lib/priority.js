const Priority = {
  rank(puzzles, now = Date.now()) {
    return [...puzzles].sort((a, b) => this.compare(a, b, now));
  },

  compare(a, b, now) {
    const aOverdue = a.dueAt <= now;
    const bOverdue = b.dueAt <= now;
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
    if (a.dueAt !== b.dueAt) return a.dueAt - b.dueAt;
    if (a.ease !== b.ease) return a.ease - b.ease;
    if (a.repetitions !== b.repetitions) return a.repetitions - b.repetitions;
    return (a.lastReviewed ?? 0) - (b.lastReviewed ?? 0);
  },

  relativeDue(puzzle, now = Date.now()) {
    const diff = puzzle.dueAt - now;
    if (diff <= 0) return "due now";
    let remaining = Math.floor(diff / 60000);
    const days = Math.floor(remaining / 1440);
    remaining -= days * 1440;
    const hours = Math.floor(remaining / 60);
    remaining -= hours * 60;
    const minutes = remaining;
    const parts = [];
    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    parts.push(`${minutes}m`);
    return `due in ${parts.join(" ")}`;
  },
};
