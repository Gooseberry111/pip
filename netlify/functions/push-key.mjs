// Gives the app the public key it needs to subscribe to reminders.
import { json, vapid, setupProblem } from '../lib/push.mjs'

// Open /api/push/key in a browser to check the setup: `problem` explains anything missing.
export default async () => {
  const problem = setupProblem()
  return json({ publicKey: problem ? null : vapid().publicKey, problem })
}

export const config = { path: '/api/push/key' }
