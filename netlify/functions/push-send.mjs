// Runs every 15 minutes and sends any reminders that are due.
//
//  - The daily hello goes out at the chosen time in the person's own timezone,
//    but only if they haven't already visited Pip that day.
//  - The thirsty nudge goes out once, when Pip is due to get thirsty.
//  - Nothing is ever sent between 10pm and 8am. At most one reminder per run.
import { store, send, planReminder, setupProblem } from '../lib/push.mjs'
import { REMINDER_MESSAGES, THIRSTY_REMINDERS, pick } from '../../src/data/messages.js'
import { FACTS } from '../../src/data/facts.js'

const withName = (text, name) => text.replaceAll('{name}', name)

export default async () => {
  const problem = setupProblem()
  if (problem) {
    console.log(`Reminders skipped: ${problem}`)
    return
  }

  const blobs = store()
  const { blobs: entries } = await blobs.list()
  const now = new Date()
  let sent = 0

  for (const { key } of entries) {
    const rec = await blobs.get(key, { type: 'json' })
    if (!rec?.subscription) continue

    const { kind, changes } = planReminder(rec, now)
    if (!changes) continue

    if (kind) {
      // now and then, the daily hello is a little fun fact instead
      const body =
        kind === 'daily' && Math.random() < 0.4
          ? `Did you know? ${pick(FACTS).text}`
          : withName(pick(kind === 'thirsty' ? THIRSTY_REMINDERS : REMINDER_MESSAGES), rec.name)
      const result = await send(rec.subscription, { title: rec.name, body, tag: `pip-${kind}` })
      if (result === 'gone') {
        await blobs.delete(key)
        continue
      }
      if (result === 'sent') sent += 1
    }
    await blobs.setJSON(key, { ...rec, ...changes })
  }

  console.log(`Reminders: checked ${entries.length}, sent ${sent}`)
}

export const config = { schedule: '*/15 * * * *' }
