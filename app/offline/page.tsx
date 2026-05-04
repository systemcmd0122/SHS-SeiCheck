'use client';

import React from 'react';
import { WifiOff, RefreshCw, ArrowLeft } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] p-6 text-center bg-background">
      <div className="p-6 rounded-full bg-muted mb-6">
        <WifiOff className="w-12 h-12 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold mb-2 tracking-tight">オフラインです</h1>
      <p className="text-sm text-muted-foreground mb-8 max-w-xs leading-relaxed">
        現在インターネットに接続されていないか、リクエストされたページがキャッシュされていません。
        接続を確認してから再試行してください。
      </p>
      
      <div className="grid gap-3 w-full max-w-xs">
        <button
          onClick={() => window.location.reload()}
          className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-primary text-primary-foreground rounded-lg font-bold shadow-sm transition-opacity hover:opacity-90"
        >
          <RefreshCw className="w-4 h-4" />
          再読み込み
        </button>
        
        <button
          onClick={() => window.history.back()}
          className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-secondary text-secondary-foreground border border-border rounded-lg font-bold transition-colors hover:bg-muted"
        >
          <ArrowLeft className="w-4 h-4" />
          前のページに戻る
        </button>
      </div>
      
      <div className="mt-12 text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-50">
        SHS SeiCheck PWA
      </div>
    </div>
  );
}
