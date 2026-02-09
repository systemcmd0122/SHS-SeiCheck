'use client';

import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export function PwaInstallBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleInstallAvailable = () => {
      console.log('[PWA] Install available event received');
      // すでにインストール済みの場合は表示しない（ブラウザ側で制御されるが念のため）
      if (window.matchMedia('(display-mode: standalone)').matches) return;
      setShow(true);
    };

    window.addEventListener('pwa-install-available', handleInstallAvailable);
    
    // 初期チェック
    if (window.deferredPrompt) {
        setShow(true);
    }

    return () => window.removeEventListener('pwa-install-available', handleInstallAvailable);
  }, []);

  const handleInstall = async () => {
    const promptEvent = window.deferredPrompt;
    if (!promptEvent) return;

    // プロンプトを表示
    promptEvent.prompt();

    // ユーザーの選択を待つ
    const { outcome } = await promptEvent.userChoice;
    console.log(`[PWA] User response to install prompt: ${outcome}`);

    // プロンプトは一度しか使えないためクリア
    window.deferredPrompt = null;
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-4 md:right-auto md:w-80 z-[110] animate-in slide-in-from-left-8 fade-in duration-500">
      <div className="bg-card border border-border p-4 rounded-2xl shadow-premium flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-xl">
            <Download className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">アプリをインストール</p>
            <p className="text-[11px] text-muted-foreground leading-tight">ホーム画面からすぐ起動できます</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={handleInstall}
            className="bg-primary text-primary-foreground px-3 py-1.5 rounded-xl font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-sm"
          >
            追加
          </button>
          <button
            onClick={() => setShow(false)}
            className="p-1.5 hover:bg-muted rounded-lg active:scale-95 transition-all"
          >
            <X className="w-4 h-4 opacity-50" />
          </button>
        </div>
      </div>
    </div>
  );
}
