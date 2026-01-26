import { initializeApp, getApps } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDMFSmAZAURnGHZW3-zWNK7-rzNLKtwb0k",
  authDomain: "shs-seicheck.firebaseapp.com",
  databaseURL: "https://shs-seicheck-default-rtdb.firebaseio.com",
  projectId: "shs-seicheck",
  storageBucket: "shs-seicheck.firebasestorage.app",
  messagingSenderId: "289184195014",
  appId: "1:289184195014:web:0059b17acb095d914c92c7",
  measurementId: "G-CENQ1SBT64"
};

// アプリが既に初期化されているかチェック
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Firestoreのインスタンスを取得
export const db: Firestore = getFirestore(app);

export default app;