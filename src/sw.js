// Service worker dell'app: precache dell'interfaccia (offline)
// e ricezione delle notifiche push.
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

self.skipWaiting()
clientsClaim()
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('push', event => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { /* payload non JSON */ }
  event.waitUntil(
    self.registration.showNotification(data.title || 'InDue', {
      body: data.body || '',
      icon: '/icon.svg',
      badge: '/icon.svg'
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(list => {
      const open = list.find(c => 'focus' in c)
      return open ? open.focus() : self.clients.openWindow('/')
    })
  )
})
