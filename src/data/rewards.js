// Petals for finishing a game level: a bigger thank you the first time, a little after that.
// Kept apart from data/games.js so the level designs only load with the Play tab.
export function levelReward(level, { firstClear, newStars }) {
  return (firstClear ? 3 + Math.min(level, 12) * 2 : 1) + Math.max(0, newStars)
}
