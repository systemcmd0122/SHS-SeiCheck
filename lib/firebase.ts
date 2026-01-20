import { initializeApp, getApps } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  doc, 
  deleteDoc, 
  writeBatch, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore";
import { Event, Response } from "./types";

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

// Initialize Firebase (シングルトンパターン)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// リアルタイムでイベントを取得する関数
export const getEventsRealtime = (callback: (events: Event[]) => void) => {
  const eventsCollection = collection(db, 'events');
  return onSnapshot(eventsCollection, (snapshot) => {
    const events = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // FirestoreのTimestampをDateに変換
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      } as Event;
    });
    callback(events);
  });
};

// リアルタイムで回答を取得する関数
export const getResponsesRealtime = (callback: (responses: Response[]) => void) => {
  const responsesCollection = collection(db, 'responses');
  return onSnapshot(responsesCollection, (snapshot) => {
    const responses = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // FirestoreのTimestampをDateに変換
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
        history: data.history?.map((h: any) => ({
          ...h,
          changedAt: h.changedAt?.toDate ? h.changedAt.toDate() : new Date(h.changedAt),
        })) || [],
      } as Response;
    });
    callback(responses);
  });
};

// イベントと関連する回答を削除する関数
export const deleteEventAndResponses = async (eventId: string) => {
  const batch = writeBatch(db);

  // 関連する回答を検索
  const responsesQuery = query(collection(db, 'responses'), where('eventId', '==', eventId));
  const responsesSnapshot = await getDocs(responsesQuery);
  responsesSnapshot.forEach(doc => {
    batch.delete(doc.ref);
  });

  // イベント本体を削除
  const eventDoc = doc(db, 'events', eventId);
  batch.delete(eventDoc);

  await batch.commit();
};


export { db };