# ChunkLoadError とキャッシュ問題の解決対策

## 概要
Next.js 16.1.4（Turbopack）でのRuntime ChunkLoadErrorとデプロイ後のキャッシュ問題に対する総合的な対策を実装しました。

## 実装した対策

### 1. Service Worker（`public/sw.js`）の改善
- **チャンクキャッシュの分離**: `CHUNK_CACHE`を独立させて管理
- **エラーハンドリング**: ネットワークエラー時のキャッシュフォールバック
- **チャンク専用ロジック**: `/_next/static/chunks/`に特別な処理を追加
- **整合性チェック**: キャッシュされたレスポンスのステータス確認

### 2. Service Worker登録（`app/sw-register.tsx`）の強化
- **チャンクキャッシュのクリア**: 更新時に古いチャンクキャッシュを自動削除
- **更新イベント検出**: `updatefound`イベントで新しいSWを監視
- **イベント発行**: `sw-updated`イベントでクライアントに通知

### 3. キャッシュマネージャー（`app/cache-clearer.tsx`）の拡張
#### 開発環境
- **手動クリア機能**：`clearAppCache()`をグローバルで提供
- **キーボードショートカット**：Ctrl+Shift+Dでキャッシュクリア

#### 本番環境
- **ChunkLoadError自動検出**：エラーメッセージを監視
- **自動復旧**：キャッシュクリアと自動リロード
- **Promiseエラー処理**：未処理のPromise拒否を検出
- **定期的な整合性チェック**：5分ごとにキャッシュ検証
- **無効なキャッシュの削除**：ステータス200以外のキャッシュを削除

### 4. Next.js設定（`next.config.ts`）の最適化
- **チャンクファイルのキャッシュヘッダー**：immutable設定（31536000秒）
- **静的ファイルの長期キャッシュ**：`/_next/static/`配下のファイル
- **Service Workerのキャッシュ無効化**：`max-age=0, must-revalidate`

## キャッシュ戦略

```
Service Worker Cache Strategy:
├── HTML Pages (navigate)
│   └── ネットワーク優先 → キャッシュフォールバック
├── API Requests (/api/*)
│   └── ネットワーク優先 → キャッシュフォールバック
├── JavaScript & CSS
│   ├── 開発環境: ネットワーク（no-store）
│   └── 本番環境: ネットワーク優先 → キャッシュフォールバック
│       （チャンク用）shs-sei-check-chunksに保存
└── Images
    └── キャッシュ優先 → ネットワークフォールバック
```

## 使用方法

### キャッシュのリセット（開発環境）
```javascript
// ブラウザコンソールで実行
clearAppCache()

// または
Ctrl+Shift+D
```

### 本番環境での動作
- ChunkLoadErrorが発生すると自動的にキャッシュをクリアしてページをリロード
- ユーザーは特に何もする必要がなし

## デプロイ時の推奨事項

1. **Service Workerの更新**
   - Service Workerは最初にDeploy
   - その後アプリケーションファイルをDeploy

2. **キャッシュバージョンの管理**
   ```javascript
   // 大きな変更の場合はバージョン番号を更新
   const CACHE_NAME = 'shs-sei-check-v2'; // v1 → v2
   ```

3. **動作確認**
   - 開発者ツール → Application → Cache Storageでキャッシュを確認
   - NetworkタブでCache-Controlヘッダーを確認

## トラブルシューティング

### ChunkLoadErrorが頻繁に発生する場合
```javascript
// コンソールから実行して全キャッシュをクリア
clearAppCache()

// その後、ハードリロード (Ctrl+Shift+R または Cmd+Shift+R)
```

### 特定のキャッシュをクリアしたい場合
```javascript
// コンソールから実行
if ('caches' in window) {
    caches.delete('shs-sei-check-chunks').then(() => {
        console.log('Chunk cache cleared');
        window.location.reload();
    });
}
```

### ローカル開発でキャッシュが邪魔する場合
Service Worker登録時に開発環境検出で自動的にno-store設定が適用されるため、
キャッシュ問題は原則として発生しません。

## ログ出力

コンソールに以下のようなログが出力されます：

```
Service Worker registered
Service Worker update check completed
New Service Worker installed
Cache integrity check passed
ChunkLoadError detected
All caches cleared
```

## 参考文献

- [Service Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)
- [Cache-Control HTTP Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
