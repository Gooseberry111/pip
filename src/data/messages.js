// Everything Pip says. Keep it short, warm and never guilt-based.

export const STATUS_HEADLINES = {
  healthy: 'Pip is feeling good',
  thirsty: 'Pip could use a little water',
  wilting: 'Pip has been waiting for you',
}

export const STATUS_MESSAGES = {
  healthy: ['I’m feeling good.', 'It’s nice to see you.', 'Just soaking up the light.', 'I’m happy you’re here.'],
  thirsty: ['I could use a little water.', 'A little sip would be lovely.', 'Just a tiny bit thirsty.'],
  wilting: ['I’ve missed you.', 'It’s okay. We can start again.', 'A little water would help a lot.'],
}

export const WATERED_MESSAGES = [
  'That feels better.',
  'Pip feels refreshed.',
  'Thanks for taking care of me.',
  'Ahh, lovely.',
  'Mmm, just right.',
]

export const RECOVERING_MESSAGES = [
  'That helps. I’m feeling a little better.',
  'Thank you. One sip at a time.',
]

export const FULL_MESSAGES = [
  'I’m nice and full right now.',
  'All full, thank you!',
  'I’m happy just sitting with you.',
]

export const GROWTH_MESSAGES = ['Look at me growing!', 'Look at Pip growing.', 'Growth takes time, and here it is.']

export const WELCOME_BACK = {
  healthy: 'Welcome back.',
  thirsty: 'Pip has been waiting for you.',
  wilting: 'It’s okay. We can start again.',
}

export const AWAY_GROWTH_MESSAGE = 'Pip grew a little while you were away.'

export const GENTLE_MESSAGES = [
  'Take a little breath while you’re here.',
  'Small acts of care still count.',
  'One little thing at a time.',
  'You don’t have to do everything today.',
  'Coming back is always okay.',
  'Growth takes time.',
  'Maybe have a sip of water too?',
]

export const TAP_MESSAGES = ['Hehe.', 'Hi there!', 'That tickles.', '♪', 'Oh, hello.', 'Boop!']

export const PET_MESSAGES = ['Mmm, that’s nice.', 'I like that.', 'Ehehe.', 'So cosy.']

export const WAKE_MESSAGES = ['Oh! Hello again.', '*yawn* Hi.', 'I was having a lovely dream.']

export const SLEEP_MESSAGE = 'Zzz…'

export const NIGHT_MESSAGES = ['It’s getting late. Rest well.', 'The stars are out.', 'Sleepy time soon.']
export const MORNING_MESSAGES = ['Good morning, sunshine.', 'A brand new day.', 'I’m stretching toward the light.']

export const UNLOCK_HEADLINES = ['Something new for you!', 'Look what grew!', 'A little gift.']

// For gentle reminders (never guilt-based). {name} is replaced with the plant's name.
export const REMINDER_MESSAGES = [
  '{name} could use a little water.',
  'Just checking in. {name} misses you.',
  'Want to spend a little time with {name}?',
  '{name} saved a little gift for you.',
  'A quiet minute with {name}? No rush.',
]

export const THIRSTY_REMINDERS = ['{name} is getting a little thirsty.', 'A sip of water would make {name} smile.']
export const HARVEST_REMINDERS = ['Something on the farm is ready to pick 🧺', 'Your crops are ready. {name} can smell them from here!', 'The farm has a little harvest waiting for you.']

// Lines that show Pip's personality (see utils/badges.js)
export const TRAIT_MESSAGES = {
  playful: ['Race you to the next game!', 'I bet I can beat you at Tac Toe.', 'Is it game time? Please say it’s game time.'],
  cuddly: ['Can we just stay like this a while?', 'You’re my favourite person.', 'A pat and a drink, and I’m all set.'],
  hardworking: ['I wonder how the carrots are doing.', 'The farm smells lovely today.', 'Shall we bake something later?'],
  curious: ['Did you know I’m always learning?', 'Tell me something new today.', 'What’s your favourite fact?'],
  calm: ['Let’s take a slow breath together.', 'It’s nice, just being here.', 'No rush. We have all day.'],
  social: ['Have you visited a friend’s farm today?', 'I wonder what the neighbours are growing.', 'Sharing makes everything grow.'],
}

export function pick(list) {
  return list[Math.floor(Math.random() * list.length)]
}
