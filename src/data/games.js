// Every game in Pip's Play tab, plus the level designs for the games that have levels.
//
// Difficulty philosophy: clearing a level should take a decent try, and three stars
// should need a near perfect run (no hearts lost, time to spare, few mistakes).

export const GAMES = [
  { id: 'rain', title: 'Raindrop Catch', blurb: 'Catch the rain, dodge the mud.', tag: 'Arcade', track: 'rain', levels: true },
  { id: 'glide', title: 'Seed Glide', blurb: 'Float between the branches.', tag: 'Skill', track: 'glide', levels: true },
  { id: 'memory', title: 'Seed Memory', blurb: 'Find the pairs before time runs out.', tag: 'Memory', track: 'memory', levels: true },
  { id: 'puzzle', title: 'Bloom Puzzle', blurb: 'Slide the tiles back into a picture.', tag: 'Puzzle', track: 'puzzle', levels: true },
  { id: 'firefly', title: 'Firefly Night', blurb: 'Tap the fireflies, let the moths be.', tag: 'Reflex', track: 'firefly', levels: true },
  { id: 'song', title: 'Flower Song', blurb: 'Pip sings. Can you sing it back?', tag: 'Music', track: 'song' },
  { id: 'breathe', title: 'Breathe Together', blurb: 'One quiet minute, side by side.', tag: 'Calm', track: 'breathe' },
]

// Shown in the Play tab as a peek at what's next.
export const COMING_SOON = [
  { id: 'snail', title: 'Snail Race', blurb: 'Cheer on a very sleepy snail.', tint: '#F1EBDD', accent: '#A9826A' },
  { id: 'rhythm', title: 'Rain Rhythm', blurb: 'Tap along with the pitter patter.', tint: '#E7E4F0', accent: '#8C7FB5' },
  { id: 'bughotel', title: 'Bug Hotel', blurb: 'Build cosy rooms for tiny guests.', tint: '#F3E9DA', accent: '#B9824F' },
  { id: 'petalpop', title: 'Petal Pop', blurb: 'Match petals before they float away.', tint: '#F9E6EA', accent: '#C9677A' },
]

export const HINT_COST = 3
export const MAX_HINTS = 2

// ---- Seed Memory ----
// `similar` levels deal cards from only one or two kinds of item, which look alike.
export const MEMORY_LEVELS = [
  { pairs: 4, time: 30 },
  { pairs: 6, time: 42 },
  { pairs: 8, time: 55 },
  { pairs: 8, time: 42 },
  { pairs: 10, time: 65, similar: true },
  { pairs: 10, time: 52, similar: true },
  { pairs: 12, time: 75, similar: true },
  { pairs: 12, time: 62, similar: true },
  { pairs: 14, time: 85, similar: true },
]

// ---- Raindrop Catch ----
// goal types: drops (catch this many), score (reach points), golden (catch golden drops), combo (in a row)
// rate: how much rain falls, mud: share of grumpy mud drops, speed: how fast it falls
export const RAIN_LEVELS = [
  { goal: { type: 'drops', target: 15 }, time: 30, mud: 0.08, speed: 1, rate: 1 },
  { goal: { type: 'drops', target: 22 }, time: 30, mud: 0.16, speed: 1.05, rate: 1 },
  { goal: { type: 'score', target: 45 }, time: 32, mud: 0.2, speed: 1.1, rate: 1.05 },
  { goal: { type: 'golden', target: 5 }, time: 35, mud: 0.22, speed: 1.15, rate: 1.1 },
  { goal: { type: 'combo', target: 15 }, time: 40, mud: 0.24, speed: 1.2, rate: 1.1 },
  { goal: { type: 'drops', target: 38 }, time: 40, mud: 0.27, speed: 1.3, rate: 1.2 },
  { goal: { type: 'score', target: 110 }, time: 42, mud: 0.3, speed: 1.4, rate: 1.25 },
  { goal: { type: 'golden', target: 8 }, time: 40, mud: 0.32, speed: 1.45, rate: 1.3 },
  { goal: { type: 'combo', target: 22 }, time: 45, mud: 0.34, speed: 1.55, rate: 1.35 },
  { goal: { type: 'drops', target: 60 }, time: 50, mud: 0.36, speed: 1.65, rate: 1.45 },
]

// ---- Firefly Night ----
// life: how long a bug stays (ms), every: time between new bugs (ms), moths: share that are moths
export const FIREFLY_LEVELS = [
  { target: 12, time: 30, moths: 0.1, life: 1700, every: 800 },
  { target: 16, time: 30, moths: 0.2, life: 1500, every: 700 },
  { target: 20, time: 30, moths: 0.25, life: 1350, every: 620 },
  { target: 24, time: 32, moths: 0.3, life: 1200, every: 560 },
  { target: 28, time: 32, moths: 0.33, life: 1100, every: 500 },
  { target: 32, time: 34, moths: 0.36, life: 1000, every: 460 },
  { target: 36, time: 34, moths: 0.4, life: 900, every: 420 },
  { target: 40, time: 35, moths: 0.42, life: 820, every: 380 },
]

// ---- Seed Glide ----
// branches: how many to pass, gap: opening as a share of the height, speed: px per second,
// sway: branches drift up and down, wind: gusts push the seed
export const GLIDE_LEVELS = [
  { branches: 8, gap: 0.4, speed: 125, sway: 0, wind: 0 },
  { branches: 12, gap: 0.36, speed: 140, sway: 0, wind: 0 },
  { branches: 15, gap: 0.33, speed: 155, sway: 0.04, wind: 0 },
  { branches: 18, gap: 0.31, speed: 165, sway: 0.06, wind: 0 },
  { branches: 22, gap: 0.29, speed: 175, sway: 0.07, wind: 0.6 },
  { branches: 26, gap: 0.28, speed: 190, sway: 0.08, wind: 0.8 },
  { branches: 30, gap: 0.26, speed: 205, sway: 0.09, wind: 1 },
  { branches: 35, gap: 0.25, speed: 220, sway: 0.1, wind: 1.2 },
]

// ---- Bloom Puzzle ----
// size: tiles per side, time: seconds, scramble: random slides from solved, numbers: faint tile numbers
export const PUZZLE_LEVELS = [
  { size: 3, time: 75, scramble: 40, picture: 'meadow', numbers: true },
  { size: 3, time: 50, scramble: 60, picture: 'sunset', numbers: false },
  { size: 4, time: 170, scramble: 90, picture: 'spring', numbers: true },
  { size: 4, time: 130, scramble: 120, picture: 'windowsill', numbers: false },
  { size: 4, time: 100, scramble: 150, picture: 'night', numbers: false },
  { size: 5, time: 260, scramble: 220, picture: 'rainy', numbers: false },
]

export function rainGoalText(goal) {
  switch (goal.type) {
    case 'drops':
      return `Catch ${goal.target} raindrops`
    case 'score':
      return `Score ${goal.target} points`
    case 'golden':
      return `Catch ${goal.target} golden drops`
    case 'combo':
      return `Catch ${goal.target} in a row`
    default:
      return ''
  }
}

/**
 * Stars for a cleared level. Three stars needs a near perfect run:
 * no hearts lost (or mistakes within the limit) and time to spare.
 */
export function starRating({ heartsLost = 0, timeLeft = 1, mistakesOk = true } = {}) {
  if (heartsLost === 0 && timeLeft >= 0.3 && mistakesOk) return 3
  if (heartsLost <= 1 && timeLeft >= 0.1) return 2
  return 1
}

export const THREE_STAR_TIP = '3 stars: no mistakes and time to spare'

/** Petals for finishing a level: a bigger thank you the first time, a little after that. */
export function levelReward(level, { firstClear, newStars }) {
  return (firstClear ? 3 + level * 2 : 1) + Math.max(0, newStars)
}
