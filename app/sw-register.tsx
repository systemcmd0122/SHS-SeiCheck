'use client';

import { useEffect } from 'react';

// BeforeInstallPromptEvent の型定義
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface Window {
    deferredPrompt?: BeforeInstallPromptEvent | null;
  }
}

export function SwRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        console.log('[PWA] Service Worker registered');

        // 更新チェック
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // 新しいSWがインストールされた（バックグラウンドで更新）
              console.log('[PWA] New version available');
              window.dispatchEvent(new CustomEvent('sw-update-available'));
            }
          });
        });

        // 定期的に更新を確認 (30分ごと)
        const checkInterval = 30 * 60 * 1000;
        const intervalId = setInterval(() => {
          registration.update().catch(console.error);
        }, checkInterval);

        return () => clearInterval(intervalId);
      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    };

    // 読み込み完了後に登録
    if (document.readyState === 'complete') {
      registerServiceWorker();
    } else {
      window.addEventListener('load', registerServiceWorker);
    }

    // PWAインストールプロンプトの制御
    const handleBeforeInstallPrompt = (e: Event) => {
      // ブラウザのデフォルトバナーを抑制
      e.preventDefault();
      // イベントを保存して後で自前で呼べるようにする
      window.deferredPrompt = e as BeforeInstallPromptEvent;
      // カスタムUI表示用のイベントを発火
      window.dispatchEvent(new CustomEvent('pwa-install-available'));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // インストール済みの場合は window.deferredPrompt をクリア
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed');
      window.deferredPrompt = null;
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('load', registerServiceWorker);
    };
  }, []);

  return null;
}
