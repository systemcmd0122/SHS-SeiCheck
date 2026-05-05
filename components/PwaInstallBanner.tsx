'use client';

import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

import { Share, PlusSquare } from 'lucide-react';

export function PwaInstallBanner() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkPwaStatus = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                        ('standalone' in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone === true);
      setIsStandalone(standalone);

      const userAgent = window.navigator.userAgent.toLowerCase();
      const ios = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(ios);

      // すでにインストール済みの場合は表示しない
      if (standalone) {
        setShow(false);
        return;
      }

      // iOSの場合は手動で表示
      if (ios) {
        // セッション中に一度だけ出すなどの制御が必要ならここで
        const hasSeenPrompt = sessionStorage.getItem('pwa-ios-prompt-seen');
        if (!hasSeenPrompt) {
          setShow(true);
        }
      }
    };

    const handleInstallAvailable = () => {
      console.log('[PWA] Install available event received');
      if (window.matchMedia('(display-mode: standalone)').matches) return;
      setShow(true);
    };

    window.addEventListener('pwa-install-available', handleInstallAvailable);
    checkPwaStatus();

    if (window.deferredPrompt) {
        setTimeout(() => setShow(true), 0);
    }

    return () => window.removeEventListener('pwa-install-available', handleInstallAvailable);
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
        // iOSの場合は閉じるときにフラグを立てる
        setShow(false);
        sessionStorage.setItem('pwa-ios-prompt-seen', 'true');
        return;
    }

    const promptEvent = window.deferredPrompt;
    if (!promptEvent) return;

    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    console.log(`[PWA] User response to install prompt: ${outcome}`);

    window.deferredPrompt = null;
    setShow(false);
  };

  const handleClose = () => {
    setShow(false);
    if (isIOS) {
      sessionStorage.setItem('pwa-ios-prompt-seen', 'true');
    }
  };

  if (!show || isStandalone) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-4 md:right-auto md:w-80 z-[110]">
      <div className="bg-card border border-border p-4 rounded-lg shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">アプリをインストール</p>
              <p className="text-[11px] text-muted-foreground leading-tight">ホーム画面からすぐ起動できます</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-muted rounded-lg active:opacity-80"
          >
            <X className="w-4 h-4 opacity-50" />
          </button>
        </div>

        {isIOS ? (
          <div className="bg-muted/50 p-3 rounded-lg space-y-2">
            <p className="text-[11px] font-medium leading-relaxed">
              iPhoneでインストールするには：
            </p>
            <ol className="text-[11px] space-y-1 text-muted-foreground">
              <li className="flex items-center gap-2">
                1. 下部の <Share className="w-3 h-3" /> (共有) ボタンをタップ
              </li>
              <li className="flex items-center gap-2">
                2. <PlusSquare className="w-3 h-3" /> 「ホーム画面に追加」を選択
              </li>
            </ol>
            <button
              onClick={handleInstall}
              className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-bold text-xs hover:opacity-90 mt-2"
            >
              了解
            </button>
          </div>
        ) : (
          <button
            onClick={handleInstall}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-bold text-xs hover:opacity-90 active:opacity-80 shadow-sm"
          >
            インストールする
          </button>
        )}
      </div>
    </div>
  );
}
