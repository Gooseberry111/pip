// The daily check-in. Pip listens and answers kindly. Never clinical, never pushy.

export const MOODS = [
  {
    id: 'great',
    label: 'Great',
    color: '#F2C66B',
    replies: ['That makes me so happy! Let’s have a lovely day.', 'Yay! Your good mood is helping me grow.'],
  },
  {
    id: 'good',
    label: 'Good',
    color: '#A9C79A',
    replies: ['Lovely. I’m glad you’re here.', 'Good days are worth noticing. Thanks for telling me.'],
  },
  {
    id: 'okay',
    label: 'Okay',
    color: '#D8C9B5',
    replies: ['Okay is perfectly okay. One little thing at a time.', 'Some days are just okay. That’s alright.'],
  },
  {
    id: 'low',
    label: 'Low',
    color: '#9CC4D3',
    replies: ['I’m sorry it’s a low day. I’m right here with you.', 'Thank you for telling me. Be gentle with yourself today.'],
    suggest: true,
  },
  {
    id: 'tough',
    label: 'Tough',
    color: '#C3B4DA',
    replies: ['That sounds hard. You don’t have to do everything today.', 'I’m glad you came to see me. Small steps still count.'],
    suggest: true,
  },
]

export function findMood(id) {
  return MOODS.find((m) => m.id === id) ?? null
}
