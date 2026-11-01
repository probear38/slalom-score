const C='slalom-v2',F=['./','index.html','app.css','app.js','score.js','pose.js','ai.js','manifest.json','icon-180.png','icon-512.png'];
self.oninstall=e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(F)))};
self.onactivate=e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!=C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));
// 同源檔案：網路優先、離線用快取；CDN 模型交給瀏覽器 HTTP 快取
self.onfetch=e=>{if(new URL(e.request.url).origin!==location.origin)return;e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(C).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request)))};
