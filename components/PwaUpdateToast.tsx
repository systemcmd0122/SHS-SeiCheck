'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';

export function PwaUpdateToast() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      console.log('[PWA] Update available event received');
      setShow(true);
    };

    window.addEventListener('sw-update-available', handleUpdate);
    return () => window.removeEventListener('sw-update-available', handleUpdate);
  }, []);

  const handleReload = () => {
    setShow(false);
    window.location.reload();
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-24 right-4 left-4 md:left-auto md:w-96 z-[110]">
      <div className="bg-primary text-primary-foreground p-5 rounded-lg shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-2.5 rounded-lg">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-lg leading-tight">最新バージョンが利用可能</p>
            <p className="text-sm opacity-80 mt-0.5">アップデートして新機能を利用</p>
          </div>
        </div>
        <div className="flex gap-2">
           <button
            onClick={handleReload}
            className="bg-white text-primary px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-white/90 active:opacity-80 shadow-sm"
          >
            更新
          </button>
          <button
            onClick={() => setShow(false)}
            className="p-2.5 hover:bg-white/10 rounded-lg active:opacity-80"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
