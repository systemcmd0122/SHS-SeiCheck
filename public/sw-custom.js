/* eslint-disable no-undef */

// このファイルは next-pwa によって生成される sw.js から importScripts() で読み込まれます。
// そのため、workbox オブジェクトはすでに利用可能な状態です。

// --- キャッシュ戦略 ---

// HTML: Network first
workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
        cacheName: 'pages-cache', // next-pwaが生成するキャッシュ名と衝突しないように変更
        plugins: [
            new workbox.expiration.ExpirationPlugin({
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
            }),
        ],
    })
);

// CSS/JS: Cache first
workbox.routing.registerRoute(
    ({ request }) => request.destination === 'style' || request.destination === 'script',
    new workbox.strategies.CacheFirst({
        cacheName: 'static-resources-cache', // next-pwaが生成するキャッシュ名と衝突しないように変更
        plugins: [
            new workbox.expiration.ExpirationPlugin({
                maxEntries: 32,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
            }),
        ],
    })
);

// 画像: Cache first
workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
        cacheName: 'image-cache',
        plugins: [
            new workbox.expiration.ExpirationPlugin({
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
            }),
        ],
    })
);

// Google Fonts: Cache first
workbox.routing.registerRoute(
    /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
    new workbox.strategies.CacheFirst({
        cacheName: 'google-fonts-cache',
        plugins: [
            new workbox.expiration.ExpirationPlugin({
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
            }),
        ],
    })
);

// Firebase/API calls: Network first
workbox.routing.registerRoute(
    /^https:\/\/(firestore\.googleapis\.com|.*\.firebaseio\.com)\/.*/i,
    new workbox.strategies.NetworkFirst({
        cacheName: 'firebase-api-cache', // next-pwaが生成するキャッシュ名と衝突しないように変更
        networkTimeoutSeconds: 3,
        plugins: [
            new workbox.expiration.ExpirationPlugin({
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
            }),
            new workbox.cacheableResponse.CacheableResponsePlugin({
                statuses: [0, 200],
            }),
        ],
    })
);


// --- カスタムロジック ---

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// バックグラウンド同期の設定
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-attendance') {
        event.waitUntil(syncAttendance());
    }
});

// バックグラウンド同期の実装
async function syncAttendance() {
    try {
        const response = await fetch('/api/sync-attendance', {
            method: 'POST',
        });
        if (!response.ok) throw new Error('Sync failed');
        return response.json();
    } catch (error) {
        console.error('Background sync failed:', error);
        throw error;
    }
}

// プッシュ通知の設定
self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();
    const options = {
        body: data.body || '通知があります',
        icon: '/icon.jpg', // 修正
        badge: '/icon.jpg', // 修正
        tag: data.tag || 'notification',
        requireInteraction: data.requireInteraction || false,
        actions: [
            {
                action: 'open',
                title: '開く',
            },
            {
                action: 'close',
                title: '閉じる',
            },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'SeiCheck', options)
    );
});

// 通知クリック時の処理
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'close') return;

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            // アクティブなウィンドウがあるか確認
            for (let client of clientList) {
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            // なければ新しいウィンドウを開く
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});