import { initializeApp, getApps } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// バリデーション: 必須の環境変数をチェック
const requiredConfig = ["apiKey", "projectId", "appId"];
for (const key of requiredConfig) {
  if (!firebaseConfig[key as keyof typeof firebaseConfig]) {
    console.error(`❌ Firebase環境変数が設定されていません: NEXT_PUBLIC_FIREBASE_${key.toUpperCase()}`);
  }
}

// アプリが既に初期化されているかチェック
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Firestoreのインスタンスを取得
export const db: Firestore = getFirestore(app);

export default app;