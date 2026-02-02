'use client';

import { useEffect } from 'react';

/**
 * キャッシュクリア機能とエラーハンドリングをするコンポーネント
 * 開発環境: 手動キャッシュクリア機能（Ctrl+Shift+DまたはclearAppCache()）
 * 本番環境: ChunkLoadErrorの自動検出と復旧
 */
export function CacheClearer() {
    useEffect(() => {
        const isDevelopment = typeof window !== 'undefined' && (
            window.location.hostname === 'localhost' ||
            window.location.hostname.startsWith('192.168')
        );

        // 共通: グローバルでキャッシュクリア関数を公開
        const clearAllCachesAndReload = async () => {
            try {
                console.log('🧹 全てのキャッシュをクリア中...');

                // Service Worker のキャッシュをすべて削除
                if ('caches' in window) {
                    const cacheNames = await caches.keys();
                    await Promise.all(
                        cacheNames.map(name => {
                            console.log(`  削除中: ${name}`);
                            return caches.delete(name);
                        })
                    );
                    console.log('✓ キャッシュ削除完了');
                }

                // Service Worker を再登録
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (const registration of registrations) {
                        await registration.unregister();
                    }
                    console.log('✓ Service Worker の登録解除完了');
                }

                console.log('✓ 全てのキャッシュをクリアしました');

                // ハードリロード
                if (isDevelopment) {
                    console.log('ページをリロードしてください。');
                    return true;
                } else {
                    window.location.href = window.location.href;
                }
            } catch (error) {
                console.error('✗ キャッシュクリアエラー:', error);
                return false;
            }
        };

        (window as any).clearAppCache = clearAllCachesAndReload;

        // 開発環境専用: キーボードショートカット
        if (isDevelopment) {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                    e.preventDefault();
                    console.log('🔑 Ctrl+Shift+D が押下されました');
                    clearAllCachesAndReload();
                }
            };

            window.addEventListener('keydown', handleKeyDown);

            return () => {
                window.removeEventListener('keydown', handleKeyDown);
            };
        }

        // 本番環境専用: ChunkLoadErrorの自動検出と復旧
        if (!isDevelopment) {
            const handleError = (event: ErrorEvent) => {
                if (event.message?.includes('ChunkLoadError') || event.message?.includes('Failed to load chunk')) {
                    console.error('✗ ChunkLoadError detected:', event.message);
                    console.log('キャッシュをクリアしてリロードします...');
                    clearAllCachesAndReload();
                }
            };

            // Promiseの未処理拒否のハンドラー
            const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
                if (event.reason?.message?.includes('ChunkLoadError') ||
                    event.reason?.message?.includes('Failed to load chunk') ||
                    String(event.reason).includes('ChunkLoadError')) {
                    console.error('✗ Unhandled ChunkLoadError rejection detected');
                    console.log('キャッシュをクリアしてリロードします...');
                    clearAllCachesAndReload();
                }
            };

            window.addEventListener('error', handleError, true);
            window.addEventListener('unhandledrejection', handleUnhandledRejection);

            // 定期的にキャッシュの整合性をチェック（5分ごと）
            const validateCacheIntegrity = async () => {
                try {
                    if (!('caches' in window)) return;

                    const cacheNames = await caches.keys();
                    const chunkCache = cacheNames.find(name => name === 'shs-sei-check-chunks');

                    if (!chunkCache) return;

                    const cache = await caches.open(chunkCache);
                    const keys = await cache.keys();

                    // キャッシュされたアイテムの検証
                    for (const request of keys) {
                        const response = await cache.match(request);
                        if (!response || response.status !== 200) {
                            console.warn('Invalid cached item, removing:', request.url);
                            await cache.delete(request);
                        }
                    }

                    console.log('✓ Cache integrity check passed');
                } catch (error) {
                    console.error('Cache validation error:', error);
                }
            };

            const cacheValidationInterval = setInterval(validateCacheIntegrity, 300000); // 5分

            return () => {
                window.removeEventListener('error', handleError, true);
                window.removeEventListener('unhandledrejection', handleUnhandledRejection);
                clearInterval(cacheValidationInterval);
            };
        }
    }, []);

    return null;
}
