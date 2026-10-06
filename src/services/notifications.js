// Gentle reminders, using Capacitor Local Notifications inside the phone app.
// Two kinds, both kind and never guilt-based:
//   1. a daily hello at the time the user picks
//   2. a one-off nudge for when Pip will actually start to get thirsty
// In a web browser these are skipped quietly (the app works the same otherwise).
import { Capacitor } from '@capacitor/core'
import { REMINDER_MESSAGES, THIRSTY_REMINDERS, pick } from '@/data/messages'

const DAILY_ID = 101
const THIRSTY_ID = 102
const QUIET_FROM = 22 // no nudges between 10pm…
const QUIET_UNTIL = 8 // …and 8am

let plugin = null

async function getPlugin() {
  if (!Capacitor.isNativePlatform()) return null
  if (!plugin) plugin = (await import('@capacitor/local-notifications')).LocalNotifications
  return plugin
}

export function remindersSupported() {
  return Capacitor.isNativePlatform()
}

/** Ask for permission. Returns true if reminders can be shown. */
export async function requestReminderPermission() {
  const ln = await getPlugin()
  if (!ln) return false
  try {
    const current = await ln.checkPermissions()
    if (current.display === 'granted') return true
    const asked = await ln.requestPermissions()
    return asked.display === 'granted'
  } catch {
    return false
  }
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

/**
 * Replace any scheduled reminders with fresh ones.
 * @param {{ enabled: boolean, time: string, name: string, hoursUntilThirsty: number }} options
 */
export async function scheduleReminders({ enabled, time = '19:00', name = 'Pip', hoursUntilThirsty = 0 }) {
  const ln = await getPlugin()
  if (!ln) return
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
