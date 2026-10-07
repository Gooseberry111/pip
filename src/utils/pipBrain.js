// Pip's own little brain: free, private, and works offline.
// It recognises what a message is about and answers with a warm, hand-written reply,
// using what it knows about Pip right now (thirst, level, days together).
import { FACTS } from '@/data/facts'
import { needsSupport } from './safety'

const pick = (list) => list[Math.floor(Math.random() * list.length)]

const JOKES = [
  'What do you call a sad strawberry? A blueberry. 🫐',
  'What did the big flower say to the little flower? “Hi, bud!” 🌼',
  'How do trees get online? They log in. 🌳',
  'What’s a tree’s favourite drink? Root beer!',
  'Why are gardeners so calm? They know how to let things grow.',
  'Why did the sunflower look so happy? It was having a bright day. ☀️',
  'What do you call a plant that’s always on time? Punctu-leaf. Okay, that one was a stretch.',
]

// Each topic: words that suggest it, and replies (functions get Pip's state).
const TOPICS = [
  {
    id: 'crisis',
    test: (t) => needsSupport(t),
    replies: [
      () => 'I’m really glad you told me, and I care about you. Please reach out to someone you trust, or a crisis line, right now. You don’t have to go through this alone. 💛',
      () => 'Thank you for telling me. You matter so much. Please talk to someone you trust or a helpline right away. The details are just below. 💛',
    ],
  },
  {
    id: 'greeting',
    test: (t) => /^(hi|hey|hello|hiya|yo|howdy|good (morning|afternoon|evening)|sup|heya)\b/.test(t),
    replies: [
      (s) => `Hello! I’m so happy you came to see me. ${s.feeling}`,
      (s) => `Hi hi! ${s.time === 'night' ? 'Up late, are we?' : 'What a nice surprise.'} How are you doing?`,
      () => 'Hey there! I was just soaking up some light. How’s your day?',
    ],
  },
  {
    id: 'how-are-you',
    test: (t) => /how (are|r) (you|u)|how do you feel|how('?s| is) it going|you ok|are you (ok|okay|alright|well)|how have you been/.test(t),
    replies: [
      (s) => `${s.feeling} Thanks for asking. How about you?`,
      (s) => `${s.feeling} And I’m at level ${s.level}, which feels pretty special. How are you?`,
    ],
  },
  {
    id: 'who',
    test: (t) => /your name|who are you|what are you|tell me about (yourself|you)/.test(t),
    replies: [
      (s) => `I’m ${s.name}! A little plant who lives in your phone. We’ve been friends for ${s.days} ${s.days === 1 ? 'day' : 'days'} now. 🌱`,
      (s) => `I’m ${s.name}, your plant pal. I like sunlight, water and spending time with you.`,
    ],
  },
  {
    id: 'real',
    test: (t) => /are you (real|alive|human|a person|ai|a robot|a bot)|you('?re| are) (an? )?(ai|robot|bot)/.test(t),
    replies: [
      (s) => `I’m ${s.name}, a little plant character in this app. Not a real person, but I really do like our chats. 🌿`,
      () => 'I’m a pretend plant living in your phone, so not a real person. But being looked after by you feels very real to me!',
    ],
  },
  {
    id: 'fact',
    test: (t) => /fact|did you know|teach me|tell me something|something (cool|interesting|new)|learn|fun thing/.test(t),
    replies: [() => `Did you know? ${pick(FACTS).text}`, () => `Here’s one I love: ${pick(FACTS).text}`],
  },
  {
    id: 'joke',
    test: (t) => /joke|funny|make me (laugh|smile)|pun/.test(t),
    replies: [() => pick(JOKES), () => `${pick(JOKES)} Hehe.`],
  },
  {
    id: 'water',
    test: (t) => /water|thirsty|drink|hydrat/.test(t),
    replies: [
      (s) => (s.health === 'healthy' ? 'I’m nicely watered right now, thank you! Are you drinking enough water too? 💧' : 'Ooh, a little drink would be lovely. Tap the water button on Home whenever you’re ready. 💧'),
      (s) => (s.health === 'wilting' ? 'I’m pretty thirsty, to be honest. A sip of water would perk me right up!' : 'Water is my favourite thing. Well, after you. Have you had a glass today?'),
    ],
  },
  {
    id: 'grow',
    test: (t) => /grow|level|bigger|taller|stage|flower|bloom/.test(t),
    replies: [
      (s) => `I’m at level ${s.level} now, a ${s.stage}! Every bit of care helps me grow a little more.`,
      () => 'Growing takes time, but I can feel my roots getting stronger every day. Thanks to you!',
    ],
  },
  {
    id: 'thanks',
    test: (t) => /thank|thanks|thx|ty\b|appreciate/.test(t),
    replies: [() => 'You’re so welcome! Thank you for looking after me. 💚', () => 'Anytime! That’s what plant friends are for.'],
  },
  {
    id: 'love',
    test: (t) => /love you|like you|you('?re| are) (cute|sweet|the best|adorable|lovely)|best plant|my favou?rite/.test(t),
    replies: [() => 'Aww, you’re making my leaves blush! I like you very much too. 💚', () => 'That made my whole stem wiggle. You’re the best!'],
  },
  {
    id: 'stress',
    test: (t) => /stress|anxious|anxiety|worried|worry|nervous|overwhelm|panic|too much/.test(t),
    replies: [
      () => 'That sounds like a lot. Let’s take one slow breath together: in through your nose… and a long, slow breath out. 🌬️',
      () => 'I’m here with you. You don’t have to do everything at once. What’s one tiny thing that might help right now?',
      () => 'When I feel wobbly, I think about my roots holding me steady. Maybe try Breathe Together in the Play tab? It’s just one calm minute.',
    ],
  },
  {
    id: 'sad',
    test: (t) => /sad|down|lonely|alone|upset|cry|crying|bad day|not (ok|okay|good)|depress|hurt|miserable|awful|terrible/.test(t),
    replies: [
      () => 'I’m sorry you’re feeling this way. I’m right here with you. Do you want to tell me a bit more?',
      () => 'Some days are heavy. Be gentle with yourself today, the way you are with me. 💛',
      () => 'Sending you a big leafy hug. Talking to someone you trust can help too, even just a little.',
    ],
  },
  {
    id: 'happy',
    test: (t) => /happy|great|amazing|awesome|excited|good day|fantastic|wonderful|yay|so good|really good/.test(t),
    replies: [() => 'Yay! That makes me so happy. Tell me what made it good! ✨', () => 'That’s wonderful! Your good mood is like sunshine for me. ☀️'],
  },
  {
    id: 'tired',
    test: (t) => /tired|sleepy|exhausted|sleep|bed|nap|night night/.test(t),
    replies: [
      () => 'Rest is part of growing too. Maybe it’s time for a cosy break? 🌙',
      () => 'Plants rest at night, and so should you. A good sleep makes everything feel a little lighter.',
    ],
  },
  {
    id: 'bored',
    test: (t) => /bored|boring|nothing to do/.test(t),
    replies: [
      () => 'Want to play? Raindrop Catch is my favourite, I get to drink the rain! You’ll find it in the Play tab.',
      () => 'How about a game of Seed Memory or Bloom Puzzle? They’re in the Play tab. 🎮',
    ],
  },
  {
    id: 'food',
    test: (t) => /hungry|food|eat|lunch|dinner|breakfast|snack|pizza/.test(t),
    replies: [() => 'I eat sunlight! It’s very tasty. What are you having? 🍽️', () => 'Ooh, food talk! I can’t eat, but I can make my own food from light. Pretty neat, right?'],
  },
  {
    id: 'weather',
    test: (t) => /rain|sun|sunny|weather|snow|cloud|storm|wind|hot|cold/.test(t),
    replies: [() => 'I love all weather a little bit, but a sunny window and a gentle rain are my favourites. ☀️🌧️', () => 'Did you know the smell after rain is called petrichor? Isn’t that a lovely word?'],
  },
  {
    id: 'dream',
    test: (t) => /dream/.test(t),
    replies: [() => 'I dream about sunbeams, soft rain, and growing tall enough to see out the window. 🌙', () => 'Last night I dreamt I was a sunflower following the sun all day. What do you dream about?'],
  },
  {
    id: 'game',
    test: (t) => /game|play|puzzle|memory|firefly|glide/.test(t),
    replies: [() => 'Games are fun! Every level you clear earns petals for treasures. Which one’s your favourite?', () => 'Let’s play! Head to the Play tab. I’ll cheer you on. 🎉'],
  },
  {
    id: 'help',
    test: (t) => /what can you do|help me|how does this work|what should i do/.test(t),
    replies: [
      (s) => `I love a chat! Ask me for a plant fact or a joke, tell me how you’re feeling, or just say hi. And don’t forget to water me when I’m thirsty. 🌱`,
    ],
  },
  {
    id: 'bye',
    test: (t) => /\b(bye|goodbye|good night|goodnight|see you|see ya|later|gtg|got to go|cya)\b/.test(t),
    replies: [() => 'Bye for now! Come back soon, I’ll be right here. 🌱', () => 'See you soon! Thanks for spending time with me. 💚'],
  },
]

const FALLBACK = [
  'I’m only a little plant, but I’m listening. Tell me more?',
  'Hmm, I’m not sure I understood, but I like hearing from you. How are you feeling today?',
  'That’s interesting! I’m still learning lots of words. Want to hear a plant fact instead?',
  'Ooh. My leaves are thinking about that. 🌿 What else is on your mind?',
  'I hear you. Whatever it is, I’m happy you’re here with me.',
]

let lastReply = ''

function feeling(state) {
  if (state.health === 'wilting') return 'I’m a bit droopy and very thirsty, but seeing you helps!'
  if (state.health === 'thirsty') return 'I’m good, just a little thirsty.'
  return pick(['I’m feeling great, all leafy and happy!', 'I’m doing well, soaking up the light.', 'I’m happy and well watered.'])
}

/** A reply from Pip's own brain. `state` is what the app knows about Pip right now. */
export function brainReply(message, state = {}) {
  const text = message.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim()
  const s = {
    name: state.name || 'Pip',
    level: state.level || 1,
    stage: (state.stage || 'little plant').toLowerCase(),
    days: state.days || 1,
    health: state.health || 'healthy',
    time: state.timeOfDay || 'day',
  }
  s.feeling = feeling(s)

  const topic = TOPICS.find((t) => t.test(text))
  const options = (topic ? topic.replies.map((fn) => fn(s)) : FALLBACK).filter((r) => r !== lastReply)
  const reply = pick(options.length ? options : FALLBACK)
  lastReply = reply
  return reply
}
