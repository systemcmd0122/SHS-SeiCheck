"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Image
          src="/offline.png"
          alt="オフライン"
          width={600}
          height={400}
          className="mx-auto mb-8"
          priority
        />
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          インターネット接続がありません
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          インターネットに接続して再度お試しください。
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          再読み込み
        </button>
      </div>
    </div>
  );
}