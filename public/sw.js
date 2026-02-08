const CACHE_VERSION = 'v20240320-1'; // バージョン管理
const CACHE_PREFIX = 'shs-sei-check';

const CACHE_NAMES = {
  PRECACHE: `${CACHE_PREFIX}-precache-${CACHE_VERSION}`,
  RUNTIME: `${CACHE_PREFIX}-runtime-${CACHE_VERSION}`,
  STATIC: `${CACHE_PREFIX}-static-${CACHE_VERSION}`,
  IMAGES: `${CACHE_PREFIX}-images-${CACHE_VERSION}`,
};

// プリキャッシュするアセット
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/favicon.ico',
  '/icon.png',
  '/offline.png',
];

// 開発環境判定
const isDevelopment = self.location.origin.includes('localhost') || self.location.origin.includes('192.168');

// --- Install Event ---
self.addEventListener('install', (event) => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(CACHE_NAMES.PRECACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// --- Activate Event ---
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith(CACHE_PREFIX) && !Object.values(CACHE_NAMES).includes(name))
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// --- Fetch Event ---
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // GETリクエスト以外は無視
  if (request.method !== 'GET') return;

  // 同一オリジン以外のリクエスト（外部API等）かつナビゲーション以外はスキップ
  if (url.origin !== self.location.origin && request.mode !== 'navigate') {
    return;
  }

  // 1. ナビゲーションリクエスト (HTML) -> Network First
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 成功した場合は実行時キャッシュに保存
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAMES.RUNTIME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          // ネットワークエラー時はキャッシュを確認、なければオフラインページ
          return caches.match(request).then((cached) => {
            return cached || caches.match('/offline');
          });
        })
    );
    return;
  }

  // 2. APIリクエスト -> Network First (No Fallback to Offline Page)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAMES.RUNTIME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request) || new Response(JSON.stringify({ error: 'offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // 3. 静的アセット (Next.js Chunks, CSS, etc.) -> Cache First
  if (url.pathname.startsWith('/_next/static/') || url.pathname.match(/\.(js|css|woff2?|ttf|otf)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAMES.STATIC).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // 4. 画像アセット -> Cache First
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAMES.IMAGES).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // 5. その他 -> Default Strategy (Cache with Network Fallback)
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request).then((response) => {
        if (response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAMES.RUNTIME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }).catch(() => new Response('Offline', { status: 404 }))
  );
});

// --- Push / Notification Events (将来用) ---
self.addEventListener('push', (event) => {
  // 実装が必要な場合に追加
});
