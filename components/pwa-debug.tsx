'use client';

import { useEffect, useState } from 'react';

export function PWADebug() {
    const [info, setInfo] = useState<any>({});
    const [deferredPrompt, setDeferredPrompt] = useState(false);

    useEffect(() => {
        const diagInfo: any = {
            timestamp: new Date().toLocaleString('ja-JP'),
            url: typeof window !== 'undefined' ? window.location.href : 'N/A',
            protocol: typeof window !== 'undefined' ? window.location.protocol : 'N/A',
            hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
            serviceWorker: 'serviceWorker' in navigator,
            manifestLink: document.querySelector('link[rel="manifest"]') ? 'あり' : 'なし',
            appleWebApp: document.querySelector('meta[name="apple-mobile-web-app-capable"]') ? 'あり' : 'なし',
        };

        setInfo(diagInfo);
        console.log('PWA診断:', diagInfo);

        // beforeinstallpromptイベントのリスナー
        const handleBeforeInstall = (e: Event) => {
            console.log('beforeinstallpromptイベント発火！');
            setDeferredPrompt(true);
            e.preventDefault();
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        };
    }, []);

    if (process.env.NODE_ENV === 'production') {
        return null;
    }

    return (
        <div className="fixed bottom-0 right-0 p-4 bg-black text-white text-xs max-w-sm max-h-64 overflow-auto font-mono z-40 rounded-t-lg border-t border-l border-gray-700">
            <div className="font-bold mb-2">PWA診断</div>
            <div className="space-y-1">
                <div>URL: {info.url}</div>
                <div>Protocol: {info.protocol}</div>
                <div>Hostname: {info.hostname}</div>
                <div>Service Worker: {info.serviceWorker ? '✓' : '✗'}</div>
                <div>Manifest: {info.manifestLink}</div>
                <div>Apple Web App: {info.appleWebApp}</div>
                <div className="mt-2 pt-2 border-t border-gray-700">
                    beforeinstallprompt: {deferredPrompt ? '✓ 発火' : '✗ 未発火'}
                </div>
            </div>
        </div>
    );
}
