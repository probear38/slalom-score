const C='slalom-v1',F=['./','index.html','app.css','app.js','score.js','manifest.json','icon-180.png','icon-512.png'];
self.oninstall=e=>e.waitUntil(caches.open(C).then(c=>c.addAll(F)));
self.onactivate=e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!=C).map(x=>caches.delete(x)))));
self.onfetch=e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
