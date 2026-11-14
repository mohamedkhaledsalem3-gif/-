/* دفتر المالية: يخلّي التطبيق يفتح بدون نت.
   غيّر رقم النسخة هنا كل ما تعدّل الملفات عشان الكاش يتحدّث. */
const V = 'daftar-sw-v1';
const SHELL = ['./', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(V).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  // طلبات المزامنة (Firestore) وأي موقع تاني: ما نلمسهاش
  if (u.origin !== location.origin) return;

  // فتح الصفحة: النسخة الجديدة من النت لو متاح، وإلا من الكاش
  if (r.mode === 'navigate') {
    e.respondWith(
      fetch(r).then(res => {
        const copy = res.clone();
        caches.open(V).then(c => c.put('./', copy));
        return res;
      }).catch(() => caches.match('./').then(m => m || caches.match(r)))
    );
    return;
  }

  // باقي الملفات: من الكاش فوراً وتتحدّث في الخلفية
  e.respondWith(
    caches.match(r).then(hit => {
      const net = fetch(r).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(V).then(c => c.put(r, copy)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
