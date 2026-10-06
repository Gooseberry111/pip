// Web push for the installed web app (Home Screen on iPhone, Chrome on Android).
// A website can't schedule notifications on the phone by itself, so Pip shares its
// reminder settings with a small Netlify function, which sends them at the right time.

const API = '/api/push'

export function webPushAvailable() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function isInstalled() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
}

/** Register the service worker as the app starts. */
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  navigator.serviceWorker.register('./sw.js').catch(() => {})
}

function base64ToBytes(base64) {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(padded)
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

async function currentSubscription() {
  if (!webPushAvailable()) return null
  const reg = await navigator.serviceWorker.ready
  return reg.pushManager.getSubscription()
}

function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function payload(subscription, schedule) {
  return {
    subscription: subscription.toJSON(),
    name: schedule.name,
    time: schedule.time,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    thirstyAt: schedule.hoursUntilThirsty > 0.5 ? Date.now() + schedule.hoursUntilThirsty * 3600 * 1000 : null,
    lastVisit: localDate(),
  }
}

/**
 * Turn web reminders on: ask permission, subscribe, and tell the server.
 * Returns { ok: true } or { ok: false, reason } with a friendly reason.
 */
export async function enableWebPush(schedule) {
  if (!webPushAvailable()) {
    if (isIOS() && !isInstalled()) return { ok: false, reason: 'install' }
    return { ok: false, reason: 'unsupported' }
  }
  if (isIOS() && !isInstalled()) return { ok: false, reason: 'install' }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return { ok: false, reason: 'denied' }

  try {
    const keyRes = await fetch(`${API}/key`)
    const { publicKey } = keyRes.ok ? await keyRes.json() : {}
    if (!publicKey) return { ok: false, reason: 'server' }

    const reg = await navigator.serviceWorker.ready
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64ToBytes(publicKey) })
    }
    const res = await fetch(`${API}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload(sub, schedule)),
    })
    return res.ok ? { ok: true } : { ok: false, reason: 'server' }
  } catch {
    return { ok: false, reason: 'server' }
  }
}

/** Keep the server's copy of the schedule up to date (time, name, when Pip gets thirsty). */
export async function syncWebPush(schedule) {
  try {
    if (Notification.permission !== 'granted') return
    const sub = await currentSubscription()
    if (!sub) return
    await fetch(`${API}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload(sub, schedule)),
      keepalive: true,
    })
  } catch {
    // a missed sync just means the next one catches up
  }
}

/** Turn web reminders off and forget this phone on the server. */
export async function disableWebPush() {
  try {
    const sub = await currentSubscription()
    if (!sub) return
    await fetch(`${API}/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    })
    await sub.unsubscribe()
  } catch {
    // nothing more to do
  }
}
