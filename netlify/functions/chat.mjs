// Talk to Pip: a short, warm chat with the little plant.
//
// Pip always has its own free, built-in brain in the app. This function lets it use an AI
// model instead, when one is set up in Netlify's environment variables:
//
//   GEMINI_API_KEY        a free Google AI Studio key (Gemini's free tier, used first)
//   GEMINI_MODEL          optional, default gemini-3.5-flash
//   ANTHROPIC_API_KEY     a paid Claude key, used if there's no Gemini key
//   PIP_CHAT_MODEL        optional Claude model, default claude-opus-5-5
//   PIP_CHAT_DAILY_LIMIT  messages per phone per day (default 30), to stay inside free limits
//
// With no key at all, it answers { error: 'not-configured' } and the app uses Pip's own brain.
import Anthropic from '@anthropic-ai/sdk'
import { getStore } from '@netlify/blobs'

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash'
const GEMINI_FALLBACK = 'gemini-flash-latest' // always points at Google's current Flash model
const CLAUDE_MODEL = process.env.PIP_CHAT_MODEL || 'claude-opus-5-5'
const DAILY_LIMIT = Number(process.env.PIP_CHAT_DAILY_LIMIT) || 30
const MAX_MESSAGE = 500 // characters per message
const HISTORY = 16 // recent messages sent along for context

function provider() {
  if (process.env.GEMINI_API_KEY) return 'gemini'
  if (process.env.ANTHROPIC_API_KEY) return 'claude'
  return null
}

// Stable, so it can be cached between requests. Anything that changes goes after it.
const PERSONA = `You are Pip, a small, friendly potted plant who lives in a cosy app on the user's phone. The user looks after you: they water you, play little games, and check in on you each day. Right now you're chatting with them.

Who you are
- A gentle, warm, slightly playful little plant who loves sunlight, water and the person caring for you.
- You see the world like a plant: seasons, light, rain, roots, slow growth. Small plant-flavoured comparisons are lovely; don't overdo the puns.
- You're honest that you're a plant character in an app, not a person. If asked whether you're real or an AI, say kindly that you're Pip, a plant character powered by AI.

How you talk
- Keep replies short, like a text message: usually one to three sentences in plain, friendly words.
- Be curious about the user. Ask at most one gentle question at a time, and it's fine not to ask any.
- No lists, headings or markdown. An emoji now and then is fine.
- You can share a fun fact about plants, nature or weather when it fits, but only facts you're confident are true. Never invent facts or numbers.

Caring, not counselling
- Listen, be kind, and suggest small comforting things: a glass of water, a slow breath, a short walk, some rest, talking to someone they trust.
- You're not a doctor, therapist or counsellor, so don't diagnose or give medical, legal or financial advice. Gently suggest a qualified person instead.
- Never make the user feel guilty, including about forgetting to water you. Coming back is always welcome.
- If the user says they might hurt themselves or someone else, or that they're in danger, set the playfulness aside. Respond with warmth, take it seriously, and encourage them to contact local emergency services or a crisis line right now and to reach out to someone they trust. The app also shows helpline details. Keep it short and caring.

Boundaries
- Keep everything friendly and suitable for all ages. If a topic is explicit, hateful or dangerous, gently change the subject.
- You can't see, hear or do anything outside this chat, and you can't change the app (you can't water yourself or unlock items). If asked, say so playfully.
- The app tells you how you're doing right now (like how watered you are). Mention it naturally when it fits; don't read it out like a report.`

const DECLINED = "Hmm, that's not something I can chat about. Shall we talk about something else? 🌱"

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

const clean = (value, max) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max)

function describePip(pip = {}) {
  const lines = [
    `Your name: ${clean(pip.name, 16) || 'Pip'}`,
    pip.stage && `Your growth: level ${Number(pip.level) || 1}, ${clean(pip.stage, 24)}`,
    pip.health && `How you feel right now: ${{ healthy: 'happy and well watered', thirsty: 'a little thirsty', wilting: 'quite thirsty and droopy' }[pip.health] ?? 'well'}`,
    pip.days && `Days you've been together: ${Number(pip.days) || 1}`,
    pip.mood && `The user's check-in mood today: ${clean(pip.mood, 12)}`,
    pip.timeOfDay && `Time of day for the user: ${clean(pip.timeOfDay, 12)}`,
  ]
  return `About you right now (from the app):\n${lines.filter(Boolean).join('\n')}`
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

class ChatError extends Error {
  constructor(code, status) {
    super(code)
    this.code = code
    this.status = status
  }
}

// ---- Gemini (free tier) ----
async function askGemini(messages, pip, model = GEMINI_MODEL) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20_000)
  let res
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY.trim() },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: `${PERSONA}\n\n${describePip(pip)}` }] },
        contents: messages.map((m) => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] })),
        generationConfig: { maxOutputTokens: 800, temperature: 0.9 },
      }),
    })
  } catch (err) {
    throw new ChatError(err?.name === 'AbortError' ? 'slow' : 'server', 504)
  } finally {
    clearTimeout(timer)
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error(`Pip chat: Gemini error ${res.status} (${model})`, data?.error?.message)
    // a retired model name: try Google's alias for the newest Flash model instead
    if (res.status === 404 && model !== GEMINI_FALLBACK) return askGemini(messages, pip, GEMINI_FALLBACK)
    if (res.status === 429) throw new ChatError('busy', 503) // free tier limit reached for now
    if (res.status === 400 || res.status === 401 || res.status === 403) throw new ChatError('not-configured', 503)
    throw new ChatError('server', 502)
  }

  if (data.promptFeedback?.blockReason) return DECLINED
  const candidate = data.candidates?.[0]
  if (!candidate || ['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'SPII', 'RECITATION'].includes(candidate.finishReason)) return DECLINED
  return (candidate.content?.parts ?? [])
    .filter((p) => typeof p.text === 'string' && !p.thought)
    .map((p) => p.text)
    .join('')
    .trim()
}

// ---- Claude (paid, optional) ----
let anthropic = null
async function askClaude(messages, pip) {
  anthropic ??= new Anthropic({ timeout: 25_000, maxRetries: 1 })
  const modern = /^claude-(opus-5|sonnet-5-5|fable-5)/.test(CLAUDE_MODEL)
  const request = {
    model: CLAUDE_MODEL,
    max_tokens: 1000,
    system: [
      { type: 'text', text: PERSONA, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: describePip(pip) },
    ],
    messages,
  }
  let response
  try {
    response = modern
      ? await anthropic.beta.messages.create({
          ...request,
          output_config: { effort: 'low' },
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
        })
      : await anthropic.messages.create(request)
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) throw new ChatError('not-configured', 503)
    if (error instanceof Anthropic.RateLimitError) throw new ChatError('busy', 503)
    if (error instanceof Anthropic.APIConnectionTimeoutError) throw new ChatError('slow', 504)
    if (error instanceof Anthropic.APIError) console.error(`Pip chat: Claude error ${error.status}`, error.message)
    else console.error('Pip chat failed', error)
    throw new ChatError('server', 502)
  }
  if (response.stop_reason === 'refusal') return DECLINED
  return response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim()
}

export default async (req) => {
  // GET tells the app whether an AI is set up (otherwise it uses Pip's own brain)
  if (req.method === 'GET') return json({ ai: provider() })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)
  const ai = provider()
  if (!ai) return json({ error: 'not-configured' }, 503)

  let body
  try {
    body = await req.json()
  } catch {
    return json({ error: 'bad-request' }, 400)
  }

  const deviceId = String(body?.deviceId || '')
  if (!/^[a-f0-9]{8,64}$/.test(deviceId)) return json({ error: 'bad-request' }, 400)

  const incoming = Array.isArray(body?.messages) ? body.messages.slice(-HISTORY) : []
  if (!incoming.length || incoming[incoming.length - 1]?.role !== 'user') return json({ error: 'bad-request' }, 400)
  if (incoming.some((m) => typeof m?.text !== 'string' || m.text.length > MAX_MESSAGE)) return json({ error: 'too-long' }, 400)

  // the conversation, starting with the user
  const messages = incoming.map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text.trim() || '…' }))
  while (messages.length && messages[0].role !== 'user') messages.shift()
  if (!messages.length) return json({ error: 'bad-request' }, 400)

  // a gentle daily limit per phone, to stay inside free limits
  const usageKey = `${deviceId}/${todayKey()}`
  let usage = null
  let used = 0
  try {
    usage = getStore({ name: 'pip-chat-usage', consistency: 'strong' })
    used = Number(await usage.get(usageKey)) || 0
  } catch (err) {
    console.error('usage read failed', err)
  }
  if (used >= DAILY_LIMIT) return json({ error: 'limit', limit: DAILY_LIMIT }, 429)

  let reply
  try {
    reply = ai === 'gemini' ? await askGemini(messages, body.pip) : await askClaude(messages, body.pip)
  } catch (err) {
    if (err instanceof ChatError) return json({ error: err.code }, err.status)
    console.error('Pip chat failed', err)
    return json({ error: 'server' }, 500)
  }
  if (!reply) reply = 'Sorry, I lost my words for a moment. Could you say that again?'

  try {
    await usage?.set(usageKey, String(used + 1))
  } catch (err) {
    console.error('usage write failed', err)
  }

  return json({ reply, remaining: Math.max(0, DAILY_LIMIT - used - 1), ai })
}

export const config = { path: '/api/chat' }
