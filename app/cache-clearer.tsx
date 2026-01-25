'use client';

import { useEffect } from 'react';

/**
 * 開発環境でキャッシュをクリアするコンポーネント
 * コンソールで clearAppCache() を実行するか、Ctrl+Shift+D で手動クリア可能
 */
export function CacheClearer() {
    useEffect(() => {
        const isDevelopment = typeof window !== 'undefined' && (
            window.location.hostname === 'localhost' ||
            window.location.hostname.startsWith('192.168')
        );

        if (!isDevelopment) return;

        // グローバルでキャッシュクリア関数を公開
        (window as any).clearAppCache = async () => {
            try {
                console.log('🧹 キャッシュをクリア中...');

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

                // LocalStorage のクリア（オプション）
                // localStorage.clear();
                // console.log('✓ LocalStorage クリア完了');

                console.log('✓ 全てのキャッシュをクリアしました。ページをリロードしてください。');
                return true;
            } catch (error) {
                console.error('✗ キャッシュクリアエラー:', error);
                return false;
            }
        };

        // キーボードショートカット: Ctrl+Shift+D でキャッシュクリア
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                console.log('🔑 Ctrl+Shift+D が押下されました');
                (window as any).clearAppCache();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    return null;
}
