This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 機能

### 1. Google Classroomへのカレンダー共有
Google Calendarに登録した予定を、クリップボードにコピーしてGoogle Classroomに貼り付けられます。

**使い方：**
1. カレンダー表示で予定がある日付をクリック
2. 詳細ダイアログで「Classroomに共有」ボタンをクリック
3. 「クリップボードにコピー」をクリック
4. Google Classroomを開いて投稿欄に貼り付け
5. 送信

### 2. Gemini AIによる予定計画アシスタント
Google Gemini 3 Flashがカレンダー予定をもとに、スケジュール相談をチャット形式でサポートします。

**使い方：**
1. カレンダー右上のアイコンをクリック
2. チャットウィンドウで予定について質問
3. AIが登録されている予定をもとにアドバイスを提供

**できること：**
- 予定の分析と提案
- 空き時間の提案
- イベント企画のブレインストーミング
- スケジュール調整のアドバイス
- 複雑なスケジュール推論

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## 環境変数設定

### Google Classroom 共有機能について

この機能は **API不要** です。クリップボードコピー機能のみを使用するため、環境変数の設定は不要です。

### Google Generative AI (Gemini 3 Flash) の設定

予定計画アシスタント機能を使用するには、Gemini APIキーが必要です。

**使用モデル:** Gemini 3 Flash
- 最新の高速・高性能モデル
- リアルタイムレスポンス対応
- 複雑な推論に対応

#### セットアップ手順

1. **Google AIStudioにアクセス**
   - [Google AI Studio](https://aistudio.google.com) を開く
   - Googleアカウントでログイン

2. **APIキーを生成**
   - 「Get API Key」をクリック
   - 「Create API Key in New Project」をクリック
   - APIキーをコピー

3. **`.env.local` に設定**
   ```env
   NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_KEY=your-api-key-here
   ```
   - 生成したAPIキーを `your-api-key-here` の部分に貼り付け

4. **開発サーバーを再起動**
   ```bash
   npm run dev
   ```

#### トラブルシューティング

**エラー: "NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_KEY が設定されていません"**
- `.env.local` にAPIキーが正しく設定されているか確認
- 開発サーバーを再起動してください

**エラー: "チャット中にエラーが発生しました"**
- APIキーが有効であるか確認
- Google AIStudioで利用可能な状態か確認

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
