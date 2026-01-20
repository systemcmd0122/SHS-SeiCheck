'use client';

import { useEffect } from 'react';

export function PWARegister() {
    useEffect(() => {
        if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
            const registerServiceWorker = async () => {
                try {
                    await navigator.serviceWorker.register('/sw.js', {
                        scope: '/',
                    });
                    console.log('✅ Service Worker registered successfully');
                } catch (error) {
                    console.error('❌ Service Worker registration failed:', error);
                }
            };

            window.addEventListener('load', registerServiceWorker);

            return () => {
                window.removeEventListener('load', registerServiceWorker);
            };
        }
    }, []);

    return null;
}
