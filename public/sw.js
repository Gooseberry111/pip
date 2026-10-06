// Pip's service worker. It only does two things:
// show a reminder when one arrives, and open Pip when the reminder is tapped.

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

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
