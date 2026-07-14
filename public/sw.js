const CACHE="melin-v2";
self.addEventListener("install",event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(["/logo.jpeg","/manifest.webmanifest"]))) });
self.addEventListener("activate",event=>event.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))])));
self.addEventListener("fetch",event=>{if(event.request.method!=="GET")return;const isPage=event.request.mode==="navigate";if(isPage){event.respondWith(fetch(event.request).catch(()=>caches.match("/")));return}event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response}).catch(()=>caches.match(event.request)))});
