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

                    setInterval(() => {
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
                                console.log('✓ New Service Worker installed, page reload recommended');
                                // ユーザーに更新を促すメッセージを表示する場合はここで処理
                            }
                        });
                    });
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

        // Service Worker登録
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', registerServiceWorker);
        } else {
            registerServiceWorker();
        }

        // インストールプロンプトのリッスン
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    return null;
}


