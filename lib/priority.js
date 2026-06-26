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
    const days = Math.round(diff / SM2.DAY_MS);
    if (diff <= 0) {
      if (days === 0) return "due now";
      return `overdue ${-days}d`;
    }
    if (days === 0) return "due today";
    return `due in ${days}d`;
  },
};
