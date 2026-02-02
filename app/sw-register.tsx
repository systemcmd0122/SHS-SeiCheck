'use client';

import { useEffect } from 'react';

declare global {
    interface Window {
        deferredPrompt?: any;
    }
}

export function SwRegister() {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const registerServiceWorker = async () => {
            try {
                if ('serviceWorker' in navigator) {
                    const registration = await navigator.serviceWorker.register('/sw.js', {
                        scope: '/',
                    });
                    console.log('✓ Service Worker registered:', registration);

                    // 定期的にアップデートをチェック（開発環境では5秒ごと）
                    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168');
                    const checkInterval = isDevelopment ? 5000 : 60000; // 開発環境: 5秒, 本番環境: 60秒

                    const updateCheckInterval = setInterval(() => {
                        registration.update().then(() => {
                            console.log('✓ Service Worker update check completed');
                        }).catch((err) => {
                            console.error('✗ Service Worker update check failed:', err);
                        });
                    }, checkInterval);

                    // Service Workerが更新されたときの処理
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker?.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                console.log('✓ New Service Worker installed');

                                // チャンクキャッシュをクリアして新しいバージョンを強制
                                if ('caches' in window) {
                                    caches.delete('shs-sei-check-chunks').then(() => {
                                        console.log('✓ Chunk cache cleared');
                                    });
                                }

                                // ユーザーに更新完了を通知
                                window.dispatchEvent(new Event('sw-updated'));
                            }
                        });
                    });

                    // ページ離脱時にインターバルをクリア
                    return () => clearInterval(updateCheckInterval);
                }
            } catch (error) {
                console.error('✗ Service Worker registration failed:', error);
            }
        };

        const handleBeforeInstallPrompt = (e: Event) => {
            console.log('✓ beforeinstallprompt event fired');
            e.preventDefault();
            window.deferredPrompt = e;
        };

        const handleAppInstalled = () => {
            console.log('✓ PWA installed');
            window.deferredPrompt = null;
        };

        // ChunkLoadError時の自動リロード対策
        const handleError = (event: ErrorEvent) => {
            if (event.message?.includes('ChunkLoadError') || event.message?.includes('Failed to load chunk')) {
                console.error('✗ ChunkLoadError detected:', event.message);

                // キャッシュをクリアしてリロード
                if ('caches' in window) {
                    caches.keys().then((cacheNames) => {
                        Promise.all(
                            cacheNames.map(cacheName => {
                                if (cacheName.includes('shs-sei-check')) {
                                    console.log('✓ Clearing cache:', cacheName);
                                    return caches.delete(cacheName);
                                }
                            })
                        ).then(() => {
                            console.log('✓ All caches cleared, reloading...');
                            window.location.reload();
                        });
                    });
                } else {
                    window.location.reload();
                }
            }
        };

        // Service Worker登録
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', registerServiceWorker);
        } else {
            registerServiceWorker();
        }

        // イベントリスナーの設定
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);
        window.addEventListener('error', handleError);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
            window.removeEventListener('error', handleError);
        };
    }, []);

    return null;
}


