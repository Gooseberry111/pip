// Everything Pip can unlock. `level` is the growth level that unlocks the item.
// Visual details for each id live in the art components (src/components/art).

export const CATEGORIES = [
  { id: 'pots', label: 'Pots', single: 'pot' },
  { id: 'leaves', label: 'Leaves', single: 'leaf' },
  { id: 'flowers', label: 'Flowers', single: 'flower' },
  { id: 'decorations', label: 'Decorations', single: 'decoration' },
  { id: 'backgrounds', label: 'Scenes', single: 'scene' },
]

export const ITEMS = {
  pots: [
    { id: 'terracotta', name: 'Terracotta', level: 1, blurb: 'Where it all began.' },
    { id: 'cream', name: 'Cream Ceramic', level: 2, blurb: 'Soft and simple.' },
    { id: 'honey', name: 'Honey Stripe', level: 3, blurb: 'Warm, like a slow morning.' },
    { id: 'sage', name: 'Speckled Sage', level: 6, blurb: 'Little flecks, like freckles.' },
    { id: 'drip', name: 'Glaze Drip', level: 8, blurb: 'Dipped in something dreamy.' },
    { id: 'blush', name: 'Blush', level: 9, blurb: 'A gentle rosy glaze.' },
    { id: 'moon', name: 'Moonlight', level: 12, blurb: 'For sleepy, starry evenings.' },
    { id: 'strawberry', name: 'Strawberry', packet: true, blurb: 'Sweet, with tiny seeds.' },
    { id: 'lilac', name: 'Lilac Meadow', packet: true, blurb: 'Little flowers all around.' },
    { id: 'cloud', name: 'Cloud Nine', packet: true, blurb: 'Soft as a summer sky.' },
  ],
  leaves: [
    { id: 'classic', name: 'Classic', level: 1, blurb: 'Pip’s very first leaves.' },
    { id: 'round', name: 'Round', level: 3, blurb: 'Soft, round and bouncy.' },
    { id: 'heart', name: 'Heart', level: 7, blurb: 'Grown with a lot of care.' },
    { id: 'variegated', name: 'Variegated', level: 10, blurb: 'Two shades of green.' },
    { id: 'rosy', name: 'Rosy', level: 12, blurb: 'A secret pink underneath.' },
    { id: 'starlight', name: 'Starlight', packet: true, blurb: 'Twinkles a little, even by day.' },
  ],
  flowers: [
    { id: 'daisy', name: 'Daisy', level: 5, blurb: 'A cheerful little bloom.' },
    { id: 'blossom', name: 'Blossom', level: 8, blurb: 'Pink, like a spring morning.' },
    { id: 'sunny', name: 'Sunny', level: 11, blurb: 'A tiny piece of sunshine.' },
    { id: 'tulip', name: 'Tulip', level: 12, blurb: 'Holding a little cup of light.' },
    { id: 'poppy', name: 'Poppy', packet: true, blurb: 'Bright and brave.' },
  ],
  decorations: [
    { id: 'pebbles', name: 'Pebbles', level: 4, blurb: 'Smooth stones from a quiet river.' },
    { id: 'teacup', name: 'Teacup', level: 6, blurb: 'Something warm to share.' },
    { id: 'mushroom', name: 'Mushroom', level: 7, blurb: 'A tiny neighbour.' },
    { id: 'butterfly', name: 'Butterfly', level: 9, blurb: 'Comes to visit sometimes.' },
    { id: 'lantern', name: 'Lantern', level: 10, blurb: 'A warm little glow.' },
    { id: 'snail', name: 'Snail', level: 11, blurb: 'In no hurry at all.' },
    { id: 'bunny', name: 'Bunny', packet: true, blurb: 'A soft friend with floppy ears.' },
    { id: 'kitty', name: 'Kitty', packet: true, blurb: 'Napping in a sunny spot.' },
    { id: 'starjar', name: 'Firefly Jar', packet: true, blurb: 'A jar of tiny glowing friends.' },
    { id: 'rainbow', name: 'Rainbow', packet: true, blurb: 'After every little rain.' },
  ],
  backgrounds: [
    { id: 'windowsill', name: 'Windowsill', level: 1, blurb: 'A sunny spot by the window.' },
    { id: 'meadow', name: 'Meadow', level: 4, blurb: 'Soft hills and open sky.' },
    { id: 'sunset', name: 'Sunset', level: 6, blurb: 'Warm evening light.' },
    { id: 'rainy', name: 'Rainy Day', level: 7, blurb: 'Rain tapping on the glass.' },
    { id: 'night', name: 'Starry Night', level: 9, blurb: 'Quiet, with a few stars.' },
    { id: 'spring', name: 'Cherry Blossom', packet: true, blurb: 'Petals drifting on the breeze.' },
  ],
}

export const DEFAULT_LOADOUT = {
  currentPot: 'terracotta',
  currentLeaf: 'classic',
  currentFlower: null,
  currentBackground: 'windowsill',
  currentDecorations: [],
}

export const MAX_DECORATIONS = 3

export function findItem(category, id) {
  return ITEMS[category]?.find((item) => item.id === id) ?? null
}

/** Items found only in seed packets (bought with petals). */
export function packetItems() {
  return Object.entries(ITEMS).flatMap(([category, list]) =>
    list.filter((item) => item.packet).map((item) => ({ ...item, category })),
  )
}

export const PACKET_COST = 20

export function itemsUnlockedAtLevel(level) {
  const result = []
  for (const category of Object.keys(ITEMS)) {
    for (const item of ITEMS[category]) {
      if (item.level === level) result.push({ ...item, category })
    }
  }
  return result
}
