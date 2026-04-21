// ══════════════════════════════════════════════
//  כנפיים – Service Worker  v3.0
// ══════════════════════════════════════════════
const CACHE_NAME = "kanafayim-v3";
const CACHE_URLS = ["./index.html","./manifest.json","./icon-192.png","./icon-512.png",
  "https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800;900&display=swap"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(CACHE_URLS).catch(()=>{})).then(()=>self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener("fetch", e => {
  if(e.request.method!=="GET")return;
  const url=new URL(e.request.url);
  const isLocal=url.origin===self.location.origin;
  const isFont=url.hostname==="fonts.googleapis.com"||url.hostname==="fonts.gstatic.com";
  if(!isLocal&&!isFont)return;
  e.respondWith(caches.match(e.request).then(cached=>{
    const net=fetch(e.request).then(res=>{
      if(res&&res.status===200)caches.open(CACHE_NAME).then(c=>c.put(e.request,res.clone()));
      return res;
    }).catch(()=>cached||caches.match("./index.html"));
    return cached||net;
  }));
});

// ── Periodic Background Sync
self.addEventListener("periodicsync", e => {
  if(e.tag==="update-services"){
    e.waitUntil(self.clients.matchAll().then(clients=>{
      clients.forEach(c=>c.postMessage({type:"PERIODIC_SYNC",tag:"update-services"}));
    }));
  }
});

// ── Push Notifications
self.addEventListener("push", e => {
  const d=e.data?.json()||{title:"כנפיים",body:"עדכון חדש זמין"};
  e.waitUntil(self.registration.showNotification(d.title,{body:d.body,icon:"./icon-192.png",dir:"rtl",lang:"he"}));
});

// ── Background Sync
self.addEventListener("sync", e => {
  if(e.tag==="sync-data") console.log("[SW] Background sync");
});
