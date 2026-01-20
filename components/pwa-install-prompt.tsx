'use client';

import { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOSInstalled, setIsIOSInstalled] = useState(false);

    useEffect(() => {
        // iOS PWAのインストール確認
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isInStandaloneMode =
            ('standalone' in navigator && (navigator as any).standalone === true) ||
            window.matchMedia('(display-mode: standalone)').matches;

        if (isIOS && !isInStandaloneMode) {
            setIsIOSInstalled(true);
        }

        // Android PWA install prompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // App installed イベント
        const handleAppInstalled = () => {
            setDeferredPrompt(null);
            setShowPrompt(false);
            setIsIOSInstalled(false);
        };

        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setShowPrompt(false);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        setDeferredPrompt(null);
    };

    if (!showPrompt && !isIOSInstalled) return null;

    return (
        <>
            {/* Android PWA Install Prompt */}
            {showPrompt && deferredPrompt && (
                <div className="fixed bottom-4 left-4 right-4 z-50 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-4 animate-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                            <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-1">
                                SeiCheckをインストール
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                ホーム画面に追加して、いつでもアクセスできます
                            </p>
                        </div>
                        <Button
                            size="sm"
                            onClick={handleInstall}
                            className="gap-2 whitespace-nowrap"
                        >
                            <Download className="w-4 h-4" />
                            インストール
                        </Button>
                        <button
                            onClick={handleDismiss}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            aria-label="閉じる"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* iOS PWA Installation Instructions */}
            {isIOSInstalled && (
                <div className="fixed bottom-4 left-4 right-4 z-50 bg-blue-50 dark:bg-blue-900/30 rounded-lg shadow-lg border border-blue-200 dark:border-blue-700/50 p-4 animate-in slide-in-from-bottom-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-1">
                                SeiCheckをホーム画面に追加
                            </h3>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                                下部のメニューから「ホーム画面に追加」をタップしてください
                            </p>
                            <ol className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                                <li>下部メニューの共有ボタンをタップ</li>
                                <li>「ホーム画面に追加」を選択</li>
                                <li>「追加」をタップ</li>
                            </ol>
                        </div>
                        <button
                            onClick={() => setIsIOSInstalled(false)}
                            className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 flex-shrink-0"
                            aria-label="閉じる"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
