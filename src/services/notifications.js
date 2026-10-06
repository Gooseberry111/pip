// Gentle reminders. Two kinds, both kind and never guilt-based:
//   1. a daily hello at the time the user picks
//   2. a one-off nudge for when Pip will actually start to get thirsty
//
// Inside the phone app (Capacitor) the phone schedules them itself.
// As an installed web app (Home Screen), they come by web push from a Netlify function.
import { Capacitor } from '@capacitor/core'
import { REMINDER_MESSAGES, THIRSTY_REMINDERS, pick } from '@/data/messages'
import { webPushAvailable, isIOS, isInstalled, enableWebPush, syncWebPush, disableWebPush } from './webPush'

const DAILY_ID = 101
const THIRSTY_ID = 102
const QUIET_FROM = 22 // no nudges between 10pm…
const QUIET_UNTIL = 8 // …and 8am

let plugin = null
const native = () => Capacitor.isNativePlatform()

async function getPlugin() {
  if (!native()) return null
  if (!plugin) plugin = (await import('@capacitor/local-notifications')).LocalNotifications
  return plugin
}

/**
 * How reminders can work here:
 * 'native' (phone app), 'web' (web push), 'install' (iPhone: add to Home Screen first), 'unsupported'.
 */
export function remindersMode() {
  if (native()) return 'native'
  if (isIOS() && !isInstalled()) return 'install'
  if (webPushAvailable()) return 'web'
  return 'unsupported'
}

export function remindersSupported() {
  return ['native', 'web'].includes(remindersMode())
}

/**
 * Turn reminders on. Asks for permission (and, on the web, registers this phone).
 * Returns { ok: true } or { ok: false, reason: 'denied' | 'install' | 'unsupported' | 'server' }.
 */
export async function enableReminders(schedule) {
  if (native()) {
    const ln = await getPlugin()
    try {
      const current = await ln.checkPermissions()
      if (current.display === 'granted') return { ok: true }
      const asked = await ln.requestPermissions()
      return asked.display === 'granted' ? { ok: true } : { ok: false, reason: 'denied' }
    } catch {
      return { ok: false, reason: 'denied' }
    }
  }
  return enableWebPush(schedule)
}

/** Turn reminders off everywhere for this phone. */
export async function disableReminders() {
  if (native()) {
    const ln = await getPlugin()
    try {
      await ln.cancel({ notifications: [{ id: DAILY_ID }, { id: THIRSTY_ID }] })
    } catch {
      // nothing scheduled
    }
    return
  }
  await disableWebPush()
}

/** Move a time out of quiet hours, to the next morning. */
function gentleTime(date) {
  const d = new Date(date)
  if (d.getHours() >= QUIET_FROM) {
    d.setDate(d.getDate() + 1)
    d.setHours(QUIET_UNTIL + 1, 0, 0, 0)
  } else if (d.getHours() < QUIET_UNTIL) {
    d.setHours(QUIET_UNTIL + 1, 0, 0, 0)
  }
  return d
}

const withName = (text, name) => text.replaceAll('{name}', name)

let syncTimer = null

/**
 * Bring reminders up to date with Pip (time, name, when Pip gets thirsty).
 * @param {{ enabled: boolean, time: string, name: string, hoursUntilThirsty: number }} options
 */
export async function scheduleReminders({ enabled, time = '19:00', name = 'Pip', hoursUntilThirsty = 0 }) {
  if (!native()) {
    // web: share the latest schedule with the server (gathered up so several changes send once)
    if (!enabled || !webPushAvailable()) return
    clearTimeout(syncTimer)
    syncTimer = setTimeout(() => syncWebPush({ time, name, hoursUntilThirsty }), 800)
    return
  }

  const ln = await getPlugin()
  try {
    await ln.cancel({ notifications: [{ id: DAILY_ID }, { id: THIRSTY_ID }] })
    if (!enabled) return
    const [hour, minute] = time.split(':').map(Number)
    const notifications = [
      {
        id: DAILY_ID,
        title: name,
        body: withName(pick(REMINDER_MESSAGES), name),
        schedule: { on: { hour, minute }, allowWhileIdle: true },
      },
    ]
    if (hoursUntilThirsty > 0.5) {
      notifications.push({
        id: THIRSTY_ID,
        title: name,
        body: withName(pick(THIRSTY_REMINDERS), name),
        schedule: { at: gentleTime(Date.now() + hoursUntilThirsty * 3600 * 1000), allowWhileIdle: true },
      })
    }
    await ln.schedule({ notifications })
  } catch {
    // Reminders are a gentle extra; never let them break anything.
  }
}
