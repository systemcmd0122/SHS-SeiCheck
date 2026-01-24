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


