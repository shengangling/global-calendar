/* 环球万年历 · 离线缓存
 * 联网时优先取最新文件（3 秒没响应就用缓存），并顺手更新缓存；断网时直接用缓存，日历完整可用。
 * 天气、中国放假公告等跨站请求不经过这里，断网时由页面提示“离线”。 */
const CACHE='wnl-v2';
const CORE=['./','index.html','core.js','countries.js','holdata.js','ui.js','netdata.json','manifest.webmanifest','icon.png','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const keyOf=req=>{const u=new URL(req.url);return u.origin+u.pathname};   // 去掉 ?t= 之类的参数，同一文件只存一份
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;const u=new URL(req.url);if(u.origin!==location.origin)return;
  const nav=req.mode==='navigate';
  e.respondWith((async()=>{const cache=await caches.open(CACHE);
    const cached=await cache.match(nav?new URL('index.html',self.registration.scope).href:keyOf(req));
    const net=fetch(req).then(r=>{if(r&&r.ok)cache.put(nav?new URL('index.html',self.registration.scope).href:keyOf(req),r.clone());return r});
    if(!cached)return net.catch(()=>new Response('离线且尚未缓存',{status:503}));
    // 有缓存：最多等网络 3 秒，超时或失败就用缓存（后台仍会更新缓存）
    net.catch(()=>{});
    return Promise.race([net.catch(()=>cached),new Promise(r=>setTimeout(()=>r(cached),3000))])})())});
