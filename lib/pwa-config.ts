// next-pwa設定
// このファイルはnext.config.mjsで使用されます

export const PWAConfig = {
    // Service Workerの宛先
    dest: 'public',

    // 自動登録
    register: true,

    // 新しいService Workerを待たずにすぐに使用
    skipWaiting: true,

    // キャッシング戦略
    runtimeCaching: [
        // Google Fonts
        {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
                cacheName: 'google-fonts',
                expiration: {
                    maxEntries: 4,
                    maxAgeSeconds: 365 * 24 * 60 * 60,
                },
            },
        },
        // CDNリソース
        {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: 'CacheFirst',
            options: {
                cacheName: 'cdn-cache',
                expiration: {
                    maxEntries: 32,
                    maxAgeSeconds: 60 * 60 * 24 * 365,
                },
            },
        },
        // Firebase
        {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'firebase-cache',
                networkTimeoutSeconds: 3,
                expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60,
                },
            },
        },
        // 画像
        {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
                cacheName: 'static-images',
                expiration: {
                    maxEntries: 60,
                    maxAgeSeconds: 60 * 60 * 24 * 30,
                },
            },
        },
        // その他のHTTPSリクエスト
        {
            urlPattern: /^https:\/\/.*$/i,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'https-calls',
                networkTimeoutSeconds: 3,
                expiration: {
                    maxEntries: 60,
                    maxAgeSeconds: 60 * 60 * 24,
                },
                cacheableResponse: {
                    statuses: [0, 200],
                },
            },
        },
    ],
};
