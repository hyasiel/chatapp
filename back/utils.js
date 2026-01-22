function normalizePair(u1, u2) {
  return u1 < u2 
    ? { user1: u1, user2: u2, chatId: `${u1}_${u2}` }
    : { user1: u2, user2: u1, chatId: `${u2}_${u1}` };
}

module.exports = { normalizePair };
