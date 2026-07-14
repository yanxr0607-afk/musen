// OPC H5 Web App — Service Worker
// 策略：核心资源预缓存；导航走「网络优先 + 离线回退缓存」；静态资源走「网络优先 + 离线回退缓存」（每次部署自动拉新，避免旧 app.js 缓存导致功能不生效）。
const CACHE = 'opc-h5-v3';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/styles.css',
  './assets/app.js',
  './assets/data.js',
  './assets/icon.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-maskable-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(CORE).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 第三方（如 busuanzi）不拦截

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return res; })
        .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // 静态资源：网络优先 + 离线回退缓存（修复部署后旧 app.js 缓存导致功能不生效的问题）
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)).catch(() => {}); }
        return res;
      })
      .catch(() => caches.match(req).then(r => r || fetch(req)))
  );
});
