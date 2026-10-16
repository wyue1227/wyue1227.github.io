/*
 * sw.js — Service Worker
 *
 * 目标：首次加载后把网站必需资源缓存起来，之后断网也能继续练习。
 *
 * 重要约定：
 * 1. 本文件只操作 Cache Storage，绝不读写、删除 IndexedDB。
 *    → 更新缓存不会影响用户的练习记录。
 * 2. 只缓存本站同源资源，不缓存任何跨域请求（本站也没有跨域资源）。
 * 3. 缓存版本升级时只删除旧版本的 Cache，不动其它任何存储。
 */

const CACHE_VERSION = 'v3';
const CACHE_NAME = `gojuon-shell-${CACHE_VERSION}`;

/* 网站必需资源清单（相对路径，兼容 GitHub Pages 子路径部署） */
const PRECACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/data.js',
  './js/db.js',
  './js/app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // 逐个添加，单个资源失败不影响整体安装
      await Promise.all(
        PRECACHE.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch(() => undefined)
        )
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith('gojuon-shell-') && k !== CACHE_NAME)
          .map((k) => caches.delete(k)) // 只删旧缓存，不碰 IndexedDB
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // 只处理同源请求
  if (url.origin !== self.location.origin) return;

  // 页面导航：优先走网络以拿到新版本，失败则回退到缓存的首页（离线可打开）
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE_NAME);
          cache.put('./index.html', fresh.clone());
          return fresh;
        } catch (e) {
          const cache = await caches.open(CACHE_NAME);
          return (
            (await cache.match('./index.html')) ||
            (await cache.match('./')) ||
            new Response('离线且没有缓存，请先联网打开一次本站。', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            })
          );
        }
      })()
    );
    return;
  }

  // 其它同源静态资源：缓存优先，未命中再联网并回填缓存
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const hit = await cache.match(req);
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res && res.status === 200 && res.type === 'basic') {
          cache.put(req, res.clone());
        }
        return res;
      } catch (e) {
        return new Response('', { status: 504, statusText: 'Offline' });
      }
    })()
  );
});
