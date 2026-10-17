// Phone features. Inside the app (Capacitor) these use the phone's own tools; in a browser
// they use the web versions where the browser has them, and quietly do nothing where it doesn't.
//   share()        the phone's share sheet (text, links, or a picture)
//   setAppBadge()  the little number on the app icon
//   keepAwake()    stop the screen dimming during a game
//   durable        a second copy of saves the phone won't clear when it's short on space
//   startNative()  status bar colours, splash screen, the Android back button
import { Capacitor } from '@capacitor/core'

export const isNative = () => Capacitor.isNativePlatform()

// The phone app has no web address of its own, so online features and share links use the
// website's. Set VITE_SITE_URL (for example https://your-pip.netlify.app) when building the app.
const SITE = (import.meta.env.VITE_SITE_URL ?? '').replace(/\/$/, '')

/** The address of the Pip website, for links people can open. */
export function siteUrl() {
  if (isNative()) return SITE ? `${SITE}/` : ''
  return `${location.origin}${location.pathname}`
}

/** Inside the phone app, send /api/ calls to the website's functions. */
export function routeApiCalls() {
  if (!isNative() || !SITE) return
  const original = window.fetch.bind(window)
  window.fetch = (input, init) => (typeof input === 'string' && input.startsWith('/api/') ? original(SITE + input, init) : original(input, init))
}

// ---- sharing ----
/** Share text and a link, and optionally a picture (a Blob). Returns 'shared', 'copied' or 'failed'. */
export async function share({ title = 'Pip', text = '', url = '', image = null, fileName = 'pip.png' } = {}) {
  try {
    if (isNative()) {
      const { Share } = await import('@capacitor/share')
      let files
      if (image) {
        const { Filesystem, Directory } = await import('@capacitor/filesystem')
        const data = await blobToBase64(image)
        const saved = await Filesystem.writeFile({ path: fileName, data, directory: Directory.Cache })
        files = [saved.uri]
      }
      await Share.share({ title, text, url: url || undefined, files, dialogTitle: title })
      return 'shared'
    }
    if (navigator.share) {
      const data = { title, text, url: url || undefined }
      if (image) {
        const file = new File([image], fileName, { type: image.type || 'image/png' })
        if (navigator.canShare?.({ files: [file] })) data.files = [file]
        else if (!text && !url) return downloadBlob(image, fileName)
      }
      await navigator.share(data)
      return 'shared'
    }
    if (image) return downloadBlob(image, fileName)
    await navigator.clipboard.writeText([text, url].filter(Boolean).join(' '))
    return 'copied'
  } catch (e) {
    // closing the share sheet isn't a failure
    if (e?.name === 'AbortError' || /cancel/i.test(e?.message ?? '')) return 'cancelled'
    return 'failed'
  }
}

/** Save a picture to the device: the photo library folder in the app, a download on the web. */
export async function savePicture(blob, fileName = 'pip.png') {
  if (isNative()) {
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem')
      await Filesystem.writeFile({ path: `Pip/${fileName}`, data: await blobToBase64(blob), directory: Directory.Documents, recursive: true })
      return 'saved'
    } catch {
      return share({ image: blob, fileName })
    }
  }
  return downloadBlob(blob, fileName)
}

function downloadBlob(blob, fileName) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 4000)
  return 'saved'
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result).split(',')[1])
    r.onerror = reject
    r.readAsDataURL(blob)
  })
}

export const canShare = () => isNative() || Boolean(navigator.share)

// ---- the number on the app icon ----
export async function setAppBadge(n) {
  try {
    if (isNative()) return // the phone app shows reminders as notifications instead
    if (!('setAppBadge' in navigator)) return
    if (n > 0) await navigator.setAppBadge(n)
    else await navigator.clearAppBadge()
  } catch {
    // not allowed here
  }
}

// ---- keep the screen on during games ----
let wakeLock = null
export async function keepAwake(on) {
  try {
    if (isNative()) {
      const { KeepAwake } = await import('@capacitor-community/keep-awake')
      return on ? KeepAwake.keepAwake() : KeepAwake.allowSleep()
    }
    if (on) {
      if (wakeLock || !navigator.wakeLock) return
      wakeLock = await navigator.wakeLock.request('screen')
      wakeLock.addEventListener?.('release', () => (wakeLock = null))
    } else {
      await wakeLock?.release()
      wakeLock = null
    }
  } catch {
    // the browser said no (low battery, hidden tab); that's fine
  }
}

// ---- durable saves ----
// Phones can clear a web view's storage when space runs low. In the app we keep a second copy
// in the phone's own preferences and put it back if the first copy disappears.
const DURABLE_KEYS = ['pip:v1', 'pip:farm:v1', 'pip:backup:v1']
export const durable = {
  async restore() {
    if (!isNative()) return
    try {
      const { Preferences } = await import('@capacitor/preferences')
      for (const key of DURABLE_KEYS) {
        if (localStorage.getItem(key)) continue
        const { value } = await Preferences.get({ key })
        if (value) localStorage.setItem(key, value)
      }
    } catch {
      // nothing saved yet
    }
  },
  async save(key, value) {
    if (!isNative()) return
    try {
      const { Preferences } = await import('@capacitor/preferences')
      await Preferences.set({ key, value })
    } catch {
      // ignore
    }
  },
  async remove(key) {
    if (!isNative()) return
    try {
      const { Preferences } = await import('@capacitor/preferences')
      await Preferences.remove({ key })
    } catch {
      // ignore
    }
  },
}

/** Ask the browser not to clear Pip's saves when space runs low. */
export async function askPersistentStorage() {
  try {
    if (isNative() || !navigator.storage?.persist) return
    if (!(await navigator.storage.persisted())) await navigator.storage.persist()
  } catch {
    // ignore
  }
}

// ---- app start ----
/**
 * Status bar colours, hide the splash screen, and the Android back button.
 * onBack() returns true when it handled the press (closed a sheet, went back a page).
 */
export async function startNative({ onBack, onResume } = {}) {
  askPersistentStorage()
  if (!isNative()) {
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && onResume?.())
    return
  }
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setOverlaysWebView({ overlay: true })
    await StatusBar.setStyle({ style: Style.Light })
  } catch {
    // not on this phone
  }
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    await SplashScreen.hide({ fadeOutDuration: 300 })
  } catch {
    // ignore
  }
  try {
    const { App } = await import('@capacitor/app')
    App.addListener('backButton', ({ canGoBack }) => {
      if (onBack?.()) return
      if (canGoBack) window.history.back()
      else App.minimizeApp()
    })
    App.addListener('appStateChange', ({ isActive }) => isActive && onResume?.())
  } catch {
    // ignore
  }
}

/** Dark status bar icons on light screens, light icons on dark ones. */
export async function setStatusBarDark(dark) {
  if (!isNative()) return
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light })
  } catch {
    // ignore
  }
}

// ---- where you are (only when you turn on real weather) ----
export async function getRoughLocation() {
  if (isNative()) {
    const { Geolocation } = await import('@capacitor/geolocation')
    const perm = await Geolocation.requestPermissions({ permissions: ['coarseLocation'] }).catch(() => null)
    if (perm && perm.coarseLocation === 'denied' && perm.location === 'denied') throw new Error('denied')
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 15000, maximumAge: 3600000 })
    return { lat: pos.coords.latitude, lon: pos.coords.longitude }
  }
  if (!navigator.geolocation) throw new Error('unsupported')
  const pos = await new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 15000, maximumAge: 3600000 }),
  )
  return { lat: pos.coords.latitude, lon: pos.coords.longitude }
}
