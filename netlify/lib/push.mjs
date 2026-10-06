// Shared helpers for Pip's reminder functions on Netlify.
import { createHash } from 'node:crypto'
import { getStore } from '@netlify/blobs'
import webpush from 'web-push'

export const QUIET_FROM = 22 // no reminders between 10pm…
export const QUIET_UNTIL = 8 // …and 8am, in the person's own timezone

export function store() {
  return getStore({ name: 'pip-reminders', consistency: 'strong' })
}

/** A short, stable key for a push subscription. */
export function keyFor(endpoint) {
  return createHash('sha256').update(endpoint).digest('base64url')
}

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

export function configured() {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
}

let ready = false
function setup() {
  if (ready) return
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:hello@example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  )
  ready = true
}

/** Send one notification. Returns 'sent', 'gone' (subscription expired) or 'failed'. */
export async function send(subscription, payload) {
  setup()
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload), { TTL: 6 * 3600, urgency: 'normal' })
    return 'sent'
  } catch (err) {
    if (err?.statusCode === 404 || err?.statusCode === 410) return 'gone'
    console.error('push failed', err?.statusCode, err?.body)
    return 'failed'
  }
}

/** The date (YYYY-MM-DD), hour and minutes past midnight right now in a timezone. */
export function localNow(timeZone, now = new Date()) {
  let parts
  try {
    parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now)
  } catch {
    return localNow('UTC', now)
  }
  const get = (type) => parts.find((p) => p.type === type)?.value
  const hour = Number(get('hour'))
  return { date: `${get('year')}-${get('month')}-${get('day')}`, hour, minutes: hour * 60 + Number(get('minute')) }
}

export function isQuiet(hour) {
  return hour >= QUIET_FROM || hour < QUIET_UNTIL
}

/**
 * Decide what (if anything) to send one phone right now.
 * Returns { kind: 'thirsty' | 'daily' | null, changes } where `changes` should be saved.
 */
export function planReminder(rec, now = new Date()) {
  const { date, hour, minutes } = localNow(rec.timeZone, now)
  if (isQuiet(hour)) return { kind: null, changes: null }

  const [h, m] = (rec.time || '19:00').split(':').map(Number)
  const thirstyDue = Boolean(rec.thirstyAt) && now.getTime() >= rec.thirstyAt && rec.thirstySentFor !== rec.thirstyAt
  const dailyDue = rec.lastDailyDate !== date && minutes >= h * 60 + m

  if (thirstyDue) {
    // one gentle reminder is plenty for today
    return { kind: 'thirsty', changes: { thirstySentFor: rec.thirstyAt, ...(dailyDue ? { lastDailyDate: date } : {}) } }
  }
  if (dailyDue) {
    // no hello needed if they've already been to see Pip today
    return { kind: rec.lastVisit === date ? null : 'daily', changes: { lastDailyDate: date } }
  }
  return { kind: null, changes: null }
}
