'use client';

import React from 'react';
import { WifiOff, RefreshCw, ArrowLeft } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] p-6 text-center bg-background">
      <div className="p-6 rounded-full bg-muted mb-6 animate-pulse">
        <WifiOff className="w-12 h-12 text-muted-foreground" />
      </div>
      <h1 className="text-3xl font-bold mb-3 tracking-tight">オフラインです</h1>
      <p className="text-muted-foreground mb-10 max-w-md leading-relaxed">
        現在インターネットに接続されていないか、リクエストされたページがキャッシュされていません。
        接続を確認してから再試行してください。
      </p>
      
      <div className="grid gap-4 w-full max-w-xs">
        <button
          onClick={() => window.location.reload()}
          className="flex items-center justify-center gap-2 w-full py-4 px-6 bg-primary text-primary-foreground rounded-2xl font-semibold shadow-premium active:scale-98 transition-all hover:opacity-90"
        >
          <RefreshCw className="w-5 h-5" />
          再読み込み
        </button>
        
        <button
          onClick={() => window.history.back()}
          className="flex items-center justify-center gap-2 w-full py-4 px-6 bg-secondary text-secondary-foreground border border-border rounded-2xl font-semibold active:scale-98 transition-all hover:bg-muted"
        >
          <ArrowLeft className="w-5 h-5" />
          前のページに戻る
        </button>
      </div>
      
      <div className="mt-12 text-sm text-muted-foreground/60 font-medium">
        SHS SeiCheck PWA
      </div>
    </div>
  );
}
