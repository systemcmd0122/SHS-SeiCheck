'use client';

import { useEffect, useRef } from 'react';

interface UpdateEvent extends Event {
    registration: ServiceWorkerRegistration;
}

export function usePWAUpdate() {
    const updateCheckRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Service Workerの更新を確認（60秒ごと）
        const checkForUpdates = async () => {
            if ('serviceWorker' in navigator) {
                try {
                    const registration = await navigator.serviceWorker.ready;
                    await registration.update();
                } catch (error) {
                    console.error('Failed to check for updates:', error);
                }
            }
        };

        // 定期的に更新を確認
        checkForUpdates();
        updateCheckRef.current = setInterval(checkForUpdates, 60000); // 60秒ごと

        // Service Worker更新時の処理
        const handleServiceWorkerUpdate = () => {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    window.location.reload();
                });
            }
        };

        handleServiceWorkerUpdate();

        return () => {
            if (updateCheckRef.current) {
                clearInterval(updateCheckRef.current);
            }
        };
    }, []);
}
