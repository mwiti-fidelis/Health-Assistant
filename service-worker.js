const CACHE = 'healthcare-v1', OFFLINE = '/offline.html', ASSETS = ['/', '/index.html', '/style.css', '/app.js', '/firebase-config.js', '/manifest.json', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'];

self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(names => Promise.all(names.filter(n => n !== CACHE).map(n => caches.delete(n))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { if(r.status === 200) caches.open(CACHE).then(c => c.put(e.request, r.clone())); return r; }).catch(() => caches.match(e.request).then(cr => cr || (e.request.mode === 'navigate' ? caches.match(OFFLINE) : new Response('Offline', { status: 503 })))));
});
self.addEventListener('push', e => { const d = e.data?.json()||{}; e.waitUntil(self.registration.showNotification(d.title||'HealthCare App', { body: d.body||'New notification', icon: '/icon-192x192.png', data: d.url||'/' })); });
self.addEventListener('notificationclick', e => { e.notification.close(); if(!e.action || e.action === 'open') e.waitUntil(clients.openWindow(e.notification.data)); });
self.addEventListener('sync', e => { if(e.tag === 'sync-appointments') e.waitUntil(syncAppts()); });

async function syncAppts() {
  const local = JSON.parse(localStorage.getItem('hc_appointments')||'[]'), unsynced = local.filter(a => !a.synced);
  for(const a of unsynced) { try { await fetch('/api/appointments', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(a) }); a.synced = true; } catch(e) { console.error('Sync failed:', e); } }
  localStorage.setItem('hc_appointments', JSON.stringify(local));
}