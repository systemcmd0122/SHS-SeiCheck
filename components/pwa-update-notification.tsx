'use client';

import { useEffect, useState } from 'react';
import { Toaster, toast } from 'sonner';

export function PWAUpdateNotification() {
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
    const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then(reg => {
                if (reg) {
                    setRegistration(reg);
                }
            });
        }
    }, []);

    useEffect(() => {
        if (!registration) return;

        const interval = setInterval(() => {
            registration.update();
        }, 60 * 60 * 1000); // 1時間ごとに更新を確認

        const handleUpdate = () => {
            const newWorker = registration.installing;
            if (newWorker) {
                newWorker.onstatechange = () => {
                    if (newWorker.state === 'installed') {
                        if (navigator.serviceWorker.controller) {
                            // 新しいバージョンがインストールされたが、まだアクティブではない
                            setIsUpdateAvailable(true);
                        }
                    }
                };
            }
        };

        registration.addEventListener('updatefound', handleUpdate);

        // controllerchangeは新しいService Workerがアクティブになったときに発火
        const handleControllerChange = () => {
            window.location.reload();
        };
        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

        return () => {
            clearInterval(interval);
            registration.removeEventListener('updatefound', handleUpdate);
            navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
        };

    }, [registration]);

    useEffect(() => {
        if (isUpdateAvailable) {
            toast.info('新しいバージョンが利用可能です。', {
                action: {
                    label: '更新',
                    onClick: () => {
                        if (registration && registration.waiting) {
                            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                        }
                    },
                },
                duration: Infinity, // ユーザーが操作するまで閉じない
                dismissible: false,
            });
        }
    }, [isUpdateAvailable, registration]);


    return <Toaster position="bottom-center" />;
}
