// Pip's service worker. It does three things:
//   1. keeps a copy of the app, so Pip opens even with no signal
//   2. shows a reminder when one arrives
//   3. opens Pip when the reminder is tapped
//
// Caching: pages are network first (so updates arrive straight away) with the saved copy as
// a fallback offline. Built files under /assets/ have unique names, so once saved they're
// used straight from the cache. The online services under /api/ are never cached.

const CACHE = 'pip-v4'
// scripts load with an Origin header, saved copies may not have one: match regardless
const MATCH = { ignoreVary: true }
const SHELL = ['./', './manifest.webmanifest', './favicon.svg', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL).catch(() => {}))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('pip-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

// The app tells us which files it has loaded, so the first visit is saved for offline too.
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'cache-urls' || !Array.isArray(event.data.urls)) return
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(
        event.data.urls.map((url) =>
          cache.match(url, MATCH).then((hit) => hit || fetch(url).then((res) => res.ok && cache.put(url, res)).catch(() => {})),
        ),
      ),
    ),
  )
})

function isCacheable(request, url) {
  if (request.method !== 'GET') return false
  if (url.origin !== self.location.origin) return url.hostname === 'fonts.gstatic.com'
  if (url.pathname.startsWith('/api/') || url.pathname.endsWith('/sw.js')) return false
  // the dev server's own files change all the time; leave them alone
  if (url.pathname.startsWith('/@') || url.pathname.startsWith('/src/') || url.pathname.startsWith('/node_modules/')) return false
  return true
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE)
  try {
    const res = await fetch(request)
    if (res.ok) cache.put('./', res.clone())
    return res
  } catch {
    return (await cache.match('./', MATCH)) || (await cache.match(request, MATCH)) || Response.error()
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE)
  const hit = await cache.match(request, MATCH)
  if (hit) return hit
  const res = await fetch(request)
  if (res.ok) cache.put(request, res.clone())
  return res
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE)
  const hit = await cache.match(request, MATCH)
  const fresh = fetch(request)
    .then((res) => {
      if (res.ok) cache.put(request, res.clone())
      return res
    })
    .catch(() => hit)
  return hit || fresh
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (!isCacheable(request, url)) return
  if (request.mode === 'navigate') return event.respondWith(networkFirst(request))
  if (url.pathname.includes('/assets/') || url.hostname === 'fonts.gstatic.com') return event.respondWith(cacheFirst(request))
  event.respondWith(staleWhileRevalidate(request))
})

// ---- reminders ----
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data?.text() }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Pip', {
      body: data.body || 'Want to spend a little time with Pip?',
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      tag: data.tag || 'pip',
      data: { url: data.url || './' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || './'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      for (const win of windows) {
        if ('focus' in win) return win.focus()
      }
      return self.clients.openWindow(url)
    }),
  )
})
