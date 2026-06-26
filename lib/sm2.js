const SM2 = {
  DAY_MS: 24 * 60 * 60 * 1000,

  newCard(now = Date.now()) {
    return {
      interval: 1,
      ease: 2.5,
      repetitions: 0,
      dueAt: now + this.DAY_MS,
      lastReviewed: null,
    };
  },

  fail(card, now = Date.now()) {
    return {
      interval: 1,
      ease: Math.max(1.3, card.ease - 0.2),
      repetitions: 0,
      dueAt: now + this.DAY_MS,
      lastReviewed: now,
    };
  },

  pass(card, now = Date.now()) {
    let interval;
    if (card.repetitions === 0) interval = 1;
    else if (card.repetitions === 1) interval = 3;
    else interval = Math.max(1, Math.round(card.interval * card.ease));
    interval = Math.min(interval, 365);
    return {
      interval,
      ease: card.ease + 0.1,
      repetitions: card.repetitions + 1,
      dueAt: now + interval * this.DAY_MS,
      lastReviewed: now,
    };
  },
};
