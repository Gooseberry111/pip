// Saves Pip on this device. Implements the storage adapter interface:
//   load(): Promise<object | null>
//   save(data: object): Promise<void>
//   clear(): Promise<void>

import { durable } from '../native'

const KEY = 'pip:v1'

export function createLocalStorageAdapter(key = KEY) {
  return {
    async load() {
      try {
        const raw = localStorage.getItem(key)
        return raw ? JSON.parse(raw) : null
      } catch {
        return null
      }
    },
    async save(data) {
      try {
        const json = JSON.stringify(data)
        localStorage.setItem(key, json)
        durable.save(key, json)
      } catch {
        // Storage can be unavailable (private mode). Pip still works for this session.
      }
    },
    async clear() {
      try {
        localStorage.removeItem(key)
        durable.remove(key)
      } catch {
        // ignore
      }
    },
  }
}
