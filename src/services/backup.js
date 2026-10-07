// Backups: a private recovery code that brings Pip and the farm back on any phone.
// When backups are on, everything is saved online every few minutes (only if something changed).
import { ref } from 'vue'

const META_KEY = 'pip:backup:v1'
const PIP_KEY = 'pip:v1'
const FARM_KEY = 'pip:farm:v1'
const EVERY = 5 * 60 * 1000
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function readJSON(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

function loadMeta() {
  return { on: false, code: '', lastAt: 0, ...(readJSON(META_KEY) ?? {}) }
}

/** Shown in Settings: { on, code, lastAt, status } */
export const backup = ref({ ...loadMeta(), status: '' })

function saveMeta() {
  const { on, code, lastAt } = backup.value
  writeJSON(META_KEY, { on, code, lastAt })
}

function newCode() {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => CODE_CHARS[b % CODE_CHARS.length]).join('')
}

/** XXXX-XXXX-XXXX, easier to read and write down */
export function formatCode(code) {
  return (code.match(/.{1,4}/g) ?? []).join('-')
}

export const cleanCode = (text) => String(text || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12)

/** What goes into a backup: Pip (without chats or this phone's id) and the farm. */
function payload() {
  const pip = readJSON(PIP_KEY)
  if (!pip) return null
  const { chat, deviceId, ...rest } = pip
  return { version: 1, pip: rest, farm: readJSON(FARM_KEY) }
}

async function call(method, body, query = '') {
  let res
  try {
    res = await fetch(`/api/backup${query}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    })
  } catch {
    return { ok: false, reason: 'offline' }
  }
  const type = res.headers.get('content-type') || ''
  if (!type.includes('application/json')) return { ok: false, reason: 'unavailable' }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return { ok: false, reason: data.error || 'server' }
  return { ok: true, ...data }
}

let lastSent = ''

/** Save a backup now. Skips the upload if nothing has changed since last time. */
export async function backupNow({ force = false } = {}) {
  if (!backup.value.on || !backup.value.code) return { ok: false, reason: 'off' }
  const data = payload()
  if (!data) return { ok: false, reason: 'empty' }
  const text = JSON.stringify(data)
  if (!force && text === lastSent) return { ok: true, skipped: true }
  backup.value = { ...backup.value, status: 'saving' }
  const r = await call('POST', { code: backup.value.code, data })
  if (r.ok) {
    lastSent = text
    backup.value = { ...backup.value, lastAt: r.at ?? Date.now(), status: '' }
    saveMeta()
  } else {
    backup.value = { ...backup.value, status: r.reason }
  }
  return r
}

export async function turnOnBackup() {
  if (!backup.value.code) backup.value = { ...backup.value, code: newCode() }
  backup.value = { ...backup.value, on: true }
  saveMeta()
  return backupNow({ force: true })
}

export async function turnOffBackup({ remove = false } = {}) {
  const code = backup.value.code
  backup.value = { ...backup.value, on: false, status: '' }
  saveMeta()
  if (remove && code) {
    await call('DELETE', { code })
    backup.value = { ...backup.value, code: '', lastAt: 0 }
    saveMeta()
  }
}

/** Look at a backup before restoring it: { ok, preview: { plant, level, farmLevel, at } } */
export async function fetchBackup(code) {
  const c = cleanCode(code)
  if (c.length !== 12) return { ok: false, reason: 'bad-code' }
  const r = await call('GET', null, `?code=${c}`)
  if (!r.ok) return r
  return {
    ok: true,
    code: c,
    data: r.data,
    preview: {
      plant: r.data?.pip?.plantName ?? 'Pip',
      level: r.data?.pip?.growthLevel ?? 1,
      farmLevel: r.data?.farm?.level ?? 1,
      petals: r.data?.pip?.petals ?? 0,
      at: r.at,
    },
  }
}

/** Replace everything on this phone with a backup, then reload. Keeps this phone's own id and chats. */
export function restoreBackup(code, data) {
  const current = readJSON(PIP_KEY) ?? {}
  const pip = { ...data.pip, chat: current.chat ?? [], deviceId: current.deviceId }
  writeJSON(PIP_KEY, pip)
  if (data.farm) writeJSON(FARM_KEY, data.farm)
  else localStorage.removeItem(FARM_KEY)
  backup.value = { on: true, code: cleanCode(code), lastAt: Date.now(), status: '' }
  saveMeta()
  window.location.replace(window.location.pathname)
}

let timer = null
/** Start the automatic backups (every few minutes, and when the app is put away). */
export function startBackups() {
  clearInterval(timer)
  timer = setInterval(() => {
    if (document.visibilityState === 'visible') backupNow()
  }, EVERY)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') backupNow()
  })
  // a first one shortly after opening
  setTimeout(() => backupNow(), 8000)
}

export const BACKUP_ERRORS = {
  offline: 'You’re offline. Your backup will catch up when you’re connected.',
  unavailable: 'Backups work on the online version of Pip (on Netlify).',
  'not-found': 'No backup found with that code. Check the letters and try again.',
  'bad-code': 'Backup codes are 12 letters and numbers.',
  'too-big': 'This backup is too big to save. Try clearing some old chats.',
  server: 'Something went wrong. Please try again in a moment.',
}
