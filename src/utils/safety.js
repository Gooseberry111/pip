// A simple, local check for messages that suggest someone may be in danger, so the app
// can always show real help, whatever the chat replies. It errs on the side of showing it.

const PATTERNS = [
  /\b(kill|hurt|harm|cut)\s+(myself|me)\b/i,
  /\bself[\s-]?harm/i,
  /\bsuicid/i,
  /\b(end|take)\s+(my|my own)\s+life\b/i,
  /\bwant(?:s|ed)?\s+to\s+die\b/i,
  /\bdon'?t\s+want\s+to\s+(live|be\s+alive|be\s+here)\b/i,
  /\bno\s+reason\s+to\s+live\b/i,
  /\bbetter\s+off\s+(dead|without\s+me)\b/i,
  /\boverdose\b/i,
]

export function needsSupport(text = '') {
  return PATTERNS.some((p) => p.test(text))
}

export const SUPPORT_LINES = [
  { label: 'If you’re in danger right now', detail: 'Call your local emergency number.' },
  { label: 'US', detail: 'Call or text 988 (Suicide and Crisis Lifeline)' },
  { label: 'UK and Ireland', detail: 'Call Samaritans on 116 123' },
  { label: 'Anywhere', detail: 'Find a free, confidential helpline at findahelpline.com', href: 'https://findahelpline.com' },
]
