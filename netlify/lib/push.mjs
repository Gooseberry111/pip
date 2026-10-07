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

// Environment values are often pasted with stray spaces or quotes, so tidy them first.
function clean(value) {
  return (value || '').trim().replace(/^['"]|['"]$/g, '').trim()
}

export function vapid() {
  let subject = clean(process.env.VAPID_SUBJECT) || 'mailto:hello@example.com'
  if (!/^(mailto:|https:\/\/)/.test(subject)) subject = `mailto:${subject}`
  return {
    publicKey: clean(process.env.VAPID_PUBLIC_KEY),
    privateKey: clean(process.env.VAPID_PRIVATE_KEY),
    subject,
  }
}

function byteLength(base64url) {
  try {
    return Buffer.from(base64url, 'base64url').length
  } catch {
    return 0
  }
}

/** What's wrong with the reminder setup, in plain words, or null if it all looks right. */
export function setupProblem() {
  const { publicKey, privateKey } = vapid()
  if (!publicKey && !privateKey) return 'VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are not set in Netlify'
  if (!publicKey) return 'VAPID_PUBLIC_KEY is not set in Netlify'
  if (!privateKey) return 'VAPID_PRIVATE_KEY is not set in Netlify'
  if (byteLength(publicKey) !== 65) return 'VAPID_PUBLIC_KEY does not look right (copy the Public Key line exactly)'
  if (byteLength(privateKey) !== 32) return 'VAPID_PRIVATE_KEY does not look right (copy the Private Key line exactly)'
  return null
}

export function configured() {
  return setupProblem() === null
}

let ready = false
function setup() {
  if (ready) return
  const { subject, publicKey, privateKey } = vapid()
  webpush.setVapidDetails(subject, publicKey, privateKey)
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
 * Returns { kind: 'thirsty' | 'harvest' | 'daily' | null, changes } where `changes` should be saved.
 */
export function planReminder(rec, now = new Date()) {
  const { date, hour, minutes } = localNow(rec.timeZone, now)
  if (isQuiet(hour)) return { kind: null, changes: null }

  const [h, m] = (rec.time || '19:00').split(':').map(Number)
  const thirstyDue = Boolean(rec.thirstyAt) && now.getTime() >= rec.thirstyAt && rec.thirstySentFor !== rec.thirstyAt
  const dailyDue = rec.lastDailyDate !== date && minutes >= h * 60 + m

  const harvestDue = Boolean(rec.farmReadyAt) && now.getTime() >= rec.farmReadyAt && rec.harvestSentFor !== rec.farmReadyAt
  if (thirstyDue) {
    // one gentle reminder is plenty for today
    return { kind: 'thirsty', changes: { thirstySentFor: rec.thirstyAt, ...(dailyDue ? { lastDailyDate: date } : {}) } }
  }
  if (harvestDue) {
    return { kind: 'harvest', changes: { harvestSentFor: rec.farmReadyAt, ...(dailyDue ? { lastDailyDate: date } : {}) } }
  }
  if (dailyDue) {
    // no hello needed if they've already been to see Pip today
    return { kind: rec.lastVisit === date ? null : 'daily', changes: { lastDailyDate: date } }
  }
  return { kind: null, changes: null }
}
