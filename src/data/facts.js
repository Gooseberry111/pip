// "Did you know?" facts and gentle thoughts from Pip.
// Facts are kept simple and accurate (popular myths are left out on purpose).
// A new one is ready every few hours; read ones collect in the Fact book.

// Two facts a day: a new one at 6am and another at 6pm, local time.
export const FACT_EVERY_HOURS = 12
const FACT_START_HOUR = 6

export const FACTS = [
  // ---- plants ----
  { id: 'bamboo', topic: 'Plants', text: 'Some bamboo can grow almost a metre in a single day, making it one of the fastest growing plants on Earth.' },
  { id: 'sunflower-florets', topic: 'Plants', text: 'The middle of a sunflower is made of hundreds of tiny flowers called florets. Each one can become a seed.' },
  { id: 'sunflower-follow', topic: 'Plants', text: 'Young sunflowers turn to follow the sun across the sky. Once they bloom, most settle facing east.' },
  { id: 'old-seed', topic: 'Plants', text: 'A date palm was grown from a seed about 2,000 years old, found in an ancient fortress in Israel.' },
  { id: 'stomata', topic: 'Plants', text: 'Leaves breathe through tiny pores called stomata, mostly on their undersides. They open and close like little mouths.' },
  { id: 'photosynthesis', topic: 'Plants', text: 'Plants make their own food from sunlight, water and air. It’s called photosynthesis, and it releases the oxygen we breathe.' },
  { id: 'tomato', topic: 'Plants', text: 'Botanically, a tomato is a fruit: it grows from the flower and holds the seeds.' },
  { id: 'banana-berry', topic: 'Plants', text: 'Bananas are berries, but strawberries are not, at least to a botanist.' },
  { id: 'strawberry-seeds', topic: 'Plants', text: 'A strawberry wears its seeds on the outside, around 200 of them on each berry.' },
  { id: 'peanut', topic: 'Plants', text: 'Peanuts aren’t really nuts. They’re legumes, cousins of peas and beans, and they ripen underground.' },
  { id: 'coffee', topic: 'Plants', text: 'Coffee beans are the seeds of a small red fruit often called a coffee cherry.' },
  { id: 'cut-grass', topic: 'Plants', text: 'That fresh cut grass smell comes from chemicals grass releases when it’s damaged.' },
  { id: 'flytrap', topic: 'Plants', text: 'A Venus flytrap counts! Its trap usually only snaps shut if its tiny trigger hairs are touched twice in quick succession.' },
  { id: 'mimosa', topic: 'Plants', text: 'The sensitive plant, Mimosa pudica, folds up its leaves within seconds when you touch it.' },
  { id: 'auxin', topic: 'Plants', text: 'Plants lean towards light thanks to a hormone called auxin, which makes cells on the shady side grow longer.' },
  { id: 'roots-gravity', topic: 'Plants', text: 'Root tips can sense gravity, which is how roots know to grow down even in the dark.' },
  { id: 'hyperion', topic: 'Plants', text: 'The tallest known tree is a coast redwood named Hyperion, about 116 metres tall. That’s taller than a 30 storey building.' },
  { id: 'bristlecone', topic: 'Plants', text: 'Some bristlecone pines in California are more than 4,800 years old. One began growing before the Great Pyramid of Giza was built.' },
  { id: 'moss', topic: 'Plants', text: 'Many mosses can dry out completely, then spring back to life with a little water.' },
  { id: 'cactus', topic: 'Plants', text: 'A cactus stores water in its thick stem, and its spines are actually leaves that changed shape over time.' },
  { id: 'rafflesia', topic: 'Plants', text: 'The biggest single flower in the world, Rafflesia arnoldii, can grow about a metre wide.' },
  { id: 'orchid-seeds', topic: 'Plants', text: 'Some orchid seeds are so tiny they’re as fine as dust, and they drift on the breeze.' },
  { id: 'dandelion', topic: 'Plants', text: 'Dandelion seeds fly on tiny parachutes of bristles and can travel kilometres on the wind.' },
  { id: 'autumn-leaves', topic: 'Plants', text: 'In autumn, green chlorophyll fades from leaves, revealing yellows and oranges that were hiding there all along.' },
  { id: 'pine-cones', topic: 'Plants', text: 'Pine cones close up in damp weather and open again when it’s dry, to give their seeds the best chance.' },
  { id: 'night-bloom', topic: 'Plants', text: 'The queen of the night cactus blooms for a single night, and its flower fades by morning.' },
  { id: 'daisy-name', topic: 'Plants', text: 'Daisy comes from “day’s eye”, because daisies open at dawn and close at dusk.' },
  { id: 'tulip-mania', topic: 'Plants', text: 'In the 1600s, tulip bulbs in the Netherlands became so prized that rare ones sold for extraordinary prices. People call it tulip mania.' },
  { id: 'fungal-network', topic: 'Plants', text: 'Tree roots are often linked by threads of fungi that pass water and nutrients around. Some call it the wood wide web.' },
  { id: 'red-blue-light', topic: 'Plants', text: 'Plants mostly use red and blue light to grow. They reflect green, which is why leaves look green to us.' },

  // ---- caring for plants ----
  { id: 'overwatering', topic: 'Plant care', text: 'Too much water is one of the most common ways houseplants get poorly. Roots need air as well as water.' },
  { id: 'finger-test', topic: 'Plant care', text: 'A simple watering check: push a finger into the soil. If the top few centimetres feel dry, it’s usually time for a drink.' },
  { id: 'talking-plants', topic: 'Plant care', text: 'There isn’t strong proof that talking to plants helps them grow. But people who chat to their plants often notice what they need sooner.' },
  { id: 'drainage', topic: 'Plant care', text: 'A pot with a drainage hole lets extra water escape, so roots don’t sit in a puddle.' },
  { id: 'dust', topic: 'Plant care', text: 'Wiping dust off big leaves helps them catch more light.' },
  { id: 'turning', topic: 'Plant care', text: 'Turning a houseplant a little each week helps it grow evenly instead of leaning towards the window.' },

  // ---- garden friends ----
  { id: 'butterfly-feet', topic: 'Garden friends', text: 'Butterflies taste with their feet, so they can tell if a leaf is good for their eggs just by landing on it.' },
  { id: 'bee-uv', topic: 'Garden friends', text: 'Bees can see ultraviolet light, and many flowers have hidden UV patterns that point the way to their nectar.' },
  { id: 'waggle', topic: 'Garden friends', text: 'Honey bees share where the best flowers are with a “waggle dance” that shows direction and distance.' },
  { id: 'ladybird', topic: 'Garden friends', text: 'A single ladybird can eat thousands of aphids in its lifetime, which is why gardeners are so fond of them.' },
  { id: 'firefly', topic: 'Garden friends', text: 'Fireflies glow using a chemical reaction called bioluminescence. Their light makes almost no heat.' },
  { id: 'snail-rest', topic: 'Garden friends', text: 'When it’s too dry, a snail can seal itself inside its shell and rest for months until rain returns.' },
  { id: 'earthworms', topic: 'Garden friends', text: 'Earthworms tunnel through soil, letting in air and water so roots can grow more easily.' },
  { id: 'soil-life', topic: 'Garden friends', text: 'A teaspoon of healthy soil can hold billions of tiny living things.' },

  // ---- water and sky ----
  { id: 'ice-floats', topic: 'Water and sky', text: 'Water expands by about 9 percent when it freezes, which is why ice floats.' },
  { id: 'raindrop-shape', topic: 'Water and sky', text: 'Raindrops aren’t tear shaped. Small ones are round, and bigger ones flatten out like a burger bun as they fall.' },
  { id: 'rainbow-circle', topic: 'Water and sky', text: 'Rainbows are really full circles. From the ground, the horizon hides the bottom half.' },
  { id: 'petrichor', topic: 'Water and sky', text: 'The lovely earthy smell after rain has a name: petrichor.' },
  { id: 'cloud-weight', topic: 'Water and sky', text: 'A fluffy cumulus cloud can weigh around 500 tonnes. Its water is spread out in tiny droplets, so it floats.' },
  { id: 'earth-water', topic: 'Water and sky', text: 'About 71 percent of the Earth’s surface is covered in water, but only around 3 percent of all water is fresh.' },
  { id: 'ocean-oxygen', topic: 'Water and sky', text: 'Around half of the oxygen made on Earth comes from the ocean, mostly from tiny drifting plants called phytoplankton.' },
  { id: 'oak-water', topic: 'Water and sky', text: 'A large oak tree can release around 150,000 litres of water into the air over a year.' },

  // ---- you ----
  { id: 'nature-stress', topic: 'For you', text: 'Many studies link time in green spaces with feeling less stressed. Even a few minutes outside counts.' },
  { id: 'long-exhale', topic: 'For you', text: 'Breathing out a little longer than you breathe in can help your body settle and relax.' },
  { id: 'hydration', topic: 'For you', text: 'Even mild thirst can make you feel tired or foggy. A glass of water is a small kindness to yourself.' },
  { id: 'sleep', topic: 'For you', text: 'Most adults need around 7 to 9 hours of sleep. Plants have their own day and night rhythms too.' },
  { id: 'routine', topic: 'For you', text: 'Small daily routines, like caring for a plant, can bring a calm sense of rhythm to busy days.' },
  { id: 'daylight', topic: 'For you', text: 'Morning daylight helps set your body clock, which can make it easier to sleep at night.' },
]

// Gentle thoughts from Pip, mixed in between facts.
export const THOUGHTS = [
  'Growth is quiet. You don’t always see it happening, but it is.',
  'Rest is part of growing too.',
  'Even the tallest tree started as a tiny seed.',
  'You can bloom at your own pace.',
  'A little sunlight, a little water, a little kindness. That’s a good day.',
  'It’s okay to have a slow season.',
  'Roots grow in the dark long before anything shows above the soil.',
  'Be as gentle with yourself as you are with me.',
  'Small steps, every day, add up to something big.',
  'You don’t have to bloom all the time.',
]

/** A stable shuffle for one player, so facts arrive in a different order for everyone. */
export function factOrder(seed = 1) {
  let s = Math.abs(Math.floor(seed)) % 2147483647 || 1
  const rand = () => (s = (s * 16807) % 2147483647) / 2147483647
  const ids = FACTS.map((f) => f.id)
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
  }
  return ids
}

export function findFact(id) {
  return FACTS.find((f) => f.id === id) ?? null
}

/** Which 3 hour window we're in. A new fact unlocks each window. */
export function factSlot(now = Date.now()) {
  // count in the person's own time, so the new fact arrives at 6am and 6pm where they are
  const local = now - new Date(now).getTimezoneOffset() * 60 * 1000
  return Math.floor((local - FACT_START_HOUR * 3600 * 1000) / (FACT_EVERY_HOURS * 3600 * 1000))
}
