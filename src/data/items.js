// Everything Pip can unlock. `level` is the growth level that unlocks the item.
// Visual details for each id live in the art components (src/components/art).

export const CATEGORIES = [
  { id: 'pots', label: 'Pots', single: 'pot' },
  { id: 'leaves', label: 'Leaves', single: 'leaf' },
  { id: 'flowers', label: 'Flowers', single: 'flower' },
  { id: 'decorations', label: 'Decorations', single: 'decoration' },
  { id: 'backgrounds', label: 'Scenes', single: 'scene' },
  { id: 'accessories', label: 'Accessories', single: 'accessory' },
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
    { id: 'mint', name: 'Fresh Mint', shop: 30, blurb: 'Cool and clean, like morning dew.' },
    { id: 'cocoa', name: 'Cocoa', shop: 40, blurb: 'Warm and rich, like hot chocolate.' },
    { id: 'coral', name: 'Coral Sunset', shop: 55, blurb: 'The last light of a summer day.' },
    { id: 'midnight', name: 'Midnight', shop: 70, blurb: 'Deep blue, for night owls.' },
    { id: 'lemon', name: 'Lemon Drop', shop: 35, blurb: 'Bright as a sunny kitchen.' },
    { id: 'peach', name: 'Peach Fuzz', shop: 40, blurb: 'Soft, warm and fuzzy.' },
    { id: 'pumpkinpot', name: 'Pumpkin', shop: 45, blurb: 'Cosy autumn colours.' },
    { id: 'ocean', name: 'Ocean Wave', shop: 50, blurb: 'Cool blue, like a calm sea.' },
    { id: 'charcoal', name: 'Charcoal', shop: 55, blurb: 'Smart and simple.' },
    { id: 'galaxy', name: 'Galaxy', shop: 90, blurb: 'A whole night sky, with stars.' },
    { id: 'gold', name: 'Golden', shop: 120, blurb: 'For a very special plant.' },
    { id: 'forest', name: 'Deep Forest', packet: true, blurb: 'The green of tall old trees.' },
    { id: 'rosepot', name: 'Rose Quartz', packet: true, blurb: 'A soft pink stone glaze.' },
  ],
  leaves: [
    { id: 'classic', name: 'Classic', level: 1, blurb: 'Pip’s very first leaves.' },
    { id: 'round', name: 'Round', level: 3, blurb: 'Soft, round and bouncy.' },
    { id: 'heart', name: 'Heart', level: 7, blurb: 'Grown with a lot of care.' },
    { id: 'variegated', name: 'Variegated', level: 10, blurb: 'Two shades of green.' },
    { id: 'rosy', name: 'Rosy', level: 12, blurb: 'A secret pink underneath.' },
    { id: 'starlight', name: 'Starlight', packet: true, blurb: 'Twinkles a little, even by day.' },
    { id: 'golden', name: 'Golden Hour', shop: 45, blurb: 'Leaves that glow like late sunshine.' },
    { id: 'frost', name: 'Frost', shop: 60, blurb: 'A silvery touch of winter.' },
    { id: 'lime', name: 'Lime Zest', shop: 35, blurb: 'Fresh and zingy.' },
    { id: 'autumn', name: 'Autumn', shop: 50, blurb: 'Orange and red, like falling leaves.' },
    { id: 'seaglass', name: 'Sea Glass', shop: 55, blurb: 'Blue green, smoothed by the waves.' },
    { id: 'ruby', name: 'Ruby', shop: 70, blurb: 'Deep red and a little dramatic.' },
    { id: 'minty', name: 'Mint Leaf', packet: true, blurb: 'Smells fresh, probably.' },
    { id: 'plum', name: 'Plum', packet: true, blurb: 'Dark purple, rare and lovely.' },
  ],
  flowers: [
    { id: 'daisy', name: 'Daisy', level: 5, blurb: 'A cheerful little bloom.' },
    { id: 'blossom', name: 'Blossom', level: 8, blurb: 'Pink, like a spring morning.' },
    { id: 'sunny', name: 'Sunny', level: 11, blurb: 'A tiny piece of sunshine.' },
    { id: 'tulip', name: 'Tulip', level: 12, blurb: 'Holding a little cup of light.' },
    { id: 'poppy', name: 'Poppy', packet: true, blurb: 'Bright and brave.' },
    { id: 'violet', name: 'Violet', shop: 40, blurb: 'Small, sweet and a little shy.' },
    { id: 'cornflower', name: 'Cornflower', shop: 50, blurb: 'The bluest blue in the field.' },
    { id: 'peony', name: 'Peony', shop: 65, blurb: 'Big, soft and full of petals.' },
    { id: 'marigold', name: 'Marigold', shop: 35, blurb: 'Orange and cheerful.' },
    { id: 'bluebell', name: 'Bluebell', shop: 45, blurb: 'Rings very quietly.' },
    { id: 'cosmos', name: 'Cosmos', shop: 50, blurb: 'Dancing pink petals.' },
    { id: 'lily', name: 'Lily', shop: 60, blurb: 'Elegant and white.' },
    { id: 'rose', name: 'Rose', shop: 75, blurb: 'Classic, red and romantic.' },
    { id: 'hibiscus', name: 'Hibiscus', packet: true, blurb: 'A holiday in a flower.' },
    { id: 'lavender', name: 'Lavender', packet: true, blurb: 'Calm and sleepy.' },
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
    { id: 'frog', name: 'Frog', shop: 35, blurb: 'Says hello with a little ribbit.' },
    { id: 'birdhouse', name: 'Birdhouse', shop: 45, blurb: 'A cosy home for a tiny bird.' },
    { id: 'fairylights', name: 'Fairy Lights', shop: 60, blurb: 'A string of warm little stars.' },
    { id: 'acorn', name: 'Acorn', shop: 15, blurb: 'A tiny oak tree, one day.' },
    { id: 'books', name: 'Book Stack', shop: 30, blurb: 'Stories about faraway gardens.' },
    { id: 'candle', name: 'Candle', shop: 30, blurb: 'A soft flicker for quiet evenings.' },
    { id: 'cactus', name: 'Cactus Friend', shop: 40, blurb: 'Prickly outside, lovely inside.' },
    { id: 'duckling', name: 'Duckling', shop: 50, blurb: 'Follows you everywhere.' },
    { id: 'musicbox', name: 'Music Box', shop: 70, blurb: 'Plays a little tune.' },
    { id: 'hedgehog', name: 'Hedgehog', packet: true, blurb: 'Curled up and snoozing.' },
    { id: 'crystal', name: 'Crystal', packet: true, blurb: 'Catches the light in rainbows.' },
  ],
  accessories: [
    { id: 'glasses', name: 'Round Glasses', shop: 25, blurb: 'For reading seed packets.' },
    { id: 'bowtie', name: 'Bow Tie', shop: 30, blurb: 'Dressed up for a garden party.' },
    { id: 'bow', name: 'Ribbon Bow', shop: 30, blurb: 'A little pink bow, tied with care.' },
    { id: 'freckles', name: 'Freckles', shop: 20, blurb: 'From all that sunshine.' },
    { id: 'scarf', name: 'Cosy Scarf', shop: 45, blurb: 'Warm and snug on chilly mornings.' },
    { id: 'beret', name: 'Chef’s Beret', badge: 'cook-10', blurb: 'Earned in the farm kitchen.' },
    { id: 'heartglasses', name: 'Heart Glasses', badge: 'gift-5', blurb: 'For the most generous friends.' },
    { id: 'flowercrown', name: 'Flower Crown', badge: 'perfect-7', blurb: 'Seven perfect days of drinks.' },
  ],
  backgrounds: [
    { id: 'windowsill', name: 'Windowsill', level: 1, blurb: 'A sunny spot by the window.' },
    { id: 'meadow', name: 'Meadow', level: 4, blurb: 'Soft hills and open sky.' },
    { id: 'sunset', name: 'Sunset', level: 6, blurb: 'Warm evening light.' },
    { id: 'rainy', name: 'Rainy Day', level: 7, blurb: 'Rain tapping on the glass.' },
    { id: 'night', name: 'Starry Night', level: 9, blurb: 'Quiet, with a few stars.' },
    { id: 'spring', name: 'Cherry Blossom', packet: true, blurb: 'Petals drifting on the breeze.' },
    { id: 'beach', name: 'Seaside', shop: 80, blurb: 'Waves, sand and a gentle breeze.' },
    { id: 'autumnwood', name: 'Autumn Wood', shop: 80, blurb: 'Golden trees and falling leaves.' },
    { id: 'snowy', name: 'Snowy Day', shop: 85, blurb: 'Soft snow falling outside.' },
    { id: 'library', name: 'Cosy Library', shop: 100, blurb: 'Shelves of books and a warm lamp.' },
    { id: 'rooftop', name: 'City Rooftop', shop: 110, blurb: 'Twinkling windows at dusk.' },
    { id: 'greenhouse', name: 'Greenhouse', shop: 120, blurb: 'Glass walls and lots of friends.' },
    { id: 'space', name: 'Outer Space', packet: true, blurb: 'Pip, the first plant on the moon.' },
  ],
}

export const DEFAULT_LOADOUT = {
  currentPot: 'terracotta',
  currentLeaf: 'classic',
  currentFlower: null,
  currentBackground: 'windowsill',
  currentAccessory: null,
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

/** Items bought with petals in the shop. */
export function shopItems() {
  return Object.entries(ITEMS).flatMap(([category, list]) =>
    list.filter((item) => item.shop).map((item) => ({ ...item, category })),
  )
}

export function itemsUnlockedAtLevel(level) {
  const result = []
  for (const category of Object.keys(ITEMS)) {
    for (const item of ITEMS[category]) {
      if (item.level === level) result.push({ ...item, category })
    }
  }
  return result
}
