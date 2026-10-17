// Every game in Pip's Play tab, plus the level designs for the games that have levels.
//
// Difficulty philosophy: clearing a level should take a decent try, and three stars
// should need a near perfect run (no hearts lost, time to spare, few mistakes).

// `group` sorts the Play tab into sections.
import { endless, lerp, pick } from '@/utils/levelGen'
import { makeCourse } from '@/utils/golfCourses'

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
  { id: 'tiles', group: 'puzzle', title: 'Garden Tiles', blurb: 'Stack, match three, clear the garden.', tag: 'Triple match', track: 'memory', levels: true, isNew: true },
  { id: 'sudoku', group: 'puzzle', title: 'Seed Sudoku', blurb: 'Every seed once in each row, column and box.', tag: 'Logic', track: 'puzzle', levels: true, isNew: true },
  { id: 'memory', group: 'puzzle', title: 'Seed Memory', blurb: 'Find the pairs before time runs out.', tag: 'Memory', track: 'memory', levels: true },
  { id: 'rain', group: 'arcade', title: 'Raindrop Catch', blurb: 'Catch the rain, dodge the mud.', tag: 'Arcade', track: 'rain', levels: true },
  { id: 'pop', group: 'arcade', title: 'Petal Pop', blurb: 'Aim, bounce and pop the petals.', tag: 'Shooter', track: 'pop', levels: true },
  { id: 'glide', group: 'arcade', title: 'Seed Glide', blurb: 'Float between the branches.', tag: 'Skill', track: 'glide', levels: true },
  { id: 'golf', group: 'arcade', title: 'Mini Golf', blurb: 'Putt a seed round tricky little holes.', tag: 'Golf', track: 'glide', levels: true, isNew: true },
  { id: 'fishing', group: 'arcade', title: 'Pond Fishing', blurb: 'Drop the hook, land the big ones.', tag: 'Timing', track: 'rain', levels: true, isNew: true },
  { id: 'firefly', group: 'arcade', title: 'Firefly Night', blurb: 'Tap the fireflies, let the moths be.', tag: 'Reflex', track: 'firefly', levels: true },
  { id: 'tac', group: 'together', title: 'Garden Tac Toe', blurb: 'Sprouts or blossoms. Beat Pip, or a friend.', tag: '1 or 2 players', track: 'puzzle' },
  { id: 'checkers', group: 'together', title: 'Garden Checkers', blurb: 'Hop your ladybirds across the board.', tag: '1 or 2 players', track: 'puzzle' },
  { id: 'race', group: 'together', title: 'Snail Race', blurb: 'Tap to race. Don’t let your snail nap!', tag: '1 to 4 players', track: 'race', levels: true },
  { id: 'rhythm', group: 'calm', title: 'Rain Rhythm', blurb: 'Tap the drops in time with the music.', tag: 'Rhythm', track: 'silent', levels: true },
  { id: 'song', group: 'calm', title: 'Flower Song', blurb: 'Pip sings. Can you sing it back?', tag: 'Music', track: 'song' },
  { id: 'breathe', group: 'calm', title: 'Breathe Together', blurb: 'One quiet minute, side by side.', tag: 'Calm', track: 'breathe' },
]

// Shown in the Play tab as a peek at what's next (the section hides when this is empty).
export const COMING_SOON = []

export const HINT_COST = 3
export const MAX_HINTS = 2

// ---- Seed Memory ----
// `similar` levels deal cards from only one or two kinds of item, which look alike.
const MEMORY_BASE = [
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
  // master levels: the same boards with less and less time
  ...[58, 57, 56, 55, 54, 53, 52, 52, 51, 50, 50, 49, 49, 48, 48, 47, 47, 46, 46, 45].map((time, i) => ({ pairs: i % 3 === 2 ? 15 : 16, time, similar: true })),
]

// ---- Raindrop Catch ----
// goal types: drops (catch this many), score (reach points), golden (catch golden drops), combo (in a row)
// rate: how much rain falls, mud: share of grumpy mud drops, speed: how fast it falls
const RAIN_BASE = [
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
  // master levels
  ...Array.from({ length: 20 }, (_, i) => {
    const n = i + 1
    const kind = ['golden', 'combo', 'drops', 'score'][i % 4]
    const target = { golden: 12 + Math.floor(n / 3), combo: 30 + Math.floor(n * 0.9), drops: 100 + n * 3, score: 240 + n * 9 }[kind]
    return { goal: { type: kind, target }, time: kind === 'drops' ? 60 : 55, mud: Math.min(0.55, 0.46 + n * 0.005), speed: 2.2 + n * 0.03, rate: 1.95 + n * 0.025 }
  }),
]

// ---- Firefly Night ----
// life: how long a bug stays (ms), every: time between new bugs (ms), moths: share that are moths
const FIREFLY_BASE = [
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
  // master levels
  ...Array.from({ length: 20 }, (_, i) => ({ target: 57 + i, time: 42 + Math.floor(i / 3), moths: Math.min(0.58, 0.5 + i * 0.004), life: Math.max(470, 595 - i * 6.5), every: Math.max(255, 298 - i * 2.2) })),
]

// ---- Seed Glide ----
// branches: how many to pass, gap: opening as a share of the height, speed: px per second,
// sway: branches drift up and down, wind: gusts push the seed
const GLIDE_BASE = [
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
  // master levels
  ...Array.from({ length: 20 }, (_, i) => ({ branches: 72 + i * 2, gap: Math.max(0.19, 0.209 - i * 0.001), speed: 292 + i * 2, sway: Math.min(0.2, 0.162 + i * 0.002), wind: Math.min(2.6, 2.03 + i * 0.03) })),
]

// ---- Bloom Puzzle ----
// size: tiles per side, time: seconds, scramble: random slides from solved, numbers: faint tile numbers
const PUZZLE_BASE = [
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
  // master levels, in the newer scenes
  ...['beach', 'autumnwood', 'snowy', 'library', 'rooftop', 'greenhouse', 'space', 'meadow', 'sunset', 'spring'].flatMap((picture, i) => [
    { size: 4, time: Math.max(52, 70 - i * 2), scramble: 210 + i * 5, picture, numbers: false },
    { size: 5, time: Math.max(150, 186 - i * 4), scramble: 320 + i * 8, picture, numbers: false },
  ]),
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

export { levelReward } from './rewards'

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

const BURST_BASE = [
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
  // 31 to 45: master levels, mixing the shapes and goals of 21 to 30 with a touch less room
  { moves: 22, types: 6, goal: { type: 'collect', items: { leaf: 30, drop: 22 } }, stars: [17500, 21000] },
  { moves: 15, types: 5, goal: { type: 'mud' }, mud: [...block(5, 7, 0, 6), ...block(6, 7, 1, 5, 2)], stars: [20000, 26000] },
  { moves: 18, types: 6, goal: { type: 'score', target: 12500 }, stars: [15500, 19000] },
  { moves: 20, types: 6, goal: { type: 'collect', items: { poppy: 24, sunny: 24, blossom: 18 } }, stars: [15500, 19000] },
  { moves: 13, types: 5, goal: { type: 'mud' }, mud: [...ring(2), ...block(6, 7, 0, 6)], stars: [18500, 23500] },
  { moves: 25, types: 6, goal: { type: 'collect', items: { drop: 38 } }, stars: [18000, 22500] },
  { moves: 17, types: 6, goal: { type: 'score', target: 12000 }, stars: [15000, 18500] },
  { moves: 22, types: 6, goal: { type: 'collect', items: { daisy: 28, leaf: 28 } }, stars: [17000, 21000] },
  { moves: 15, types: 5, goal: { type: 'mud' }, mud: [...block(0, 7, 0, 1), ...block(0, 7, 5, 6), ...block(3, 4, 2, 4, 2)], stars: [19000, 25000] },
  { moves: 19, types: 6, goal: { type: 'collect', items: { sunny: 22, poppy: 22, drop: 22 } }, stars: [14500, 18000] },
  { moves: 17, types: 6, goal: { type: 'score', target: 12500 }, stars: [15500, 19000] },
  { moves: 14, types: 5, goal: { type: 'mud' }, mud: [...block(3, 7, 0, 6), ...block(6, 7, 0, 6, 2)], stars: [20500, 27000] },
  { moves: 23, types: 6, goal: { type: 'collect', items: { blossom: 30, leaf: 30 } }, stars: [17500, 22000] },
  { moves: 20, types: 6, goal: { type: 'collect', items: { daisy: 24, blossom: 24, sunny: 24, poppy: 12 } }, stars: [16500, 20000] },
  { moves: 13, types: 5, goal: { type: 'mud' }, mud: [...block(2, 7, 0, 6), ...ring(2), ...block(7, 7, 0, 6, 2)], stars: [19500, 25500] },
]

// ---- Snail Race ----
// rivals: how many computer snails, tapRate: their taps per second, smart: they pace themselves,
// length: how long the track is (100 is normal), kick: they sprint over the last fifth
// Tuned with a simulation: the last levels need about 8 taps a second and a well timed sprint.
const RACE_BASE = [
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
  // master races: long tracks test stamina, short ones a perfect sprint
  { rivals: 3, tapRate: 7.35, smart: true, length: 160, kick: true },
  { rivals: 3, tapRate: 7.4, smart: true, length: 100, kick: true },
  { rivals: 3, tapRate: 7.45, smart: true, length: 120, kick: true },
  { rivals: 3, tapRate: 7.5, smart: true, length: 180, kick: true },
  { rivals: 3, tapRate: 7.55, smart: true, length: 100, kick: true },
  { rivals: 3, tapRate: 7.6, smart: true, length: 140, kick: true },
  { rivals: 3, tapRate: 7.65, smart: true, length: 100, kick: true },
  { rivals: 3, tapRate: 7.7, smart: true, length: 200, kick: true },
  { rivals: 3, tapRate: 7.75, smart: true, length: 120, kick: true },
  { rivals: 3, tapRate: 7.8, smart: true, length: 100, kick: true },
]

// ---- Rain Rhythm ----
// pass: accuracy needed to clear (percent), chords: chance of two drops at once,
// offbeat: how busy the off beats are (0.5 = half as busy as the beat; the last songs fill them in)
const RHYTHM_BASE = [
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
  // master songs
  ...['Rain dance', 'Drum of the clouds', 'Sky river', 'Silver drops', 'Rumble', 'Flash flood', 'Night rain', 'Cyclone', 'Thunderclap', 'Storm front', 'Squall line', 'The deluge', 'Supercell', 'Eye of the storm', 'Endless rain'].map((title, i) => ({
    title,
    bpm: 152 + i * 1.5,
    lanes: 4,
    density: Math.min(0.9, 0.83 + i * 0.005),
    chords: Math.min(0.36, 0.3 + i * 0.004),
    offbeat: Math.min(1, 0.95 + i * 0.004),
    pass: Math.min(88, 84 + Math.floor(i / 4)),
    seed: 284 + i * 13,
  })),
]

// ---- Bug Hotel ----
// kinds: bug types, empty: empty towers to start (one is much harder than two), height: rooms per tower
const HOTEL_BASE = [
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
  // master floors
  { kinds: 6, empty: 1, height: 6 },
  { kinds: 7, empty: 1, height: 5 },
  { kinds: 7, empty: 2, height: 6 },
  { kinds: 6, empty: 1, height: 6 },
  { kinds: 7, empty: 1, height: 5 },
  { kinds: 5, empty: 1, height: 6 },
  { kinds: 7, empty: 1, height: 5 },
  { kinds: 6, empty: 1, height: 6 },
  { kinds: 7, empty: 1, height: 5 },
  { kinds: 7, empty: 2, height: 6 },
  { kinds: 6, empty: 1, height: 6 },
  { kinds: 7, empty: 1, height: 5 },
  { kinds: 7, empty: 1, height: 6 },
  { kinds: 6, empty: 1, height: 6 },
  { kinds: 7, empty: 1, height: 6 },
  { kinds: 7, empty: 1, height: 6 },
]

// The biggest floors take a few seconds to shuffle and solve, so they're built ahead of time
// (towers top last, '' is an empty tower; par from the solver).
export const HOTEL_FIXED = {
  25: { towers: ['ddabcf', 'fbdefb', 'ceeded', 'bccafd', 'efaaba', 'bafcec', ''], par: 29 },
  26: { towers: ['bgbfg', 'gaddc', 'fafdb', 'cgcaf', 'fbcee', 'daeea', 'dcbge', ''], par: 27 },
  27: { towers: ['gbaabd', 'effccc', 'bbdeff', 'ecacee', 'dafcbg', 'gagbge', 'gdadfd', '', ''], par: 33 },
  28: { towers: ['ecbbde', 'fbcffe', 'baacbd', 'aedcec', 'bfafda', 'facedd', ''], par: 28 },
  29: { towers: ['edcgg', 'bgcgc', 'afeaf', 'cgbff', 'dbcbf', 'bdada', 'deaee', ''], par: 27 },
  30: { towers: ['edeccc', 'dcbeae', 'ddbbcb', 'beedaa', 'bcaaad', ''], par: 19 },
  31: { towers: ['fbebb', 'agaed', 'cfbgd', 'gegcf', 'edcfg', 'bfcea', 'caadd', ''], par: 26 },
  32: { towers: ['bffcfa', 'bbcdaa', 'dbeecc', 'deffdc', 'edacad', 'fbebea', ''], par: 28 },
  33: { towers: ['abcae', 'fggeb', 'bdfgf', 'cdfbc', 'efcda', 'ecbgd', 'dgeaa', ''], par: 28 },
  34: { towers: ['edcgff', 'cbfgcd', 'gddbbb', 'agabda', 'ebdcge', 'acfeef', 'fcagea', '', ''], par: 33 },
  35: { towers: ['cfeffb', 'cbaedb', 'faaddd', 'bdfdbe', 'cefacc', 'ebceaa', ''], par: 27 },
  36: { towers: ['cbfeg', 'baabc', 'aeffg', 'ecggg', 'adadb', 'fbfde', 'dcdec', ''], par: 27 },
  37: { towers: ['dedgab', 'geaafc', 'bacecc', 'dadcee', 'gbebfd', 'agfdcg', 'ffbfgb', ''], par: 33 },
  38: { towers: ['aaccfd', 'ddbabb', 'cceade', 'effceb', 'ecdfab', 'fdbeaf', ''], par: 25 },
  39: { towers: ['aacefc', 'adebfg', 'debadc', 'cceebb', 'bbdage', 'ggfgcf', 'dagfdf', ''], par: 31 },
  40: { towers: ['baddca', 'cadgab', 'cagaee', 'gccbdf', 'bfcbge', 'feffdf', 'egbdge', ''], par: 34 },
}

// ---- Petal Pop ----
// rows: starting rows, colors: petal colours, drop: shots before the ceiling creeps down
const POP_BASE = [
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
  // master levels
  { rows: 10, colors: 6, drop: 5 },
  { rows: 10, colors: 6, drop: 4 },
  { rows: 9, colors: 6, drop: 3 },
  { rows: 10, colors: 6, drop: 4 },
  { rows: 10, colors: 6, drop: 4 },
  { rows: 9, colors: 6, drop: 3 },
  { rows: 10, colors: 6, drop: 3 },
  { rows: 11, colors: 6, drop: 4 },
  { rows: 10, colors: 6, drop: 3 },
  { rows: 11, colors: 6, drop: 4 },
  { rows: 10, colors: 6, drop: 3 },
  { rows: 11, colors: 6, drop: 3 },
  { rows: 11, colors: 6, drop: 4 },
  { rows: 11, colors: 6, drop: 3 },
  { rows: 11, colors: 6, drop: 3 },
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

// ---- Mini Golf ----
// Courses are 100 wide and 150 tall (y goes down). See src/utils/golfEngine.js for the pieces.
// 3 stars at par or under, 2 at one over, 1 for finishing. Run out of strokes (par + 4) and try again.
const GOLF_BASE = [
  { name: 'First putt', start: [50, 130], hole: [50, 28], par: 2 },
  { name: 'The hedge', start: [50, 130], hole: [50, 28], par: 2, walls: [[30, 75, 40, 6]] },
  { name: 'Round the corner', start: [20, 130], hole: [20, 28], par: 3, walls: [[0, 72, 72, 6]] },
  { name: 'Mushroom bumpers', start: [50, 132], hole: [50, 26], par: 2, bumpers: [[34, 78, 6], [66, 78, 6], [50, 56, 5]] },
  { name: 'Sandpit', start: [50, 132], hole: [50, 22], par: 2, sand: [[28, 30, 44, 18]] },
  { name: 'Splash', start: [50, 132], hole: [50, 24], par: 2, water: [[0, 70, 40, 14], [60, 70, 40, 14]] },
  { name: 'Zigzag', start: [15, 135], hole: [85, 24], par: 3, walls: [[0, 100, 70, 5], [30, 60, 70, 5]] },
  { name: 'Windmill', start: [50, 132], hole: [50, 26], par: 2, walls: [[0, 66, 38, 8], [62, 66, 38, 8]], spinners: [[50, 70, 13, 1.6]] },
  { name: 'Lily island', start: [50, 135], hole: [50, 36], par: 3, water: [[18, 18, 64, 8], [18, 26, 8, 26], [74, 26, 8, 26], [18, 52, 26, 8], [56, 52, 26, 8]] },
  { name: 'Sliding gate', start: [50, 132], hole: [50, 26], par: 2, movers: [[30, 72, 40, 6, 25, 3]] },
  { name: 'Bank shot', start: [82, 132], hole: [16, 24], par: 3, walls: [[0, 48, 62, 6]], bumpers: [[82, 30, 5]] },
  { name: 'Beach day', start: [50, 135], hole: [50, 22], par: 3, water: [[0, 82, 38, 12], [62, 82, 38, 12]], sand: [[32, 32, 36, 18]] },
  { name: 'Two windmills', start: [50, 135], hole: [50, 20], par: 3, walls: [[0, 92, 40, 6], [60, 92, 40, 6], [0, 52, 40, 6], [60, 52, 40, 6]], spinners: [[50, 95, 11, 1.8], [50, 55, 11, -2.2]] },
  { name: 'Hedge maze', start: [50, 136], hole: [82, 20], par: 4, walls: [[20, 112, 80, 5], [0, 82, 80, 5], [20, 52, 80, 5]] },
  { name: 'Bumper ring', start: [50, 134], hole: [50, 40], par: 3, bumpers: [[38, 40, 4], [62, 40, 4], [50, 28, 4], [42, 56, 4], [58, 56, 4], [50, 72, 5]] },
  { name: 'Bridge', start: [50, 136], hole: [50, 26], par: 2, water: [[0, 40, 42, 72], [58, 40, 42, 72]] },
  { name: 'Busy bridge', start: [50, 136], hole: [50, 22], par: 3, water: [[0, 40, 40, 72], [60, 40, 40, 72]], movers: [[42, 90, 16, 5, 8, 2.4], [42, 60, 16, 5, -8, 2]] },
  { name: 'Guarded green', start: [50, 134], hole: [50, 20], par: 2, walls: [[0, 36, 38, 8], [62, 36, 38, 8]], spinners: [[50, 40, 14, 2.6]] },
  { name: 'S bend', start: [20, 136], hole: [80, 22], par: 3, walls: [[0, 96, 64, 5], [36, 56, 64, 5]], sand: [[70, 100, 30, 25], [0, 60, 30, 25]] },
  { name: 'Stepping stones', start: [50, 138], hole: [50, 16], par: 4, water: [[0, 100, 44, 10], [56, 100, 44, 10], [0, 60, 30, 10], [42, 60, 58, 10], [0, 30, 60, 8], [72, 30, 28, 8]] },
  { name: 'Snake', start: [12, 136], hole: [88, 18], par: 4, walls: [[24, 20, 5, 130], [50, 0, 5, 120], [76, 30, 5, 120]] },
  { name: 'Pinball', start: [50, 138], hole: [50, 18], par: 3, bumpers: [[20, 100, 6], [50, 95, 6], [80, 100, 6], [35, 70, 6], [65, 70, 6], [50, 47, 6]], spinners: [[50, 30, 9, 3]] },
  { name: 'River run', start: [86, 138], hole: [14, 18], par: 4, water: [[0, 110, 70, 10], [30, 72, 70, 10], [0, 36, 70, 10]] },
  { name: 'Closing doors', start: [50, 138], hole: [50, 22], par: 3, movers: [[0, 100, 46, 6, 20, 3], [54, 100, 46, 6, -20, 3], [25, 60, 50, 6, 30, 2.6]] },
  { name: 'The cup', start: [50, 138], hole: [50, 60], par: 3, walls: [[20, 40, 60, 5], [20, 40, 5, 45], [75, 40, 5, 45]], spinners: [[50, 102, 14, 2]], water: [[0, 120, 30, 10], [70, 120, 30, 10]] },
  { name: 'Arcade', start: [50, 140], hole: [50, 14], par: 4, walls: [[0, 112, 40, 5], [60, 112, 40, 5], [20, 82, 60, 5], [0, 52, 40, 5], [60, 52, 40, 5]], bumpers: [[50, 98, 4], [10, 68, 4], [90, 68, 4], [50, 38, 5]], spinners: [[50, 26, 11, 2.4]] },
  { name: 'Hairpin', start: [12, 138], hole: [88, 136], par: 3, walls: [[45, 30, 10, 120]], sand: [[60, 96, 40, 22]] },
  { name: 'Lily ladder', start: [50, 140], hole: [50, 12], par: 4, water: [[0, 118, 42, 8], [58, 118, 42, 8], [0, 90, 22, 8], [38, 90, 62, 8], [0, 62, 62, 8], [78, 62, 22, 8], [0, 34, 42, 8], [58, 34, 42, 8]], spinners: [[50, 22, 8, 2.8]] },
  { name: 'Treasure box', start: [50, 140], hole: [50, 36], par: 4, walls: [[0, 64, 44, 5], [56, 64, 44, 5], [28, 18, 5, 46], [67, 18, 5, 46], [28, 18, 44, 4]], movers: [[30, 96, 40, 5, 25, 2]], spinners: [[50, 66, 6, 3]] },
  { name: 'Grand finale', start: [12, 140], hole: [88, 14], par: 5, walls: [[25, 100, 75, 5], [0, 64, 75, 5], [25, 28, 75, 5]], water: [[36, 74, 26, 18]], spinners: [[12, 102, 10, 2.2]], movers: [[30, 42, 20, 6, 15, 2.5]], bumpers: [[70, 12, 4]] },
]

// ---- Pond Fishing ----
// mix: how often each catch turns up. Targets come from a bot that never misses a cast:
// 1 star is about a third of its score early on and two thirds by the end; 3 stars is 1.5x that.
const FISH_TARGETS = [150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 258, 266, 274, 282, 290, 298, 306, 314, 322, 330, 338, 345, 352, 359, 366, 372, 378, 384, 390]
const FISHING_BASE = FISH_TARGETS.map((target, i) => {
  const n = i + 1
  return {
    target,
    time: n <= 10 ? 45 : n <= 20 ? 50 : 55,
    count: Math.min(11, 6 + Math.floor(n / 5)),
    speed: 1 + n * 0.028,
    swing: 1.45 + n * 0.035,
    mix: {
      minnow: Math.max(2, 7 - Math.floor(n / 5)),
      perch: 3,
      carp: n >= 2 ? 2 : 1,
      ...(n >= 4 ? { koi: n >= 20 ? 1.4 : 0.8 } : {}),
      ...(n >= 6 ? { turtle: 1 } : {}),
      ...(n >= 3 ? { boot: Math.min(3, 0.8 + n * 0.08) } : {}),
      ...(n >= 8 ? { puffer: Math.min(3.5, 0.6 + (n - 8) * 0.14) } : {}),
      ...(n >= 15 ? { chest: 0.35 } : {}),
    },
  }
})

// ---- Seed Sudoku ----
// size 4, 6 or 9; givens: seeds already showing. Fewer givens, harder puzzle.
// The same level is always the same puzzle (seed). Three mistakes and the round is over.
const SUDOKU_GIVENS = { 4: [10, 9, 8, 7, 6], 6: [22, 20, 18, 17, 16, 15, 14, 13], 9: [44, 42, 40, 38, 36, 35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24] }
const SUDOKU_BASE = [4, 6, 9].flatMap((size) => SUDOKU_GIVENS[size].map((givens) => ({ size, givens }))).map((l, i) => ({ ...l, seed: 7919 * (i + 1) + 13 }))

// ---- Garden Tiles ----
// cols x rows on the bottom layer, layers stacked on top, kinds of tile. mix 2 shuffles
// pairs of triples together, so you need to plan further ahead (still always winnable).
const TILES_BASE = [
  { cols: 4, rows: 3, layers: 1, kinds: 4 },
  { cols: 4, rows: 4, layers: 2, kinds: 4 },
  { cols: 5, rows: 4, layers: 2, kinds: 5 },
  { cols: 5, rows: 5, layers: 2, kinds: 6 },
  { cols: 5, rows: 5, layers: 3, kinds: 6 },
  { cols: 6, rows: 5, layers: 3, kinds: 7 },
  { cols: 6, rows: 6, layers: 3, kinds: 7, holes: true },
  { cols: 6, rows: 6, layers: 3, kinds: 8, mix: 2 },
  { cols: 6, rows: 6, layers: 4, kinds: 8 },
  { cols: 7, rows: 6, layers: 4, kinds: 8, mix: 2 },
  { cols: 7, rows: 6, layers: 4, kinds: 9, holes: true },
  { cols: 7, rows: 7, layers: 4, kinds: 9, mix: 2 },
  { cols: 7, rows: 7, layers: 4, kinds: 10 },
  { cols: 7, rows: 7, layers: 5, kinds: 10, mix: 2 },
  { cols: 7, rows: 7, layers: 5, kinds: 10, holes: true, mix: 2 },
  { cols: 7, rows: 8, layers: 5, kinds: 11 },
  { cols: 7, rows: 8, layers: 5, kinds: 11, mix: 2 },
  { cols: 7, rows: 8, layers: 6, kinds: 11, mix: 2 },
  { cols: 7, rows: 8, layers: 6, kinds: 12, holes: true, mix: 2 },
  { cols: 7, rows: 8, layers: 6, kinds: 12, mix: 2, density: 0.92 },
  { cols: 7, rows: 8, layers: 6, kinds: 12, mix: 2, density: 0.95 },
  { cols: 7, rows: 8, layers: 7, kinds: 12, mix: 2 },
  { cols: 7, rows: 8, layers: 7, kinds: 13, mix: 2, holes: true },
  { cols: 7, rows: 8, layers: 7, kinds: 13, mix: 2, density: 0.92 },
  { cols: 7, rows: 8, layers: 7, kinds: 14, mix: 2 },
  { cols: 7, rows: 8, layers: 8, kinds: 14, mix: 2 },
  { cols: 7, rows: 8, layers: 8, kinds: 14, mix: 2, density: 0.92 },
  { cols: 7, rows: 8, layers: 8, kinds: 15, mix: 2, holes: true },
  { cols: 7, rows: 8, layers: 8, kinds: 15, mix: 2, density: 0.94 },
  { cols: 7, rows: 8, layers: 9, kinds: 16, mix: 2, density: 0.94 },
].map((l, i) => ({ ...l, seed: 104729 * (i + 1) + 7 }))


// =====================================================================================
// Endless levels
// Every game keeps its hand-made levels (made a notch harder than they first were), then
// goes on with levels built from their number (see src/utils/levelGen.js). d is how hard a
// made level is, from 0 (a little past the last hand-made level) to 1 (as hard as it gets).
// The caps are the hardest settings a person can still beat.
// =====================================================================================
const r1 = (x) => Math.round(x)

export const MEMORY_LEVELS = endless(
  MEMORY_BASE.map((l) => ({ ...l, time: r1(l.time * 0.88) })),
  (n, g, d, rand) => ({ pairs: rand() < 0.3 ? 15 : 16, time: r1(lerp(44, 37, d)), similar: true }),
  1,
)

const RAIN_KINDS = ['golden', 'combo', 'drops', 'score']
export const RAIN_LEVELS = endless(
  RAIN_BASE.map((l) => ({ ...l, goal: { ...l.goal, target: Math.ceil(l.goal.target * 1.12) }, mud: Math.min(0.6, l.mud + 0.03) })),
  (n, g, d, rand) => {
    const type = RAIN_KINDS[g % 4]
    const target = { golden: r1(lerp(19, 26, d)), combo: r1(lerp(52, 70, d)), drops: r1(lerp(180, 230, d)), score: r1(lerp(460, 600, d)) }[type]
    return { goal: { type, target }, time: type === 'drops' ? 60 : 55, mud: lerp(0.55, 0.62, d), speed: lerp(2.85, 3.3, d), rate: lerp(2.5, 2.9, d) }
  },
  2,
)

export const FIREFLY_LEVELS = endless(
  FIREFLY_BASE.map((l) => ({ ...l, target: Math.ceil(l.target * 1.1), life: r1(l.life * 0.92) })),
  (n, g, d) => ({ target: r1(lerp(84, 98, d)), time: 48, moths: lerp(0.58, 0.63, d), life: r1(lerp(430, 380, d)), every: r1(lerp(240, 215, d)) }),
  3,
)

export const GLIDE_LEVELS = endless(
  GLIDE_BASE.map((l) => ({ ...l, gap: Math.max(0.185, +(l.gap * 0.95).toFixed(3)), speed: r1(l.speed * 1.05) })),
  (n, g, d) => ({ branches: r1(lerp(115, 170, d)), gap: +lerp(0.185, 0.172, d).toFixed(3), speed: r1(lerp(350, 385, d)), sway: lerp(0.2, 0.24, d), wind: lerp(2.6, 3, d) }),
  4,
)

const PUZZLE_PICTURES = ['meadow', 'sunset', 'spring', 'windowsill', 'night', 'rainy', 'beach', 'autumnwood', 'snowy', 'library', 'rooftop', 'greenhouse', 'space']
export const PUZZLE_LEVELS = endless(
  PUZZLE_BASE.map((l) => ({ ...l, time: r1(l.time * 0.85) })),
  (n, g, d, rand) => {
    const picture = pick(PUZZLE_PICTURES, rand)
    // every 10th is a 6 x 6 marathon
    if (g % 10 === 0) return { size: 6, time: r1(lerp(420, 330, d)), scramble: 500, picture, numbers: false }
    if (rand() < 0.35) return { size: 4, time: r1(lerp(46, 36, d)), scramble: 220, picture, numbers: false }
    return { size: 5, time: r1(lerp(140, 112, d)), scramble: 340, picture, numbers: false }
  },
  5,
)

// made burst levels reuse the shapes and goals of the tuned hard levels, with less room
const BURST_TEMPLATES = BURST_BASE.slice(20)
export const BURST_LEVELS = endless(
  BURST_BASE.map((l) => ({ ...l, moves: Math.max(10, l.moves - 1), stars: l.stars.map((x) => r1(x * 1.05)) })),
  (n, g, d, rand) => {
    const t = pick(BURST_TEMPLATES, rand)
    const goal = t.goal.type === 'collect' ? { type: 'collect', items: Object.fromEntries(Object.entries(t.goal.items).map(([k, v]) => [k, Math.ceil(v * lerp(1, 1.15, d))])) } : t.goal.type === 'score' ? { type: 'score', target: r1(t.goal.target * lerp(1, 1.12, d)) } : t.goal
    return { ...t, goal, moves: Math.max(11, t.moves - 1 - Math.round(d * 2)), stars: t.stars.map((x) => r1(x * lerp(1.05, 1.12, d))) }
  },
  6,
)

export const RACE_LEVELS = endless(
  RACE_BASE.map((l) => ({ ...l, tapRate: Math.min(8, +(l.tapRate * 1.03).toFixed(2)) })),
  (n, g, d, rand) => ({ rivals: 3, tapRate: +lerp(7.8, 8, d).toFixed(2), smart: true, length: pick([100, 120, 140, 160, 200], rand), kick: true }),
  7,
)

const RAIN_WORDS = ['Silver', 'Midnight', 'Wild', 'Rolling', 'Electric', 'Endless', 'Whispering', 'Roaring', 'Spinning', 'Sudden', 'Golden', 'Crashing']
const RAIN_THINGS = ['rain', 'storm', 'thunder', 'drizzle', 'downpour', 'cloudburst', 'squall', 'tempest', 'deluge', 'gale', 'shower', 'monsoon']
export const RHYTHM_LEVELS = endless(
  RHYTHM_BASE.map((l) => ({ ...l, pass: Math.min(90, l.pass + 3) })),
  (n, g, d, rand) => ({
    title: `${pick(RAIN_WORDS, rand)} ${pick(RAIN_THINGS, rand)}`,
    bpm: r1(lerp(172, 192, d)),
    lanes: 4,
    density: lerp(0.88, 0.93, d),
    chords: lerp(0.35, 0.42, d),
    offbeat: 1,
    pass: r1(lerp(89, 92, d)),
    seed: 1000 + n * 13,
  }),
  8,
)

export const HOTEL_LEVELS = endless(
  HOTEL_BASE,
  (n, g, d, rand) => (d < 0.5 ? pick([{ kinds: 6, empty: 1, height: 6 }, { kinds: 7, empty: 1, height: 5 }], rand) : pick([{ kinds: 7, empty: 1, height: 6 }, { kinds: 7, empty: 1, height: 5 }, { kinds: 7, empty: 1, height: 6 }], rand)),
  9,
)

export const POP_LEVELS = endless(
  POP_BASE.map((l) => ({ ...l, drop: Math.max(3, l.drop - 1) })),
  (n, g, d, rand) => ({ rows: 11, colors: 6, drop: d > 0.8 && rand() < 0.5 ? 2 : 3 }),
  10,
)

export const GOLF_LEVELS = endless(GOLF_BASE, (n, g, d, rand) => makeCourse(rand, d), 11)

export const FISHING_LEVELS = endless(
  FISHING_BASE.map((l) => ({ ...l, target: r1(l.target * 1.1) })),
  (n, g, d) => ({
    target: r1(lerp(440, 520, d)),
    time: 55,
    count: 11,
    speed: lerp(1.9, 2.3, d),
    swing: lerp(2.6, 3.1, d),
    mix: { minnow: 2, perch: 3, carp: 2, koi: 1.4, turtle: 1, boot: 3, puffer: lerp(3.5, 4.5, d), chest: 0.35 },
  }),
  12,
)

export const SUDOKU_LEVELS = endless(
  SUDOKU_BASE.map((l) => ({ ...l, givens: Math.max(l.size === 4 ? 5 : l.size === 6 ? 11 : 23, l.givens - 2) })),
  (n, g, d, rand) => ({ size: 9, givens: r1(lerp(25, 22, d)) - (rand() < 0.3 ? 1 : 0), seed: n * 7919 + 13 }),
  13,
)

export const TILES_LEVELS = endless(
  TILES_BASE.map((l, i) => ({ ...l, kinds: Math.min(16, l.kinds + 1), mix: i >= 3 ? 2 : l.mix })),
  (n, g, d, rand) => ({
    cols: 7,
    rows: 8,
    layers: r1(lerp(9, 10, d)),
    kinds: 16,
    mix: 2,
    density: +lerp(0.93, 0.97, d).toFixed(2),
    holes: rand() < 0.3,
    seed: n * 104729 + 7,
  }),
  14,
)
