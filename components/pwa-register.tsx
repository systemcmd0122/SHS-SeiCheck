'use client';

import { useEffect } from 'react';

export function PWARegister() {
    useEffect(() => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
            return;
        }

        const registerServiceWorker = async () => {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/',
                    type: 'classic',
                });

                console.log('✅ Service Worker registered successfully:', registration);

                // 更新確認
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'activated') {
                                console.log('✅ Service Worker updated');
                                // ユーザーに通知してリロードを促す
                                window.location.reload();
                            }
                        });
                    }
                });

                // 定期的に更新をチェック
                setInterval(() => {
                    registration.update();
                }, 60000); // 60秒ごと
            } catch (error) {
                console.error('❌ Service Worker registration failed:', error);
            }
        };

        // DOMContentLoadedまたはloadイベントで登録
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', registerServiceWorker);
        } else {
            // すでにDOM読み込み完了
            registerServiceWorker();
        }

        return () => {
            document.removeEventListener('DOMContentLoaded', registerServiceWorker);
        };
    }, []);

    return null;
}
