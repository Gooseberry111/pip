// Every game in Pip's Play tab, plus the level designs for the games that have levels.
//
// Difficulty philosophy: clearing a level should take a decent try, and three stars
// should need a near perfect run (no hearts lost, time to spare, few mistakes).

// `group` sorts the Play tab into sections.
export const GAME_GROUPS = [
  { id: 'puzzle', title: 'Puzzles', blurb: 'For a thinking mood' },
  { id: 'arcade', title: 'Arcade', blurb: 'Quick hands, sharp eyes' },
  { id: 'together', title: 'Play together', blurb: 'Take on Pip, or pass the phone to a friend' },
  { id: 'calm', title: 'Calm and music', blurb: 'Slow down for a moment' },
]

export const GAMES = [
  { id: 'burst', group: 'puzzle', title: 'Bloom Burst', blurb: 'Swap flowers, make matches, set off bees.', tag: 'Match 3', track: 'burst', levels: true },
  { id: 'words', group: 'puzzle', title: 'Leaf Words', blurb: 'Picture puzzles and word searches.', tag: 'Words', track: 'memory', levels: true },
  { id: 'hotel', group: 'puzzle', title: 'Bug Hotel', blurb: 'Give every bug a tower of its own.', tag: 'Sorting', track: 'hotel', levels: true },
  { id: 'puzzle', group: 'puzzle', title: 'Bloom Puzzle', blurb: 'Slide the tiles back into a picture.', tag: 'Sliding', track: 'puzzle', levels: true },
  { id: 'memory', group: 'puzzle', title: 'Seed Memory', blurb: 'Find the pairs before time runs out.', tag: 'Memory', track: 'memory', levels: true },
  { id: 'rain', group: 'arcade', title: 'Raindrop Catch', blurb: 'Catch the rain, dodge the mud.', tag: 'Arcade', track: 'rain', levels: true },
  { id: 'pop', group: 'arcade', title: 'Petal Pop', blurb: 'Aim, bounce and pop the petals.', tag: 'Shooter', track: 'pop', levels: true },
  { id: 'glide', group: 'arcade', title: 'Seed Glide', blurb: 'Float between the branches.', tag: 'Skill', track: 'glide', levels: true },
  { id: 'firefly', group: 'arcade', title: 'Firefly Night', blurb: 'Tap the fireflies, let the moths be.', tag: 'Reflex', track: 'firefly', levels: true },
  { id: 'tac', group: 'together', title: 'Garden Tac Toe', blurb: 'Sprouts or blossoms. Beat Pip, or a friend.', tag: '1 or 2 players', track: 'puzzle' },
  { id: 'checkers', group: 'together', title: 'Garden Checkers', blurb: 'Hop your ladybirds across the board.', tag: '1 or 2 players', track: 'puzzle' },
  { id: 'race', group: 'together', title: 'Snail Race', blurb: 'Tap to race. Don’t let your snail nap!', tag: '1 to 4 players', track: 'race', levels: true },
  { id: 'rhythm', group: 'calm', title: 'Rain Rhythm', blurb: 'Tap the drops in time with the music.', tag: 'Rhythm', track: 'silent', levels: true },
  { id: 'song', group: 'calm', title: 'Flower Song', blurb: 'Pip sings. Can you sing it back?', tag: 'Music', track: 'song' },
  { id: 'breathe', group: 'calm', title: 'Breathe Together', blurb: 'One quiet minute, side by side.', tag: 'Calm', track: 'breathe' },
]

// Shown in the Play tab as a peek at what's next.
export const COMING_SOON = [
  { id: 'golf', title: 'Mini Golf', blurb: 'Putt a seed round the garden.', tint: '#E2EEDC', accent: '#6A955A' },
  { id: 'fishing', title: 'Pond Fishing', blurb: 'Catch every fish in the pond.', tint: '#DCEAF0', accent: '#4E86AC' },
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
  { pairs: 14, time: 72, similar: true },
  { pairs: 15, time: 88, similar: true },
  { pairs: 15, time: 76, similar: true },
  { pairs: 16, time: 95, similar: true },
  { pairs: 16, time: 84, similar: true },
  { pairs: 12, time: 50, similar: true },
  { pairs: 14, time: 62, similar: true },
  { pairs: 16, time: 76, similar: true },
  { pairs: 14, time: 55, similar: true },
  { pairs: 16, time: 68, similar: true },
  { pairs: 16, time: 60, similar: true },
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
  { goal: { type: 'score', target: 150 }, time: 45, mud: 0.37, speed: 1.7, rate: 1.5 },
  { goal: { type: 'golden', target: 10 }, time: 45, mud: 0.38, speed: 1.75, rate: 1.5 },
  { goal: { type: 'combo', target: 26 }, time: 48, mud: 0.38, speed: 1.8, rate: 1.55 },
  { goal: { type: 'drops', target: 70 }, time: 52, mud: 0.4, speed: 1.85, rate: 1.6 },
  { goal: { type: 'score', target: 190 }, time: 50, mud: 0.4, speed: 1.9, rate: 1.65 },
  { goal: { type: 'golden', target: 12 }, time: 50, mud: 0.42, speed: 1.95, rate: 1.7 },
  { goal: { type: 'combo', target: 30 }, time: 52, mud: 0.42, speed: 2, rate: 1.75 },
  { goal: { type: 'drops', target: 85 }, time: 55, mud: 0.44, speed: 2.05, rate: 1.8 },
  { goal: { type: 'score', target: 240 }, time: 55, mud: 0.45, speed: 2.1, rate: 1.85 },
  { goal: { type: 'drops', target: 100 }, time: 60, mud: 0.46, speed: 2.2, rate: 1.95 },
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
  { target: 41, time: 36, moths: 0.43, life: 800, every: 370 },
  { target: 43, time: 36, moths: 0.43, life: 780, every: 370 },
  { target: 44, time: 37, moths: 0.44, life: 760, every: 360 },
  { target: 45, time: 37, moths: 0.45, life: 750, every: 350 },
  { target: 47, time: 38, moths: 0.45, life: 730, every: 350 },
  { target: 48, time: 38, moths: 0.46, life: 710, every: 340 },
  { target: 49, time: 39, moths: 0.47, life: 690, every: 330 },
  { target: 51, time: 40, moths: 0.47, life: 670, every: 330 },
  { target: 52, time: 40, moths: 0.48, life: 660, every: 320 },
  { target: 53, time: 41, moths: 0.49, life: 640, every: 310 },
  { target: 55, time: 41, moths: 0.49, life: 620, every: 310 },
  { target: 56, time: 42, moths: 0.5, life: 600, every: 300 },
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
  { branches: 38, gap: 0.247, speed: 226, sway: 0.105, wind: 1.27 },
  { branches: 41, gap: 0.243, speed: 232, sway: 0.11, wind: 1.33 },
  { branches: 44, gap: 0.24, speed: 238, sway: 0.115, wind: 1.4 },
  { branches: 47, gap: 0.237, speed: 243, sway: 0.12, wind: 1.47 },
  { branches: 50, gap: 0.233, speed: 249, sway: 0.125, wind: 1.53 },
  { branches: 52, gap: 0.23, speed: 255, sway: 0.13, wind: 1.6 },
  { branches: 55, gap: 0.227, speed: 261, sway: 0.135, wind: 1.67 },
  { branches: 58, gap: 0.223, speed: 267, sway: 0.14, wind: 1.73 },
  { branches: 61, gap: 0.22, speed: 272, sway: 0.145, wind: 1.8 },
  { branches: 64, gap: 0.217, speed: 278, sway: 0.15, wind: 1.87 },
  { branches: 67, gap: 0.213, speed: 284, sway: 0.155, wind: 1.93 },
  { branches: 70, gap: 0.21, speed: 290, sway: 0.16, wind: 2 },
]

// ---- Bloom Puzzle ----
// size: tiles per side, time: seconds, scramble: random slides from solved, numbers: faint tile numbers
export const PUZZLE_LEVELS = [
  { size: 3, time: 75, scramble: 40, picture: 'meadow', numbers: true },
  { size: 3, time: 50, scramble: 60, picture: 'sunset', numbers: false },
  { size: 3, time: 40, scramble: 80, picture: 'spring', numbers: false },
  { size: 4, time: 170, scramble: 90, picture: 'spring', numbers: true },
  { size: 4, time: 140, scramble: 110, picture: 'windowsill', numbers: false },
  { size: 3, time: 32, scramble: 90, picture: 'night', numbers: false },
  { size: 4, time: 120, scramble: 130, picture: 'night', numbers: false },
  { size: 4, time: 105, scramble: 150, picture: 'rainy', numbers: false },
  { size: 4, time: 95, scramble: 170, picture: 'meadow', numbers: false },
  { size: 5, time: 300, scramble: 220, picture: 'rainy', numbers: true },
  { size: 4, time: 85, scramble: 190, picture: 'sunset', numbers: false },
  { size: 5, time: 270, scramble: 240, picture: 'spring', numbers: false },
  { size: 4, time: 80, scramble: 200, picture: 'windowsill', numbers: false },
  { size: 5, time: 250, scramble: 260, picture: 'night', numbers: false },
  { size: 4, time: 72, scramble: 200, picture: 'rainy', numbers: false },
  { size: 5, time: 235, scramble: 280, picture: 'meadow', numbers: false },
  { size: 5, time: 220, scramble: 290, picture: 'sunset', numbers: false },
  { size: 5, time: 210, scramble: 300, picture: 'spring', numbers: false },
  { size: 5, time: 200, scramble: 310, picture: 'windowsill', numbers: false },
  { size: 5, time: 190, scramble: 320, picture: 'night', numbers: false },
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
  return (firstClear ? 3 + Math.min(level, 12) * 2 : 1) + Math.max(0, newStars)
}

// ---- Bloom Burst (match 3) ----
// goal: { type: 'score', target } | { type: 'collect', items: { daisy: 15 } } | { type: 'mud' }
// stars: score needed for 2 and 3 stars once the goal is met. mud: cells with mud (1 or 2 layers).
export const BURST_TYPES = ['daisy', 'blossom', 'sunny', 'poppy', 'leaf', 'drop']

const ring = (layers = 1) => {
  const cells = []
  for (let r = 2; r <= 5; r++) for (let c = 1; c <= 5; c++) if (r === 2 || r === 5 || c === 1 || c === 5) cells.push([r, c, layers])
  return cells
}
const block = (r0, r1, c0, c1, layers = 1) => {
  const cells = []
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) cells.push([r, c, layers])
  return cells
}

export const BURST_LEVELS = [
  { moves: 20, types: 5, goal: { type: 'score', target: 8000 }, stars: [25000, 37000] },
  { moves: 16, types: 5, goal: { type: 'collect', items: { blossom: 30 } }, stars: [17000, 21000] },
  { moves: 20, types: 6, goal: { type: 'collect', items: { sunny: 20, drop: 20 } }, stars: [14000, 17000] },
  { moves: 20, types: 5, goal: { type: 'mud' }, mud: block(4, 7, 0, 6), stars: [20000, 28000] },
  { moves: 20, types: 6, goal: { type: 'score', target: 10000 }, stars: [14500, 19000] },
  { moves: 20, types: 6, goal: { type: 'collect', items: { poppy: 22, leaf: 14 } }, stars: [13000, 16500] },
  { moves: 22, types: 6, goal: { type: 'mud' }, mud: ring(2), stars: [13500, 17500] },
  { moves: 18, types: 6, goal: { type: 'score', target: 11000 }, stars: [14000, 17500] },
  { moves: 22, types: 6, goal: { type: 'collect', items: { daisy: 22, blossom: 22 } }, stars: [14500, 18500] },
  { moves: 27, types: 6, goal: { type: 'mud' }, mud: [...block(0, 1, 0, 6, 1), ...block(6, 7, 0, 6, 2)], stars: [18000, 21000] },
  // 11 to 30: tuned with a bot that tries every swap and picks the best one. The last levels
  // beat it only about a third of the time; 3 stars needs a score it reaches 1 run in 5.
  { moves: 28, types: 6, goal: { type: 'collect', items: { leaf: 24, drop: 24 } }, stars: [17500, 21000] },
  { moves: 15, types: 5, goal: { type: 'mud' }, mud: block(3, 7, 1, 5), stars: [17000, 23000] },
  { moves: 22, types: 6, goal: { type: 'score', target: 12000 }, stars: [16000, 21000] },
  { moves: 22, types: 6, goal: { type: 'collect', items: { sunny: 20, poppy: 20, daisy: 20 } }, stars: [15000, 18500] },
  { moves: 26, types: 5, goal: { type: 'mud' }, mud: [...block(0, 7, 0, 0), ...block(0, 7, 6, 6)], stars: [19000, 27000] },
  { moves: 31, types: 6, goal: { type: 'collect', items: { blossom: 35 } }, stars: [20000, 24000] },
  { moves: 13, types: 5, goal: { type: 'mud' }, mud: [...ring(2), ...block(3, 4, 2, 4, 2)], stars: [16000, 21000] },
  { moves: 19, types: 6, goal: { type: 'score', target: 11000 }, stars: [13500, 17500] },
  { moves: 25, types: 6, goal: { type: 'collect', items: { drop: 28, leaf: 28 } }, stars: [17500, 21500] },
  { moves: 16, types: 5, goal: { type: 'mud' }, mud: [...block(4, 7, 0, 6), ...block(7, 7, 2, 4, 2)], stars: [19500, 24500] },
  { moves: 25, types: 6, goal: { type: 'collect', items: { poppy: 30, sunny: 20 } }, stars: [17500, 20500] },
  { moves: 21, types: 5, goal: { type: 'mud' }, mud: block(6, 7, 0, 6, 2), stars: [21500, 29000] },
  { moves: 19, types: 6, goal: { type: 'score', target: 13000 }, stars: [16000, 18500] },
  { moves: 19, types: 6, goal: { type: 'collect', items: { daisy: 22, blossom: 22, leaf: 22 } }, stars: [14000, 17500] },
  { moves: 13, types: 5, goal: { type: 'mud' }, mud: [...block(2, 7, 1, 5), ...ring(2)], stars: [18500, 23000] },
  { moves: 26, types: 6, goal: { type: 'collect', items: { sunny: 36 } }, stars: [18500, 23000] },
  { moves: 18, types: 6, goal: { type: 'score', target: 12500 }, stars: [15500, 19500] },
  { moves: 24, types: 6, goal: { type: 'collect', items: { drop: 30, poppy: 30 } }, stars: [18500, 23500] },
  { moves: 16, types: 5, goal: { type: 'mud' }, mud: [...block(4, 7, 0, 6), ...block(7, 7, 0, 6, 2)], stars: [20500, 28500] },
  { moves: 21, types: 6, goal: { type: 'collect', items: { daisy: 25, blossom: 25, sunny: 25 } }, stars: [17500, 20500] },
]

// ---- Snail Race ----
// rivals: how many computer snails, tapRate: their taps per second, smart: they pace themselves,
// length: how long the track is (100 is normal), kick: they sprint over the last fifth
// Tuned with a simulation: the last levels need about 8 taps a second and a well timed sprint.
export const RACE_LEVELS = [
  { rivals: 2, tapRate: 4.4, smart: false, length: 100, kick: false },
  { rivals: 2, tapRate: 4.6, smart: false, length: 120, kick: false },
  { rivals: 3, tapRate: 4.7, smart: true, length: 100, kick: false },
  { rivals: 3, tapRate: 4.9, smart: true, length: 140, kick: false },
  { rivals: 3, tapRate: 5.0, smart: true, length: 100, kick: false },
  { rivals: 3, tapRate: 5.2, smart: true, length: 100, kick: false },
  { rivals: 3, tapRate: 5.3, smart: true, length: 120, kick: false },
  { rivals: 3, tapRate: 5.5, smart: true, length: 100, kick: false },
  { rivals: 3, tapRate: 5.6, smart: true, length: 140, kick: false },
  { rivals: 3, tapRate: 5.8, smart: true, length: 100, kick: true },
  { rivals: 3, tapRate: 6.0, smart: true, length: 100, kick: true },
  { rivals: 3, tapRate: 6.1, smart: true, length: 120, kick: true },
  { rivals: 3, tapRate: 6.3, smart: true, length: 100, kick: true },
  { rivals: 3, tapRate: 6.4, smart: true, length: 140, kick: true },
  { rivals: 3, tapRate: 6.6, smart: true, length: 100, kick: true },
  { rivals: 3, tapRate: 6.7, smart: true, length: 100, kick: true },
  { rivals: 3, tapRate: 6.9, smart: true, length: 120, kick: true },
  { rivals: 3, tapRate: 7.0, smart: true, length: 100, kick: true },
  { rivals: 3, tapRate: 7.2, smart: true, length: 140, kick: true },
  { rivals: 3, tapRate: 7.3, smart: true, length: 100, kick: true },
]

// ---- Rain Rhythm ----
// pass: accuracy needed to clear (percent), chords: chance of two drops at once,
// offbeat: how busy the off beats are (0.5 = half as busy as the beat; the last songs fill them in)
export const RHYTHM_LEVELS = [
  { title: 'Drizzle', bpm: 84, lanes: 3, density: 0.42, chords: 0, offbeat: 0.5, pass: 68, seed: 24 },
  { title: 'Light rain', bpm: 88, lanes: 3, density: 0.44, chords: 0, offbeat: 0.5, pass: 69, seed: 37 },
  { title: 'Spring shower', bpm: 91, lanes: 3, density: 0.46, chords: 0.02, offbeat: 0.5, pass: 70, seed: 50 },
  { title: 'Pitter patter', bpm: 94, lanes: 4, density: 0.48, chords: 0.03, offbeat: 0.5, pass: 71, seed: 63 },
  { title: 'Puddle jumping', bpm: 98, lanes: 4, density: 0.5, chords: 0.05, offbeat: 0.5, pass: 71, seed: 76 },
  { title: 'Downpour', bpm: 102, lanes: 4, density: 0.53, chords: 0.06, offbeat: 0.5, pass: 72, seed: 89 },
  { title: 'Rain on the roof', bpm: 105, lanes: 4, density: 0.55, chords: 0.08, offbeat: 0.5, pass: 73, seed: 102 },
  { title: 'Summer storm', bpm: 108, lanes: 4, density: 0.57, chords: 0.1, offbeat: 0.5, pass: 74, seed: 115 },
  { title: 'Rainbow chase', bpm: 112, lanes: 4, density: 0.59, chords: 0.11, offbeat: 0.54, pass: 75, seed: 128 },
  { title: 'Thunderstorm', bpm: 116, lanes: 4, density: 0.61, chords: 0.13, offbeat: 0.57, pass: 76, seed: 141 },
  { title: 'Hailstones', bpm: 119, lanes: 4, density: 0.63, chords: 0.14, offbeat: 0.61, pass: 76, seed: 154 },
  { title: 'Gusty gale', bpm: 122, lanes: 4, density: 0.65, chords: 0.16, offbeat: 0.65, pass: 77, seed: 167 },
  { title: 'Cloudburst', bpm: 126, lanes: 4, density: 0.67, chords: 0.18, offbeat: 0.69, pass: 78, seed: 180 },
  { title: 'Monsoon', bpm: 130, lanes: 4, density: 0.69, chords: 0.19, offbeat: 0.72, pass: 79, seed: 193 },
  { title: 'Typhoon', bpm: 133, lanes: 4, density: 0.71, chords: 0.21, offbeat: 0.76, pass: 80, seed: 206 },
  { title: 'Lightning dance', bpm: 136, lanes: 4, density: 0.73, chords: 0.22, offbeat: 0.8, pass: 81, seed: 219 },
  { title: 'Storm chaser', bpm: 140, lanes: 4, density: 0.76, chords: 0.24, offbeat: 0.84, pass: 82, seed: 232 },
  { title: 'Tempest', bpm: 144, lanes: 4, density: 0.78, chords: 0.26, offbeat: 0.88, pass: 82, seed: 245 },
  { title: 'Hurricane', bpm: 147, lanes: 4, density: 0.8, chords: 0.27, offbeat: 0.91, pass: 83, seed: 258 },
  { title: 'The big storm', bpm: 150, lanes: 4, density: 0.82, chords: 0.29, offbeat: 0.95, pass: 84, seed: 271 },
]

// ---- Bug Hotel ----
// kinds: bug types, empty: empty towers to start (one is much harder than two), height: rooms per tower
export const HOTEL_LEVELS = [
  { kinds: 3, empty: 2, height: 4 },
  { kinds: 4, empty: 2, height: 4 },
  { kinds: 4, empty: 1, height: 4 },
  { kinds: 5, empty: 2, height: 4 },
  { kinds: 5, empty: 1, height: 4 },
  { kinds: 6, empty: 2, height: 4 },
  { kinds: 5, empty: 2, height: 5 },
  { kinds: 6, empty: 1, height: 4 },
  { kinds: 7, empty: 2, height: 4 },
  { kinds: 6, empty: 2, height: 5 },
  { kinds: 5, empty: 1, height: 5 },
  { kinds: 7, empty: 2, height: 5 },
  { kinds: 4, empty: 1, height: 6 },
  { kinds: 6, empty: 2, height: 6 },
  { kinds: 5, empty: 1, height: 6 },
  { kinds: 7, empty: 1, height: 4 },
  { kinds: 6, empty: 1, height: 5 },
  { kinds: 7, empty: 2, height: 6 },
  { kinds: 5, empty: 1, height: 6 },
  { kinds: 6, empty: 1, height: 5 },
  { kinds: 7, empty: 1, height: 4 },
  { kinds: 7, empty: 2, height: 6 },
  { kinds: 6, empty: 1, height: 5 },
  { kinds: 7, empty: 1, height: 4 },
]

// ---- Petal Pop ----
// rows: starting rows, colors: petal colours, drop: shots before the ceiling creeps down
export const POP_LEVELS = [
  { rows: 5, colors: 3, drop: 9 },
  { rows: 5, colors: 4, drop: 9 },
  { rows: 5, colors: 4, drop: 9 },
  { rows: 6, colors: 4, drop: 8 },
  { rows: 6, colors: 5, drop: 8 },
  { rows: 6, colors: 5, drop: 8 },
  { rows: 7, colors: 5, drop: 7 },
  { rows: 7, colors: 5, drop: 7 },
  { rows: 7, colors: 5, drop: 7 },
  { rows: 8, colors: 5, drop: 6 },
  { rows: 8, colors: 6, drop: 6 },
  { rows: 8, colors: 6, drop: 6 },
  { rows: 9, colors: 6, drop: 5 },
  { rows: 9, colors: 6, drop: 5 },
  { rows: 9, colors: 6, drop: 5 },
  { rows: 9, colors: 6, drop: 4 },
  { rows: 9, colors: 6, drop: 4 },
  { rows: 9, colors: 6, drop: 4 },
  { rows: 9, colors: 6, drop: 4 },
  { rows: 9, colors: 6, drop: 4 },
]

// ---- Garden Tac Toe ----
// petals for beating Pip, by difficulty (a draw on Hard 3x3 is the best anyone can do)
export const TAC_REWARDS = { easy: 2, medium: 4, hard: 8, hardDraw: 2 }

// ---- Garden Checkers ----
// petals for beating Pip, by difficulty
export const CHECKERS_REWARDS = { easy: 3, medium: 6, hard: 12, draw: 2 }

const BURST_NAMES = { daisy: 'daisies', blossom: 'blossoms', sunny: 'sunflowers', poppy: 'poppies', leaf: 'leaves', drop: 'drops' }
export function burstGoalText(goal) {
  if (goal.type === 'score') return `Score ${goal.target.toLocaleString('en')}`
  if (goal.type === 'mud') return 'Wash away all the mud'
  const parts = Object.entries(goal.items).map(([k, n]) => `${n} ${BURST_NAMES[k]}`)
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts[0]
  return `Collect ${list}`
}
