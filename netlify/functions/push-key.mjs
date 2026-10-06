// Gives the app the public key it needs to subscribe to reminders.
import { json } from '../lib/push.mjs'

export default async () => json({ publicKey: process.env.VAPID_PUBLIC_KEY || null })

export const config = { path: '/api/push/key' }
