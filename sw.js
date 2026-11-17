const CACHE='worshipui-shell-v34';
const SHELL=['/','/index.html','/style.css','/app.js','/content-import.js','/bible-search.js','/assets/bibles/kjv.vpl.txt','/assets/bibles/web.vpl.txt','/assets/bibles/rv1909.vpl.txt','/sync-core.js','/sync.js','/i18n.js','/desktop-ui.js','/slide-template.cjs','/assets/fonts/Inter.ttf','/assets/fonts/Montserrat.ttf','/assets/fonts/Lato.ttf','/assets/fonts/Merriweather.ttf','/assets/fonts/PlayfairDisplay.ttf','/assets/fonts/Oswald.ttf','/assets/fonts/Poppins.ttf','/assets/fonts/SourceSans3.ttf'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL))));
// Do not skipWaiting: an app update must not replace a running service.
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('worshipui-shell-')&&k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 if(!SHELL.includes(url.pathname))return;
 event.respondWith(caches.open(CACHE).then(async cache=>{
   const key=url.pathname==='/'||url.pathname==='/index.html'?'/':url.pathname;
   const cached=await cache.match(key);
   return cached||fetch(event.request);
 }));
});
