# PWA化完了ガイド

このドキュメントはSHS SeiCheckアプリの完全なPWA化について説明しています。

## ✅ 実装内容

### 1. **next-pwaプラグインの設定**
- `next.config.mjs`に`next-pwa`を統合
- Service Workerの自動生成と登録
- リソースの自動キャッシング機能

### 2. **manifest.json の最適化**
- アプリ名、説明、テーマカラーの設定
- アイコン設定（192x192, 512x512）
- スクリーンショット対応
- ショートカット機能（出欠管理へのクイックリンク）
- デスクトップ/モバイル対応

### 3. **Service Workerの高度な設定**
- **Google Fonts**: キャッシュ優先（1年間保持）
- **Firebase/API**: ネットワーク優先（3秒タイムアウト）
- **画像ファイル**: キャッシュ優先（30日間保持）
- **HTML**: ネットワーク優先（キャッシュフォールバック）
- **CSS/JavaScript**: キャッシュ優先

### 4. **PWAインストール機能**
- **Android**: ブラウザの自動インストールプロンプト
- **iOS**: ホーム画面への追加方法を表示
- 美しいUIでユーザーに通知

### 5. **メタデータ設定**
- Apple Web App対応
- ステータスバースタイル（黒透過）
- ビューポート最適化
- テーマカラー設定

### 6. **更新機能**
- 60秒ごとにアップデートをチェック
- バックグラウンドでの更新検出
- 自動リロード機能

## 📱 デバイス対応

### Android
- Google Play インストール プロンプト表示
- ホーム画面にアプリを追加可能
- スタンドアロンモードで起動

### iPhone/iPad
- Safari対応
- ホーム画面への追加サポート
- アプリアイコン表示

### デスクトップ
- Chrome/Edge: インストール可能
- Firefox: 制限あり

## 🚀 キャッシング戦略

| リソース | 戦略 | キャッシュ期間 | 最大エントリ数 |
|---------|------|--------------|--------------|
| Google Fonts | CacheFirst | 365日 | 4 |
| CDN | CacheFirst | 365日 | 32 |
| Firebase | NetworkFirst | 24時間 | 50 |
| 画像 | CacheFirst | 30日 | 60 |
| HTML | NetworkFirst | 24時間 | 10 |
| CSS/JS | CacheFirst | 30日 | 30 |

## 🔧 使用方法

### ビルド
```bash
npm run build
```

### 本番環境での起動
```bash
npm run start
```

### 開発環境
```bash
npm run dev
```

## 📝 注意事項

1. **HTTPS必須**: PWA機能はHTTPSで提供する必要があります
2. **マニフェスト**: `/public/manifest.json`を確認してください
3. **アイコン**: `/public/icon-192x192.png`と`/public/icon-512x512.png`が必要です
4. **Service Worker**: ブラウザ開発者ツールで確認可能（Application > Service Workers）

## 🛠️ ファイル構成

```
components/
├── pwa-install-prompt.tsx        # インストール通知UI
└── ...

hooks/
├── use-pwa-update.ts             # PWA更新チェック

lib/
├── pwa-config.ts                 # PWA設定
├── types.ts                       # PWA型定義
└── ...

public/
├── manifest.json                 # Webアプリマニフェスト
├── sw-custom.js                  # Service Worker設定
├── icon-192x192.png              # アイコン（小）
├── icon-512x512.png              # アイコン（大）
└── icon.jpg                       # 代替アイコン

next.config.mjs                    # next-pwa設定
```

## ✨ 主な機能

- ✅ オフラインでも基本的に動作
- ✅ アプリのようなUX
- ✅ インストール機能
- ✅ 自動更新検出
- ✅ バックグラウンド同期対応
- ✅ プッシュ通知対応
- ✅ Wake Lock API対応（画面オン状態を維持）

## 🌐 テスト方法

### Android
1. Chromeブラウザで https://your-domain.com を開く
2. アドレスバーの右側のメニューから「インストール」を選択
3. ホーム画面にアプリが追加されます

### iOS
1. Safariで https://your-domain.com を開く
2. 下部の共有ボタンをタップ
3. 「ホーム画面に追加」を選択
4. ホーム画面にアプリが追加されます

### デスクトップ（Chrome/Edge）
1. アドレスバーの右側のインストールアイコンをクリック
2. 確認して「インストール」

## 📚 参考資料

- [Progressive Web Apps](https://web.dev/progressive-web-apps/)
- [Web App Manifest](https://www.w3.org/TR/appmanifest/)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [next-pwa](https://github.com/shadowwalker/next-pwa)

## 🔒 セキュリティ

- Service Workerはブラウザが自動的に管理
- HTTPS接続で安全に配信
- キャッシュされたデータは定期的に更新
- Firebase認証で保護

---

**PWA化は完了しました！** 🎉

すべての設定は本番環境で即座に使用可能です。
