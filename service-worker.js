/* EduQuest 8.0 service worker — caches the app's own files so it works offline.
   Strategy: pre-cache on install; cache-first for local files (updating in the background);
   network-first for page navigations so a new version is picked up when online.
   External requests (e.g. optional natural voice, web fonts) are never cached or intercepted. */
const VERSION = 'eduquest-8.0.0-r2';
const CORE = ['./','./index.html','./manifest.json','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install', e=>{ e.waitUntil(caches.open(VERSION).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())); });
self.addEventListener('activate', e=>{ e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==VERSION && k.indexOf('eduquest-')===0).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch', e=>{
  const req = e.request; if(req.method!=='GET') return;
  const url = new URL(req.url); if(url.origin!==location.origin) return;
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(r=>{ const copy = r.clone(); caches.open(VERSION).then(c=>c.put('./index.html', copy)); return r; }).catch(()=>caches.match('./index.html').then(r=>r||caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(req).then(hit=>{
    const net = fetch(req).then(r=>{ if(r && r.ok){ const copy = r.clone(); caches.open(VERSION).then(c=>c.put(req, copy)); } return r; }).catch(()=>hit);
    return hit || net;
  }));
});
