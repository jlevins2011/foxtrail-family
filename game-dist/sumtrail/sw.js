const CACHE = "sumtrail-shell-v2";
const scope = new URL(self.registration.scope);
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(["./", "./index.html", "./manifest.json", "./favicon.svg"])));
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("sumtrail-shell-")&&key!==CACHE).map(key=>caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener("fetch", event => {
  const url=new URL(event.request.url);
  if(event.request.method!=="GET" || url.origin!==scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try {
      const response=await fetch(event.request);
      if(response.ok) await cache.put(event.request,response.clone());
      return response;
    } catch {
      const hit=await cache.match(event.request);
      if(hit) return hit;
      if(event.request.mode==="navigate") {
        const shell=await cache.match(new URL("index.html",scope).href);
        if(shell) return shell;
      }
      return Response.error();
    }
  })());
});
