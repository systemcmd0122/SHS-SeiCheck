/* eslint-disable no-undef */

importScripts('https://cdn.jsdelivr.net/npm/workbox-cdn@6.5.4/workbox/workbox-sw.js');

// Workboxの初期化
workbox.setConfig({ debug: false });

// キャッシュ戦略の設定

// HTML: Network first
workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
        cacheName: 'html-cache',
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
        cacheName: 'static-resources',
        plugins: [
            new workbox.expiration.ExpirationPlugin({
                maxEntries: 30,
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
        cacheName: 'firebase-cache',
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
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
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

// Service Worker のアクティベーション時にキャッシュをクリーンアップ
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // 古いキャッシュを削除
                    if (
                        !['html-cache', 'static-resources', 'image-cache', 'google-fonts-cache', 'firebase-cache'].includes(
                            cacheName
                        )
                    ) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});