import { endless, lerp } from '@/utils/levelGen'

// Leaf Words: two word games.
//   Picture Words: four pictures, one word. Spell it from the letter tiles.
//   Word Search: find the hidden words in a grid of letters.

// Five puzzles a level, the words get longer as you go. The pictures are clues, never the
// answer itself (no sun picture for SUN): things that go with the word, or pieces that make
// it up (butter and a fly for BUTTERFLY).
const PICTURE_BASE = [
  [
    { word: 'RAIN', pics: ['☂️', '🌈', '🐸', '👢'] },
    { word: 'MOON', pics: ['🐺', '🚀', '🌊', '🧀'] },
    { word: 'FISH', pics: ['🐈', '🪝', '🍟', '🫧'] },
    { word: 'TREE', pics: ['🐿️', '🪵', '🍂', '🦉'] },
    { word: 'STAR', pics: ['🔭', '🎬', '🎄', '✨'] },
  ],
  [
    { word: 'SNOW', pics: ['⛷️', '🛷', '🧤', '🐻‍❄️'] },
    { word: 'BOOK', pics: ['🤓', '🧙', '🛏️', '👓'] },
    { word: 'SHIP', pics: ['⚓', '🌊', '🏴‍☠️', '🧭'] },
    { word: 'CAKE', pics: ['🕯️', '🎁', '🥚', '🧈'] },
    { word: 'GOLD', pics: ['🏆', '🥇', '💍', '👑'] },
  ],
  [
    { word: 'BREAD', pics: ['🥪', '🧈', '🌾', '🦆'] },
    { word: 'HONEY', pics: ['🐝', '🧸', '🍵', '🍞'] },
    { word: 'NIGHT', pics: ['🦉', '🦇', '😴', '🌙'] },
    { word: 'MUSIC', pics: ['🎸', '🎹', '🎧', '🎤'] },
    { word: 'BEACH', pics: ['🐚', '🦀', '🩴', '🏄'] },
  ],
  [
    { word: 'CLOUD', pics: ['💭', '✈️', '🐑', '🌈'] },
    { word: 'FRUIT', pics: ['🍎', '🍌', '🍇', '🍒'] },
    { word: 'SPACE', pics: ['🚀', '🪐', '👽', '🛰️'] },
    { word: 'HEART', pics: ['🩺', '💌', '🌹', '💍'] },
    { word: 'OCEAN', pics: ['🐋', '🐙', '⛵', '🌊'] },
  ],
  [
    { word: 'WATER', pics: ['🚿', '🧊', '🐳', '🌧️'] },
    { word: 'SUGAR', pics: ['🍬', '🍭', '🧁', '☕'] },
    { word: 'PAPER', pics: ['✂️', '📰', '✈️', '🖨️'] },
    { word: 'CANDLE', pics: ['🎂', '🔥', '🐝', '🌑'] },
    { word: 'WINTER', pics: ['🧣', '🧤', '⛸️', '🎄'] },
  ],
  [
    { word: 'FLOWER', pics: ['🐝', '🦋', '💐', '🌱'] },
    { word: 'SUMMER', pics: ['🍉', '🕶️', '🍦', '🏊'] },
    { word: 'CASTLE', pics: ['👑', '🐉', '🛡️', '🗡️'] },
    { word: 'PICNIC', pics: ['🧺', '🥪', '🐜', '🌳'] },
    { word: 'GARDEN', pics: ['🌷', '🐌', '🪴', '🧑‍🌾'] },
  ],
  [
    { word: 'ORANGE', pics: ['🥕', '🦊', '🎃', '🏀'] },
    { word: 'CHEESE', pics: ['🐭', '🍕', '📸', '🍷'] },
    { word: 'SPRING', pics: ['🐣', '🌷', '🐑', '🌦️'] },
    { word: 'PLANET', pics: ['🌍', '🔴', '🔭', '♻️'] },
    { word: 'DRAGON', pics: ['🔥', '🏰', '🛡️', '🦎'] },
  ],
  [
    { word: 'RAINBOW', pics: ['🦄', '🎨', '🌦️', '🪙'] },
    { word: 'KITCHEN', pics: ['🍳', '🔪', '🍽️', '🧂'] },
    { word: 'VOLCANO', pics: ['🔥', '🪨', '💥', '🏝️'] },
    { word: 'SNOWMAN', pics: ['🥕', '🧣', '🎩', '❄️'] },
    { word: 'PENGUIN', pics: ['🧊', '🐟', '🤵', '🦭'] },
  ],
  [
    { word: 'BIRTHDAY', pics: ['🎈', '🎁', '🥳', '🕯️'] },
    { word: 'CAMPING', pics: ['⛺', '🔥', '🌲', '🔦'] },
    { word: 'TREASURE', pics: ['💰', '🗺️', '💎', '🏴‍☠️'] },
    { word: 'MORNING', pics: ['🌅', '☕', '🥞', '⏰'] },
    { word: 'LIBRARY', pics: ['🤫', '📚', '🏛️', '👓'] },
  ],
  [
    { word: 'CHICKEN', pics: ['🥚', '🍗', '🐣', '🌾'] },
    { word: 'PRINCESS', pics: ['👑', '🏰', '🐸', '👗'] },
    { word: 'BALLOON', pics: ['🎉', '🎪', '🪡', '🌬️'] },
    { word: 'FIREWORKS', pics: ['🎇', '🎉', '💥', '🌃'] },
    { word: 'MUSHROOM', pics: ['🌲', '🐸', '🧚', '🍕'] },
  ],
  [
    { word: 'BUTTERFLY', pics: ['🐛', '🌸', '🧈', '🪰'] },
    { word: 'ELEPHANT', pics: ['🥜', '🎪', '🐾', '🧠'] },
    { word: 'SANDWICH', pics: ['🍞', '🧀', '🥬', '🧺'] },
    { word: 'SUNFLOWER', pics: ['☀️', '🌷', '🐦', '🟡'] },
    { word: 'CHOCOLATE', pics: ['🍪', '🐰', '🍰', '🫘'] },
  ],
  [
    { word: 'STRAWBERRY', pics: ['🥛', '🌾', '🫐', '🎾'] },
    { word: 'SNOWFLAKE', pics: ['⛄', '🥐', '🌨️', '✨'] },
    { word: 'DINOSAUR', pics: ['🥚', '🌋', '🦴', '🏛️'] },
    { word: 'ADVENTURE', pics: ['🗺️', '🧭', '⛰️', '🎒'] },
    { word: 'KANGAROO', pics: ['🐨', '🥊', '🌏', '👜'] },
  ],
  [
    { word: 'UNIVERSE', pics: ['🌌', '🪐', '🔭', '♾️'] },
    { word: 'PINEAPPLE', pics: ['🌲', '🍎', '🏝️', '🍕'] },
    { word: 'WATERFALL', pics: ['💧', '🍂', '⛰️', '🌈'] },
    { word: 'HEDGEHOG', pics: ['🌿', '🐷', '🍂', '🍎'] },
    { word: 'TELESCOPE', pics: ['🌙', '⭐', '🪐', '🏴‍☠️'] },
  ],
  [
    { word: 'FOOTBALL', pics: ['👟', '🥅', '🏟️', '🏆'] },
    { word: 'CROCODILE', pics: ['🦷', '🌊', '🌴', '⏰'] },
    { word: 'SCARECROW', pics: ['🌾', '🐦', '🎃', '👒'] },
    { word: 'AIRPLANE', pics: ['☁️', '🧳', '🛂', '👨‍✈️'] },
    { word: 'MOUNTAIN', pics: ['🧗', '🦅', '🐐', '⛷️'] },
  ],
  [
    { word: 'LADYBIRD', pics: ['👩', '🐦', '🔴', '🍃'] },
    { word: 'WATERMELON', pics: ['💧', '🍈', '☀️', '🏖️'] },
    { word: 'SWIMMING', pics: ['🩱', '🥽', '🌊', '🦈'] },
    { word: 'RAINFOREST', pics: ['🌧️', '🌳', '🦜', '🐒'] },
    { word: 'SPACESHIP', pics: ['👽', '🛸', '🌌', '👨‍🚀'] },
  ],
  [
    { word: 'LIGHTHOUSE', pics: ['💡', '🏠', '🌊', '⛵'] },
    { word: 'HURRICANE', pics: ['🌀', '💨', '🌊', '🏚️'] },
    { word: 'MOONLIGHT', pics: ['🌙', '💡', '🦉', '🐺'] },
    { word: 'THUNDER', pics: ['⚡', '🔊', '⛈️', '🔨'] },
    { word: 'PUMPKIN', pics: ['🥧', '👻', '🍂', '🧡'] },
  ],
  [
    { word: 'GIRAFFE', pics: ['🌳', '📏', '🦓', '🌍'] },
    { word: 'BLANKET', pics: ['🛏️', '🧶', '😴', '🧺'] },
    { word: 'SANDCASTLE', pics: ['🏖️', '🪣', '🌊', '👑'] },
    { word: 'OCTOPUS', pics: ['🦑', '8️⃣', '🌊', '🖋️'] },
    { word: 'VIOLIN', pics: ['🎼', '🏹', '🎶', '🎭'] },
  ],
  [
    { word: 'PYRAMID', pics: ['🐫', '🏜️', '🔺', '👑'] },
    { word: 'COMPASS', pics: ['🗺️', '⬆️', '🧲', '🏕️'] },
    { word: 'CARNIVAL', pics: ['🎪', '🎡', '🎠', '🍭'] },
    { word: 'AQUARIUM', pics: ['🐠', '🐡', '🫧', '🪸'] },
    { word: 'POPCORN', pics: ['🎬', '🌽', '🎥', '🧈'] },
  ],
  [
    { word: 'LANTERN', pics: ['🕯️', '🌙', '🎃', '✨'] },
    { word: 'BICYCLE', pics: ['🔔', '🛞', '⛑️', '🛣️'] },
    { word: 'TORNADO', pics: ['💨', '🏚️', '🐄', '🌀'] },
    { word: 'PEACOCK', pics: ['🪶', '💙', '💚', '👁️'] },
    { word: 'PANCAKES', pics: ['🍯', '🧈', '🍓', '🍳'] },
  ],
  [
    { word: 'ANCHOR', pics: ['🚢', '⛓️', '🌊', '📺'] },
    { word: 'FIREFLY', pics: ['🔥', '🪰', '🌙', '🫙'] },
    { word: 'SEAHORSE', pics: ['🌊', '🐴', '🪸', '🐠'] },
    { word: 'KEYBOARD', pics: ['🔑', '🛹', '🎹', '💻'] },
    { word: 'MERMAID', pics: ['🐚', '🔱', '🐠', '👸'] },
  ],
  [
    { word: 'SNORKEL', pics: ['🐠', '🌊', '🐢', '🥽'] },
    { word: 'AVOCADO', pics: ['🥗', '🌮', '🥪', '🟢'] },
    { word: 'PARACHUTE', pics: ['✈️', '☁️', '🌬️', '🎒'] },
    { word: 'DOLPHIN', pics: ['🌊', '🐟', '🏖️', '🧠'] },
    { word: 'BLUEBERRY', pics: ['🥞', '🧁', '💙', '🌳'] },
  ],
  [
    { word: 'ORCHESTRA', pics: ['🎻', '🎺', '🥁', '🎼'] },
    { word: 'STARFISH', pics: ['⭐', '🐟', '🌊', '🐚'] },
    { word: 'COCONUT', pics: ['🌴', '🏝️', '🥛', '🐒'] },
    { word: 'TOOTHBRUSH', pics: ['🦷', '🫧', '😁', '🛁'] },
    { word: 'CAMPFIRE', pics: ['🌭', '⭐', '🎸', '🪵'] },
  ],
  [
    { word: 'NOTEBOOK', pics: ['✏️', '📝', '🎒', '🏫'] },
    { word: 'BLIZZARD', pics: ['🌨️', '❄️', '💨', '🥶'] },
    { word: 'SKELETON', pics: ['💀', '🦴', '🎃', '🩻'] },
    { word: 'SUITCASE', pics: ['✈️', '🏨', '🗺️', '👕'] },
    { word: 'ASTRONAUT', pics: ['🚀', '🌕', '🛰️', '🪖'] },
  ],
  [
    { word: 'PEPPERMINT', pics: ['🍬', '🌿', '🍭', '❄️'] },
    { word: 'CHAMELEON', pics: ['🦎', '🌈', '🍃', '👀'] },
    { word: 'WHIRLWIND', pics: ['🌪️', '💨', '🍂', '🌀'] },
    { word: 'HONEYCOMB', pics: ['🍯', '🐝', '🟧', '🧇'] },
    { word: 'MICROSCOPE', pics: ['🦠', '🧪', '🥼', '🔍'] },
  ],
  [
    { word: 'BUMBLEBEE', pics: ['🌸', '🍯', '🌼', '🐻'] },
    { word: 'MARSHMALLOW', pics: ['🔥', '🍡', '☁️', '🏕️'] },
    { word: 'NIGHTINGALE', pics: ['🐦', '🌙', '🎵', '🌳'] },
    { word: 'THUNDERSTORM', pics: ['⛈️', '⚡', '🔊', '🌧️'] },
    { word: 'WATERCOLOUR', pics: ['🎨', '💧', '🖌️', '🖼️'] },
  ],
  [
    { word: 'STORYTELLER', pics: ['📖', '🧙', '🔥', '👂'] },
    { word: 'GRASSHOPPER', pics: ['🌾', '🦘', '🌿', '🟩'] },
    { word: 'SNOWBOARDER', pics: ['🏔️', '❄️', '🧣', '🛹'] },
    { word: 'TRAMPOLINE', pics: ['🤸', '⬆️', '🏡', '🦘'] },
    { word: 'MOUSTACHE', pics: ['🧔', '👃', '🥸', '🎩'] },
  ],
  [
    { word: 'SUBMARINE', pics: ['🌊', '🐋', '🔭', '🟡'] },
    { word: 'ESCALATOR', pics: ['⬆️', '⬇️', '🏬', '🪜'] },
    { word: 'DETECTIVE', pics: ['🔍', '🧥', '🎩', '👣'] },
    { word: 'HAMBURGER', pics: ['🥩', '🍞', '🍟', '🥒'] },
    { word: 'SATELLITE', pics: ['🌍', '📡', '🚀', '📺'] },
  ],
  [
    { word: 'BACKPACK', pics: ['🏫', '🥾', '🗺️', '🧗'] },
    { word: 'HELICOPTER', pics: ['🌀', '👨‍✈️', '⛰️', '🚑'] },
    { word: 'ICEBERG', pics: ['🧊', '🚢', '🐧', '🥶'] },
    { word: 'JELLYFISH', pics: ['🌊', '⚡', '🍮', '🐟'] },
    { word: 'GOLDFISH', pics: ['🥇', '🐟', '🫙', '🎡'] },
  ],
  [
    { word: 'TIGHTROPE', pics: ['🎪', '🤸', '⚖️', '🧵'] },
    { word: 'SKYSCRAPER', pics: ['🏙️', '🌆', '🛗', '☁️'] },
    { word: 'ARCHITECT', pics: ['📐', '🏛️', '📏', '🏗️'] },
    { word: 'BIRDHOUSE', pics: ['🐦', '🏠', '🔨', '🌳'] },
    { word: 'SUNGLASSES', pics: ['☀️', '👓', '🏖️', '🌴'] },
  ],
  [
    { word: 'GINGERBREAD', pics: ['🍪', '🏠', '🎄', '🦌'] },
    { word: 'CONSTELLATION', pics: ['⭐', '🔭', '🐻', '🌌'] },
    { word: 'BUTTERSCOTCH', pics: ['🧈', '🍬', '🥃', '🍦'] },
    { word: 'HIBERNATION', pics: ['🐻', '🦔', '❄️', '😴'] },
    { word: 'PHOTOGRAPHER', pics: ['📷', '💡', '🖼️', '👰'] },
  ],
]

// every puzzle, for the made levels after the hand-made ones
const PICTURE_BANK = PICTURE_BASE.flat()
const LONG_WORDS = PICTURE_BANK.filter((p) => p.word.length >= 7)

export const PICTURE_LEVELS = endless(
  PICTURE_BASE,
  (n, g, d, rand) => {
    // five long words, shuffled from the whole bank
    const pool = [...(d > 0.5 ? LONG_WORDS : PICTURE_BANK)]
    const out = []
    while (out.length < 5 && pool.length) out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0])
    return out
  },
  21,
)

export const WORD_HINT_COST = 5
// seconds for each level of five pictures
export const PICTURE_TIMES = endless(
  [70, 70, 75, 75, 80, 80, 85, 85, 90, 90, 95, 95, 95, 95, 100, 100, 95, 95, 95, 95, 95, 95, 100, 100, 100, 100, 100, 100, 100, 105],
  (n, g, d) => Math.round(lerp(95, 75, d)),
  22,
)

// Word search. dirs: which ways words can run ([row step, column step]).
const RIGHT_DOWN = [[0, 1], [1, 0]]
const PLUS_DIAG = [[0, 1], [1, 0], [1, 1], [-1, 1]]
const ALL = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]]

const SEARCH_BASE = [
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
  // master puzzles
  { title: 'On the farm', size: 12, dirs: ALL, time: 160, words: ['TRACTOR', 'BARN', 'HAYBALE', 'CHICKEN', 'COW', 'SHEEP', 'GOAT', 'ORCHARD', 'FENCE', 'SILO', 'PIGLET', 'FIELD', 'SCARECROW', 'EGGS'] },
  { title: 'Bakery', size: 12, dirs: ALL, time: 155, words: ['FLOUR', 'BUTTER', 'SUGAR', 'MUFFIN', 'CROISSANT', 'BAGEL', 'SCONE', 'PASTRY', 'YEAST', 'OVEN', 'CRUMB', 'DOUGH', 'TART', 'BUN'] },
  { title: 'Under the sea', size: 12, dirs: ALL, time: 155, words: ['WHALE', 'DOLPHIN', 'OCTOPUS', 'SQUID', 'CORAL', 'KELP', 'SHARK', 'TURTLE', 'URCHIN', 'OYSTER', 'LOBSTER', 'PLANKTON', 'EEL', 'RAY'] },
  { title: 'Woodland', size: 12, dirs: ALL, time: 150, words: ['BADGER', 'FOX', 'DEER', 'SQUIRREL', 'ACORN', 'BRAMBLE', 'MOSS', 'TOADSTOOL', 'HEDGEHOG', 'OWL', 'FERN', 'STREAM', 'BLUEBELL', 'LOG'] },
  { title: 'Music room', size: 12, dirs: ALL, time: 150, words: ['PIANO', 'VIOLIN', 'CELLO', 'FLUTE', 'DRUM', 'HARP', 'TRUMPET', 'GUITAR', 'MELODY', 'RHYTHM', 'CHORD', 'TEMPO', 'SONG', 'CHOIR'] },
  { title: 'Kitchen garden', size: 12, dirs: ALL, time: 150, words: ['LETTUCE', 'SPINACH', 'COURGETTE', 'PUMPKIN', 'SQUASH', 'GARLIC', 'CELERY', 'PEPPER', 'TURNIP', 'PARSNIP', 'SHALLOT', 'MARROW', 'CHARD', 'RHUBARB'] },
  { title: 'Space trip', size: 12, dirs: ALL, time: 145, words: ['ROCKET', 'ASTRONAUT', 'LAUNCH', 'GRAVITY', 'CRATER', 'JUPITER', 'NEPTUNE', 'MERCURY', 'COSMOS', 'LUNAR', 'SOLAR', 'ALIEN', 'PROBE', 'STATION'] },
  { title: 'Butterflies', size: 13, dirs: ALL, time: 160, words: ['MONARCH', 'PEACOCK', 'ADMIRAL', 'BRIMSTONE', 'COMMA', 'SKIPPER', 'CATERPILLAR', 'CHRYSALIS', 'NECTAR', 'WINGS', 'ANTENNA', 'MEADOW', 'POLLEN', 'FLUTTER'] },
  { title: 'Cosy evening', size: 13, dirs: ALL, time: 160, words: ['CANDLE', 'BLANKET', 'COCOA', 'SLIPPERS', 'FIREPLACE', 'STORYBOOK', 'PILLOW', 'LANTERN', 'TEAPOT', 'KNITTING', 'PUZZLE', 'CUSHION', 'MOONLIGHT', 'SNUG', 'NAP'] },
  { title: 'Pond and river', size: 13, dirs: ALL, time: 155, words: ['KINGFISHER', 'OTTER', 'DRAGONFLY', 'TADPOLE', 'MINNOW', 'BULRUSH', 'WATERLILY', 'CURRENT', 'RIPPLE', 'BANK', 'PEBBLE', 'SALMON', 'TROUT', 'MOORHEN', 'WEIR'] },
  { title: 'Holidays', size: 13, dirs: ALL, time: 155, words: ['SUITCASE', 'PASSPORT', 'POSTCARD', 'SUNHAT', 'CAMERA', 'TICKET', 'JOURNEY', 'ISLAND', 'COTTAGE', 'HOSTEL', 'SOUVENIR', 'BEACH', 'MAP', 'TRAIN', 'FERRY'] },
  { title: 'Wild flowers', size: 13, dirs: ALL, time: 150, words: ['BUTTERCUP', 'CLOVER', 'FOXGLOVE', 'HONEYSUCKLE', 'PRIMROSE', 'COWSLIP', 'THISTLE', 'HEATHER', 'CORNFLOWER', 'SNOWDROP', 'DANDELION', 'TEASEL', 'VETCH', 'YARROW', 'CAMPION'] },
  { title: 'Weather station', size: 13, dirs: ALL, time: 150, words: ['BAROMETER', 'FORECAST', 'PRESSURE', 'RAINFALL', 'SUNSHINE', 'HUMIDITY', 'WINDVANE', 'CELSIUS', 'DEGREES', 'ISOBAR', 'DROUGHT', 'HEATWAVE', 'CLIMATE', 'CHART', 'GUST'] },
  { title: 'Treasure hunt', size: 13, dirs: ALL, time: 145, words: ['MAP', 'COMPASS', 'SHOVEL', 'CHEST', 'GOLD', 'JEWELS', 'PIRATE', 'PARROT', 'ISLAND', 'RIDDLE', 'CLUE', 'TUNNEL', 'LANTERN', 'CAVE', 'RUBY', 'PEARL'] },
  { title: 'The great garden', size: 13, dirs: ALL, time: 145, words: ['GREENHOUSE', 'ALLOTMENT', 'WHEELBARROW', 'TRELLIS', 'PERGOLA', 'TOPIARY', 'ROCKERY', 'POTTING', 'MULCH', 'PRUNING', 'WATERING', 'BORDER', 'LAWN', 'HEDGE', 'GNOME', 'SHED'] },
]

const BIG_THEMES = SEARCH_BASE.filter((t) => t.words.length >= 11)
export const SEARCH_LEVELS = endless(
  SEARCH_BASE.map((l) => ({ ...l, time: Math.round(l.time * 0.85) })),
  (n, g, d, rand) => {
    const theme = BIG_THEMES[Math.floor(rand() * BIG_THEMES.length)]
    const words = [...theme.words].sort(() => rand() - 0.5).slice(0, Math.round(lerp(12, 16, d)))
    return { title: theme.title, size: 13, dirs: ALL, time: Math.round(lerp(130, 100, d)), words }
  },
  23,
)

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
  // plenty of decoy letters, so the answer can't just be read off the tiles
  const total = Math.min(18, Math.max(12, word.length + 6))
  const letters = word.split('')
  while (letters.length < total) letters.push(LETTERS[Math.floor(rand() * LETTERS.length)])
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[letters[i], letters[j]] = [letters[j], letters[i]]
  }
  return letters
}
