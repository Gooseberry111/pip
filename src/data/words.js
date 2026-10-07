// Leaf Words: two word games.
//   Picture Words: four pictures, one word. Spell it from the letter tiles.
//   Word Search: find the hidden words in a grid of letters.

// Five puzzles a level, the words get longer as you go.
export const PICTURE_LEVELS = [
  [
    { word: 'SUN', pics: ['☀️', '🌻', '🕶️', '🏖️'] },
    { word: 'RAIN', pics: ['☔', '🌧️', '💧', '🌈'] },
    { word: 'TREE', pics: ['🌳', '🍎', '🐿️', '🍂'] },
    { word: 'LEAF', pics: ['🍃', '🍂', '🍁', '🌿'] },
    { word: 'STAR', pics: ['⭐', '🌟', '✨', '🌠'] },
  ],
  [
    { word: 'MOON', pics: ['🌙', '🌕', '🐺', '🚀'] },
    { word: 'SNOW', pics: ['❄️', '⛄', '🎿', '🏔️'] },
    { word: 'FISH', pics: ['🐟', '🎣', '🐠', '🦈'] },
    { word: 'CAKE', pics: ['🎂', '🍰', '🧁', '🎉'] },
    { word: 'BIRD', pics: ['🐦', '🥚', '🦜', '🪶'] },
  ],
  [
    { word: 'HONEY', pics: ['🍯', '🐝', '🍞', '🍵'] },
    { word: 'BEACH', pics: ['🏖️', '🐚', '🌊', '🦀'] },
    { word: 'CLOUD', pics: ['☁️', '🌥️', '✈️', '🌧️'] },
    { word: 'FRUIT', pics: ['🍎', '🍌', '🍇', '🍓'] },
    { word: 'MUSIC', pics: ['🎵', '🎸', '🎹', '🎧'] },
  ],
  [
    { word: 'NIGHT', pics: ['🌙', '🦉', '🌃', '😴'] },
    { word: 'BREAD', pics: ['🍞', '🥖', '🥪', '🧈'] },
    { word: 'SPACE', pics: ['🚀', '🪐', '🌌', '🛰️'] },
    { word: 'HEART', pics: ['❤️', '💌', '💘', '💗'] },
    { word: 'OCEAN', pics: ['🌊', '🐋', '🐙', '⛵'] },
  ],
  [
    { word: 'FLOWER', pics: ['🌸', '🌹', '🌷', '💐'] },
    { word: 'SUMMER', pics: ['🏖️', '🍉', '🕶️', '🍦'] },
    { word: 'WINTER', pics: ['❄️', '🧣', '⛄', '🧤'] },
    { word: 'CASTLE', pics: ['🏰', '👑', '🐉', '🛡️'] },
    { word: 'PICNIC', pics: ['🧺', '🥪', '🍉', '🌳'] },
  ],
  [
    { word: 'ORANGE', pics: ['🍊', '🥕', '🦊', '🎃'] },
    { word: 'CHEESE', pics: ['🧀', '🐭', '🍕', '🍔'] },
    { word: 'SPRING', pics: ['🌱', '🐣', '🌷', '🌦️'] },
    { word: 'PLANET', pics: ['🪐', '🌍', '🔭', '🌌'] },
    { word: 'GARDEN', pics: ['🌷', '🥕', '🐌', '🪴'] },
  ],
  [
    { word: 'RAINBOW', pics: ['🌈', '🦄', '🎨', '🌦️'] },
    { word: 'KITCHEN', pics: ['🍳', '🔪', '🍽️', '🧂'] },
    { word: 'VOLCANO', pics: ['🌋', '🔥', '🪨', '💥'] },
    { word: 'SNOWMAN', pics: ['⛄', '🥕', '🧣', '❄️'] },
    { word: 'PENGUIN', pics: ['🐧', '🧊', '🐟', '❄️'] },
  ],
  [
    { word: 'BIRTHDAY', pics: ['🎂', '🎈', '🎁', '🥳'] },
    { word: 'CAMPING', pics: ['⛺', '🔥', '🏕️', '🌲'] },
    { word: 'TREASURE', pics: ['💰', '🗺️', '💎', '👑'] },
    { word: 'MORNING', pics: ['🌅', '☕', '🥞', '⏰'] },
    { word: 'LIGHTNING', pics: ['⚡', '🌩️', '🔋', '💡'] },
  ],
  [
    { word: 'KING', pics: ['👑', '🤴', '🏰', '🦁'] },
    { word: 'BOOK', pics: ['📚', '📖', '📕', '🔖'] },
    { word: 'MILK', pics: ['🥛', '🐄', '🍪', '🥣'] },
    { word: 'GOLD', pics: ['🥇', '💰', '👑', '🏆'] },
    { word: 'TRAIN', pics: ['🚂', '🚆', '🛤️', '🚉'] },
  ],
  [
    { word: 'PLANT', pics: ['🪴', '🌱', '🌿', '🌵'] },
    { word: 'HORSE', pics: ['🐴', '🏇', '🎠', '🐎'] },
    { word: 'APPLE', pics: ['🍎', '🍏', '🥧', '🧃'] },
    { word: 'PARTY', pics: ['🎉', '🎈', '🥳', '🎊'] },
    { word: 'GHOST', pics: ['👻', '🎃', '🏚️', '😱'] },
  ],
  [
    { word: 'PIRATE', pics: ['🦜', '💰', '🗺️', '⚓'] },
    { word: 'DRAGON', pics: ['🐉', '🐲', '🔥', '🏰'] },
    { word: 'ROCKET', pics: ['🚀', '🔥', '🌕', '👨‍🚀'] },
    { word: 'FOREST', pics: ['🌲', '🌳', '🦌', '🍄'] },
    { word: 'BRIDGE', pics: ['🌉', '🛤️', '🌊', '🚗'] },
  ],
  [
    { word: 'PUMPKIN', pics: ['🎃', '🥧', '🍂', '👻'] },
    { word: 'DOCTOR', pics: ['🩺', '💉', '🏥', '💊'] },
    { word: 'MONKEY', pics: ['🐒', '🍌', '🐵', '🌴'] },
    { word: 'COFFEE', pics: ['☕', '🥐', '⏰', '😴'] },
    { word: 'CIRCUS', pics: ['🎪', '🤡', '🐘', '🎠'] },
  ],
  [
    { word: 'ROBOT', pics: ['🤖', '⚙️', '🔋', '🦾'] },
    { word: 'WIZARD', pics: ['🧙', '🪄', '🔮', '✨'] },
    { word: 'GUITAR', pics: ['🎸', '🎵', '🎤', '🤘'] },
    { word: 'HOLIDAY', pics: ['✈️', '🏖️', '🧳', '🍹'] },
    { word: 'POTATO', pics: ['🥔', '🍟', '🍠', '🥘'] },
  ],
  [
    { word: 'DOLPHIN', pics: ['🐬', '🌊', '🐟', '🐳'] },
    { word: 'CHICKEN', pics: ['🐔', '🥚', '🍗', '🐣'] },
    { word: 'PRINCESS', pics: ['👸', '👑', '🏰', '🦄'] },
    { word: 'LIBRARY', pics: ['📚', '🤫', '📖', '🏛️'] },
    { word: 'BALLOON', pics: ['🎈', '🎉', '🎂', '🎪'] },
  ],
  [
    { word: 'FIREWORKS', pics: ['🎆', '🎇', '🎉', '✨'] },
    { word: 'MUSHROOM', pics: ['🍄', '🌲', '🐸', '🧚'] },
    { word: 'BUTTERFLY', pics: ['🦋', '🐛', '🌸', '🌈'] },
    { word: 'ELEPHANT', pics: ['🐘', '🥜', '🎪', '🐾'] },
    { word: 'SANDWICH', pics: ['🥪', '🍞', '🧀', '🥬'] },
  ],
  [
    { word: 'SUNFLOWER', pics: ['🌻', '☀️', '🌱', '🐦'] },
    { word: 'STRAWBERRY', pics: ['🍓', '🍰', '🥛', '🌱'] },
    { word: 'SNOWFLAKE', pics: ['❄️', '⛄', '🌨️', '🧤'] },
    { word: 'CHOCOLATE', pics: ['🍫', '🍪', '🍰', '☕'] },
    { word: 'DINOSAUR', pics: ['🦕', '🦖', '🥚', '🌋'] },
  ],
  [
    { word: 'ADVENTURE', pics: ['🗺️', '🧭', '⛰️', '🎒'] },
    { word: 'KANGAROO', pics: ['🦘', '🐨', '🥊', '🌏'] },
    { word: 'UNIVERSE', pics: ['🌌', '🪐', '⭐', '🌍'] },
    { word: 'PINEAPPLE', pics: ['🍍', '🏝️', '🍕', '🥤'] },
    { word: 'WATERFALL', pics: ['🌊', '⛰️', '💦', '🌈'] },
  ],
  [
    { word: 'HEDGEHOG', pics: ['🦔', '🍂', '🍎', '🌙'] },
    { word: 'TELESCOPE', pics: ['🔭', '🌙', '⭐', '🪐'] },
    { word: 'FOOTBALL', pics: ['⚽', '🏈', '🥅', '👟'] },
    { word: 'CROCODILE', pics: ['🐊', '🌊', '🦷', '🌴'] },
    { word: 'SCARECROW', pics: ['🌾', '🐦', '🎃', '👒'] },
  ],
  [
    { word: 'AIRPLANE', pics: ['✈️', '☁️', '🧳', '🛫'] },
    { word: 'MOUNTAIN', pics: ['⛰️', '🏔️', '🧗', '🦅'] },
    { word: 'LADYBIRD', pics: ['🐞', '🍃', '🔴', '⚫'] },
    { word: 'WATERMELON', pics: ['🍉', '☀️', '🧃', '🏖️'] },
    { word: 'SWIMMING', pics: ['🏊', '🌊', '🩱', '🏖️'] },
  ],
  [
    { word: 'RAINFOREST', pics: ['🌧️', '🌳', '🦜', '🐒'] },
    { word: 'SPACESHIP', pics: ['🚀', '👽', '🛸', '🌌'] },
    { word: 'LIGHTHOUSE', pics: ['💡', '🏠', '🌊', '⛵'] },
    { word: 'HURRICANE', pics: ['🌀', '🌊', '💨', '🌧️'] },
    { word: 'MOONLIGHT', pics: ['🌙', '✨', '🦉', '🌃'] },
  ],
]

export const WORD_HINT_COST = 3
// seconds for each level of five pictures
export const PICTURE_TIMES = [90, 90, 100, 100, 110, 110, 120, 120, 90, 95, 105, 105, 105, 110, 115, 110, 110, 105, 100, 100]

// Word search. dirs: which ways words can run ([row step, column step]).
const RIGHT_DOWN = [[0, 1], [1, 0]]
const PLUS_DIAG = [[0, 1], [1, 0], [1, 1], [-1, 1]]
const ALL = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]]

export const SEARCH_LEVELS = [
  { title: 'In the garden', size: 7, dirs: RIGHT_DOWN, time: 120, words: ['SEED', 'SOIL', 'ROOT', 'STEM', 'LEAF'] },
  { title: 'Rainy day', size: 8, dirs: PLUS_DIAG, time: 120, words: ['RAIN', 'CLOUD', 'PUDDLE', 'BOOTS', 'DRIP', 'WET'] },
  { title: 'Little bugs', size: 8, dirs: PLUS_DIAG, time: 110, words: ['BEE', 'ANT', 'MOTH', 'SNAIL', 'BEETLE', 'WORM', 'GNAT'] },
  { title: 'Fruit bowl', size: 9, dirs: ALL, time: 150, words: ['APPLE', 'PEAR', 'PLUM', 'GRAPE', 'MANGO', 'LEMON', 'CHERRY', 'FIG'] },
  { title: 'Wild weather', size: 10, dirs: ALL, time: 170, words: ['STORM', 'THUNDER', 'BREEZE', 'FROST', 'SUNNY', 'MIST', 'HAIL', 'GALE', 'FOG', 'SLEET'] },
  { title: 'Flower shop', size: 10, dirs: ALL, time: 180, words: ['ROSE', 'TULIP', 'DAISY', 'LILY', 'POPPY', 'IRIS', 'ORCHID', 'VIOLET', 'PANSY', 'LUPIN', 'ASTER', 'PEONY'] },
  { title: 'Birds', size: 10, dirs: ALL, time: 170, words: ['ROBIN', 'WREN', 'OWL', 'CROW', 'FINCH', 'EAGLE', 'HERON', 'SWAN', 'DOVE', 'JAY'] },
  { title: 'Vegetable patch', size: 10, dirs: ALL, time: 170, words: ['CARROT', 'PEA', 'BEAN', 'KALE', 'LEEK', 'ONION', 'POTATO', 'RADISH', 'CORN', 'BEET', 'CABBAGE'] },
  { title: 'Pond life', size: 10, dirs: ALL, time: 165, words: ['FROG', 'NEWT', 'DUCK', 'FISH', 'LILY', 'REED', 'TOAD', 'SNAIL', 'HERON', 'MOSS', 'ALGAE'] },
  { title: 'Trees', size: 10, dirs: ALL, time: 165, words: ['OAK', 'ASH', 'ELM', 'PINE', 'BIRCH', 'MAPLE', 'WILLOW', 'CEDAR', 'BEECH', 'HOLLY', 'YEW', 'LARCH'] },
  { title: 'Seasons', size: 11, dirs: ALL, time: 180, words: ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER', 'BLOSSOM', 'HARVEST', 'SNOW', 'LEAVES', 'FROST', 'BLOOM', 'SUNSHINE'] },
  { title: 'Garden tools', size: 11, dirs: ALL, time: 175, words: ['SPADE', 'RAKE', 'HOE', 'TROWEL', 'HOSE', 'SHEARS', 'GLOVES', 'BUCKET', 'FORK', 'BARROW', 'SEEDS', 'TWINE'] },
  { title: 'Night sky', size: 11, dirs: ALL, time: 170, words: ['MOON', 'STAR', 'COMET', 'PLANET', 'ORBIT', 'GALAXY', 'NEBULA', 'ECLIPSE', 'METEOR', 'SATURN', 'MARS', 'VENUS'] },
  { title: 'Picnic', size: 11, dirs: ALL, time: 165, words: ['BASKET', 'BLANKET', 'SANDWICH', 'LEMONADE', 'APPLE', 'CAKE', 'SCONE', 'JAM', 'NAPKIN', 'CHEESE', 'GRAPES', 'TEA'] },
  { title: 'Seaside', size: 11, dirs: ALL, time: 160, words: ['SHELL', 'SAND', 'WAVE', 'CRAB', 'GULL', 'PIER', 'ROCKPOOL', 'TIDE', 'BUCKET', 'SPADE', 'DUNE', 'CORAL'] },
  { title: 'Mini beasts', size: 12, dirs: ALL, time: 175, words: ['SPIDER', 'LADYBIRD', 'BEETLE', 'EARWIG', 'WOODLOUSE', 'CRICKET', 'APHID', 'HORNET', 'WASP', 'FLEA', 'MIDGE', 'CENTIPEDE', 'SLUG'] },
  { title: 'Herbs', size: 12, dirs: ALL, time: 170, words: ['BASIL', 'MINT', 'SAGE', 'THYME', 'PARSLEY', 'DILL', 'CHIVES', 'ROSEMARY', 'OREGANO', 'CORIANDER', 'FENNEL', 'TARRAGON', 'BAY'] },
  { title: 'Rainforest', size: 12, dirs: ALL, time: 165, words: ['JAGUAR', 'TOUCAN', 'SLOTH', 'PARROT', 'CANOPY', 'VINE', 'ORCHID', 'GECKO', 'MONKEY', 'TAPIR', 'PYTHON', 'FERN', 'MANGO'] },
  { title: 'Weather words', size: 12, dirs: ALL, time: 160, words: ['DRIZZLE', 'SHOWER', 'TORNADO', 'BLIZZARD', 'MONSOON', 'RAINBOW', 'CYCLONE', 'HUMID', 'CLOUDY', 'BREEZY', 'THAW', 'DEW', 'SQUALL'] },
  { title: 'Greenhouse', size: 12, dirs: ALL, time: 160, words: ['SEEDLING', 'CACTUS', 'FERN', 'ALOE', 'TOMATO', 'CHILLI', 'POT', 'COMPOST', 'SPROUT', 'CUTTING', 'BULB', 'VINE', 'MISTER', 'LABEL'] },
]

const LETTERS = 'EEEEAAAIIOOUTTNNSSRRLLHDCMPBGFWYKV'

export function rngFrom(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Hide the words in a grid. Returns { grid, placed: [{ word, cells }] } or null. */
export function makeSearch({ size, dirs, words }, rand = Math.random) {
  for (let attempt = 0; attempt < 60; attempt++) {
    const grid = Array.from({ length: size }, () => Array(size).fill(''))
    const placed = []
    const order = [...words].sort((a, b) => b.length - a.length)
    let ok = true
    for (const word of order) {
      let done = false
      for (let tries = 0; tries < 300 && !done; tries++) {
        const [dr, dc] = dirs[Math.floor(rand() * dirs.length)]
        const r0 = Math.floor(rand() * size)
        const c0 = Math.floor(rand() * size)
        const r1 = r0 + dr * (word.length - 1)
        const c1 = c0 + dc * (word.length - 1)
        if (r1 < 0 || r1 >= size || c1 < 0 || c1 >= size) continue
        const cells = Array.from({ length: word.length }, (_, i) => [r0 + dr * i, c0 + dc * i])
        if (cells.some(([r, c], i) => grid[r][c] && grid[r][c] !== word[i])) continue
        cells.forEach(([r, c], i) => (grid[r][c] = word[i]))
        placed.push({ word, cells })
        done = true
      }
      if (!done) {
        ok = false
        break
      }
    }
    if (!ok) continue
    for (const row of grid) for (let c = 0; c < size; c++) if (!row[c]) row[c] = LETTERS[Math.floor(rand() * LETTERS.length)]
    return { grid, placed }
  }
  return null
}

/** Letter tiles for a picture puzzle: the word's letters plus a few extras, shuffled. */
export function letterBank(word, rand = Math.random) {
  const total = word.length <= 4 ? 10 : word.length <= 6 ? 12 : word.length <= 8 ? 14 : 16
  const letters = word.split('')
  while (letters.length < total) letters.push(LETTERS[Math.floor(rand() * LETTERS.length)])
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[letters[i], letters[j]] = [letters[j], letters[i]]
  }
  return letters
}
