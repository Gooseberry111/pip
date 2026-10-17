// Gives the app the public key it needs to subscribe to reminders.
import { json, vapid, setupProblem } from '../lib/push.mjs'
import { cors } from '../lib/cors.mjs'

// Open /api/push/key in a browser to check the setup: `problem` explains anything missing.
const handler = async () => {
  const problem = setupProblem()
  return json({ publicKey: problem ? null : vapid().publicKey, problem })
}

export default cors(handler)

export const config = { path: '/api/push/key' }
