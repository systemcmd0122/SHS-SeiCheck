"use client";

import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // オンラインに戻ったことを少し表示してから消す
      setTimeout(() => setShowIndicator(false), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
    };

    setIsOnline(navigator.onLine);
    if (!navigator.onLine) setShowIndicator(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showIndicator) return null;

  return (
    <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-[100]`}>
      <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg shadow-sm border ${
        isOnline 
          ? "bg-emerald-50/90 border-emerald-500/20 text-emerald-900 dark:bg-emerald-950/90 dark:text-emerald-50" 
          : "bg-rose-50/90 border-rose-500/20 text-rose-900 dark:bg-rose-950/90 dark:text-rose-50"
      }`}>
        {isOnline ? (
          <>
            <div className="bg-emerald-500/10 p-1.5 rounded-full">
              <Wifi className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-sm font-bold">オンラインに復帰しました</span>
          </>
        ) : (
          <>
            <div className="bg-rose-500/10 p-1.5 rounded-full">
              <WifiOff className="w-4 h-4 text-rose-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-tight">オフライン状態です</span>
              <span className="text-[10px] opacity-70">一部の機能が制限される場合があります</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
