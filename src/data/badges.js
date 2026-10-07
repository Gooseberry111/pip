// Badges: little milestones, each with petals (and sometimes something for Pip to wear).
// `value(ctx)` reads the progress from a summary of Pip and the farm (see utils/badges.js).

export const BADGES = [
  // ---- caring for Pip ----
  { id: 'sprout', icon: '🌱', name: 'Little sprout', text: 'Pip grew its very first leaves.', target: 2, value: (c) => c.level, petals: 10 },
  { id: 'bloom', icon: '🌸', name: 'In full bloom', text: 'Pip reached the top level.', target: 12, value: (c) => c.level, petals: 50 },
  { id: 'water-30', icon: '💧', name: 'Good gardener', text: 'Watered Pip 30 times.', target: 30, value: (c) => c.stats.water, petals: 15 },
  { id: 'perfect-1', icon: '☀️', name: 'Perfect day', text: 'Gave Pip all three drinks in one day.', target: 1, value: (c) => c.stats.perfectDay, petals: 10 },
  { id: 'perfect-7', icon: '👑', name: 'Seven perfect days', text: 'Seven days with all three drinks.', target: 7, value: (c) => c.stats.perfectDay, petals: 30, reward: { category: 'accessories', id: 'flowercrown' } },
  { id: 'days-7', icon: '📅', name: 'One week together', text: 'Seven days since planting.', target: 7, value: (c) => c.days, petals: 15 },
  { id: 'days-30', icon: '🗓️', name: 'A month together', text: 'Thirty days since planting.', target: 30, value: (c) => c.days, petals: 40 },
  { id: 'treats-20', icon: '🍰', name: 'Spoiled rotten', text: 'Gave Pip 20 treats.', target: 20, value: (c) => c.stats.treat, petals: 20 },
  { id: 'wish-10', icon: '🌠', name: 'Wish maker', text: 'Made 10 of Pip’s wishes come true.', target: 10, value: (c) => c.stats.wish, petals: 25 },
  { id: 'checkin-14', icon: '💛', name: 'Open heart', text: 'Checked in on 14 days.', target: 14, value: (c) => c.stats.checkin, petals: 20 },
  { id: 'breathe-10', icon: '🍃', name: 'Calm breather', text: 'Breathed together 10 times.', target: 10, value: (c) => c.stats.breathe, petals: 20 },
  { id: 'facts-30', icon: '💡', name: 'Curious mind', text: 'Read 30 “Did you know?” facts.', target: 30, value: (c) => c.facts, petals: 20 },

  // ---- the farm ----
  { id: 'harvest-1', icon: '🧺', name: 'First harvest', text: 'Picked something from the farm.', target: 1, value: (c) => c.stats.harvest, petals: 5 },
  { id: 'harvest-100', icon: '🌾', name: 'Harvest moon', text: 'Harvested 100 times.', target: 100, value: (c) => c.stats.harvest, petals: 40 },
  { id: 'cook-10', icon: '🍳', name: 'Little chef', text: 'Cooked 10 dishes.', target: 10, value: (c) => c.stats.cook, petals: 20, reward: { category: 'accessories', id: 'beret' } },
  { id: 'recipes-all', icon: '📖', name: 'Master chef', text: 'Cooked every recipe at least once.', target: 20, value: (c) => c.recipes, petals: 80 },
  { id: 'orders-25', icon: '🐰', name: 'Good neighbour', text: 'Filled 25 critter orders.', target: 25, value: (c) => c.stats.order, petals: 30 },
  { id: 'farm-5', icon: '🏡', name: 'Growing farm', text: 'Reached farm level 5.', target: 5, value: (c) => c.farmLevel, petals: 25 },
  { id: 'farm-10', icon: '⭐', name: 'Farm star', text: 'Reached farm level 10.', target: 10, value: (c) => c.farmLevel, petals: 60 },
  { id: 'almanac', icon: '📗', name: 'Almanac complete', text: 'Grew or gathered every kind of produce.', target: 21, value: (c) => c.almanac, petals: 80 },

  // ---- friends and games ----
  { id: 'visit-5', icon: '👋', name: 'Friendly visitor', text: 'Watered crops on friends’ farms 5 times.', target: 5, value: (c) => c.stats.visit, petals: 15 },
  { id: 'gift-5', icon: '🎁', name: 'Generous heart', text: 'Sent 5 gifts to friends.', target: 5, value: (c) => c.stats.giftSent, petals: 20, reward: { category: 'accessories', id: 'heartglasses' } },
  { id: 'stars-50', icon: '🏅', name: 'Star player', text: 'Earned 50 stars in games.', target: 50, value: (c) => c.stars, petals: 30 },
  { id: 'stars-150', icon: '🏆', name: 'Game legend', text: 'Earned 150 stars in games.', target: 150, value: (c) => c.stars, petals: 80 },
]
