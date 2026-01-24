const CACHE_NAME = 'shs-sei-check-v1';
const RUNTIME_CACHE = 'shs-sei-check-runtime';
const ASSETS_CACHE = 'shs-sei-check-assets';

// インストールイベント
self.addEventListener('install', (event) => {
    event.waitUntil(
        Promise.all([
            caches.open(CACHE_NAME).then((cache) => {
                return cache.addAll(['/manifest.json', '/']).catch((err) => {
                    console.log('Cache error:', err);
                });
            }),
            caches.open(ASSETS_CACHE).then((cache) => {
                return cache.addAll([]).catch((err) => {
                    console.log('Assets cache error:', err);
                });
            })
        ])
    );
    self.skipWaiting();
});

// アクティベーションイベント
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((cacheName) =>
                        !cacheName.includes('shs-sei-check')
                    )
                    .map((cacheName) => {
                        console.log('Delete old cache:', cacheName);
                        return caches.delete(cacheName);
                    })
            );
        })
    );
    self.clients.claim();
});

// フェッチイベント
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // サポートされていないメソッドはスキップ
    if (request.method !== 'GET') {
        return;
    }

    // ローカルホスト以外のリクエストはスキップ
    if (!url.origin.includes('localhost') && !url.origin.includes('192.168')) {
        if (request.mode !== 'navigate') {
            return;
        }
    }

    // favicon等のリソースはスキップ
    if (url.pathname.includes('favicon') || url.pathname.includes('.ico')) {
        event.respondWith(fetch(request).catch(() => new Response('', { status: 404 })));
        return;
    }

    // HTMLページ（navigate）はネットワーク優先
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response && response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => {
                            cache.put(request, responseToCache);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(request).then((response) => {
                        return response || new Response('オフラインです', { status: 503 });
                    });
                })
        );
        return;
    }

    // API呼び出しはネットワーク優先、キャッシュフォールバック
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request, { priority: 'high' })
                .then((response) => {
                    if (response && response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => {
                            cache.put(request, responseToCache);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(request) || new Response('オフラインです', { status: 503 });
                })
        );
        return;
    }

    // JS, CSS はキャッシュ優先、ネットワークフォールバック
    if (url.pathname.match(/\.(js|css)$/)) {
        event.respondWith(
            caches.match(request).then((response) => {
                return (
                    response ||
                    fetch(request, { priority: 'high' }).then((response) => {
                        if (response && response.status === 200) {
                            const responseToCache = response.clone();
                            caches.open(ASSETS_CACHE).then((cache) => {
                                cache.put(request, responseToCache);
                            });
                        }
                        return response;
                    })
                );
            }).catch(() => {
                return new Response('', { status: 404 });
            })
        );
        return;
    }

    // 画像はキャッシュ優先
    if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/)) {
        event.respondWith(
            caches.match(request).then((response) => {
                return (
                    response ||
                    fetch(request, { priority: 'low' }).then((response) => {
                        if (response && response.status === 200) {
                            const responseToCache = response.clone();
                            caches.open(ASSETS_CACHE).then((cache) => {
                                cache.put(request, responseToCache);
                            });
                        }
                        return response;
                    })
                );
            }).catch(() => {
                return new Response('', { status: 404 });
            })
        );
        return;
    }

    // その他のリソースはキャッシュ優先
    event.respondWith(
        caches.match(request).then((response) => {
            return (
                response ||
                fetch(request).then((response) => {
                    if (response && response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => {
                            cache.put(request, responseToCache);
                        });
                    }
                    return response;
                })
            );
        }).catch(() => {
            return new Response('', { status: 404 });
        })
    );
});

