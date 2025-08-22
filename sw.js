self.addEventListener('install', e=>{
  e.waitUntil(caches.open('responsibly-v3').then(c=>c.addAll([
    './','./index.html','./style.css','./app.js','./logo.svg','./PRIVACY.md','./DISCLAIMER.md'
  ])));
});
self.addEventListener('fetch', e=>{
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
