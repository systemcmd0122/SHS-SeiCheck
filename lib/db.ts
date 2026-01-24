import { db } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import type { Event, Response, Announcement, ResponseLog, EventTemplate, ReminderSetting } from "./types";

// コレクション参照
const eventsCollection = collection(db, "events");
const responsesCollection = collection(db, "responses");
const announcementsCollection = collection(db, "announcements");
const responseLogsCollection = collection(db, "responseLogs");
const templatesCollection = collection(db, "eventTemplates");
const remindersCollection = collection(db, "reminders");

// イベント関連の関数

/**
 * 新しい予定を作成
 */
export async function createEvent(event: Omit<Event, "id" | "createdAt">): Promise<string> {
  const eventRef = doc(eventsCollection);
  const eventId = eventRef.id;

  const eventData: Event = {
    ...event,
    id: eventId,
    createdAt: new Date().toISOString(),
  };

  await setDoc(eventRef, eventData);
  return eventId;
}

/**
 * すべての予定を取得
 */
export async function getAllEvents(): Promise<Event[]> {
  const querySnapshot = await getDocs(eventsCollection);

  const events: Event[] = [];
  querySnapshot.forEach((doc) => {
    events.push(doc.data() as Event);
  });

  // 日時の降順でソート（新しい順）
  return events.sort((a, b) =>
    new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
  );
}

/**
 * 特定の予定を取得
 */
export async function getEvent(eventId: string): Promise<Event | null> {
  const eventRef = doc(eventsCollection, eventId);
  const docSnap = await getDoc(eventRef);

  if (!docSnap.exists()) {
    return null;
  }

  return docSnap.data() as Event;
}

/**
 * 予定を更新
 */
export async function updateEvent(eventId: string, updates: Partial<Event>): Promise<void> {
  const eventRef = doc(eventsCollection, eventId);
  await setDoc(eventRef, updates, { merge: true });
}

/**
 * 予定を削除
 */
export async function deleteEvent(eventId: string): Promise<void> {
  const eventRef = doc(eventsCollection, eventId);
  await deleteDoc(eventRef);

  // 関連する回答も削除
  const responsesQuery = query(responsesCollection, where("eventId", "==", eventId));
  const querySnapshot = await getDocs(responsesQuery);

  const deletePromises: Promise<void>[] = [];
  querySnapshot.forEach((doc) => {
    deletePromises.push(deleteDoc(doc.ref));
  });

  await Promise.all(deletePromises);
}

// 回答関連の関数

/**
 * 回答を作成または更新
 */
export async function saveResponse(response: Response): Promise<void> {
  try {
    // eventId と memberId を組み合わせてユニークなIDを作成
    const responseId = `${response.eventId}_${response.memberId}`;
    const responseRef = doc(responsesCollection, responseId);

    const responseData: any = {
      eventId: response.eventId,
      memberId: response.memberId,
      status: response.status,
      updatedAt: new Date().toISOString(),
      updatedBy: response.updatedBy,
    };

    // reason が存在して空でない場合のみ追加
    if (response.reason && response.reason.trim()) {
      responseData.reason = response.reason.trim();
    }

    await setDoc(responseRef, responseData);
    console.log("✓ 回答を保存しました:", responseId);
  } catch (error) {
    console.error("✗ 回答保存エラー:", error);
    throw new Error(
      error instanceof Error
        ? `回答の保存に失敗しました: ${error.message}`
        : "回答の保存に失敗しました"
    );
  }
}

/**
 * 特定の予定に対する全回答を取得
 */
export async function getResponsesForEvent(eventId: string): Promise<Response[]> {
  const q = query(responsesCollection, where("eventId", "==", eventId));
  const querySnapshot = await getDocs(q);

  const responses: Response[] = [];
  querySnapshot.forEach((doc) => {
    responses.push(doc.data() as Response);
  });

  return responses;
}

/**
 * 特定のメンバーの全回答を取得
 */
export async function getResponsesForMember(memberId: string): Promise<Response[]> {
  const q = query(responsesCollection, where("memberId", "==", memberId));
  const querySnapshot = await getDocs(q);

  const responses: Response[] = [];
  querySnapshot.forEach((doc) => {
    responses.push(doc.data() as Response);
  });

  return responses;
}

/**
 * 特定の予定に対する特定のメンバーの回答を取得
 */
export async function getResponse(eventId: string, memberId: string): Promise<Response | null> {
  const responseId = `${eventId}_${memberId}`;
  const responseRef = doc(responsesCollection, responseId);
  const docSnap = await getDoc(responseRef);

  if (!docSnap.exists()) {
    return null;
  }

  return docSnap.data() as Response;
}

/**
 * すべての回答を取得
 */
export async function getAllResponses(): Promise<Response[]> {
  const querySnapshot = await getDocs(responsesCollection);

  const responses: Response[] = [];
  querySnapshot.forEach((doc) => {
    responses.push(doc.data() as Response);
  });

  return responses;
}

/**
 * 回答を削除
 */
export async function deleteResponse(eventId: string, memberId: string): Promise<void> {
  const responseId = `${eventId}_${memberId}`;
  const responseRef = doc(responsesCollection, responseId);
  await deleteDoc(responseRef);
}

// お知らせ関連の関数

/**
 * 新しいお知らせを作成
 */
export async function createAnnouncement(announcement: Omit<Announcement, "id" | "createdAt">): Promise<string> {
  const announcementRef = doc(announcementsCollection);
  const announcementId = announcementRef.id;

  const announcementData: Announcement = {
    ...announcement,
    id: announcementId,
    createdAt: new Date().toISOString(),
  };

  await setDoc(announcementRef, announcementData);
  return announcementId;
}

/**
 * すべてのお知らせを取得
 */
export async function getAllAnnouncements(): Promise<Announcement[]> {
  const querySnapshot = await getDocs(announcementsCollection);

  const announcements: Announcement[] = [];
  querySnapshot.forEach((doc) => {
    announcements.push(doc.data() as Announcement);
  });

  // 作成日時の降順でソート（新しい順）
  return announcements.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * 特定のお知らせを取得
 */
export async function getAnnouncement(announcementId: string): Promise<Announcement | null> {
  const announcementRef = doc(announcementsCollection, announcementId);
  const docSnap = await getDoc(announcementRef);

  if (!docSnap.exists()) {
    return null;
  }

  return docSnap.data() as Announcement;
}

/**
 * お知らせを更新
 */
export async function updateAnnouncement(announcementId: string, updates: Partial<Announcement>): Promise<void> {
  const announcementRef = doc(announcementsCollection, announcementId);
  await setDoc(announcementRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

/**
 * お知らせを削除
 */
export async function deleteAnnouncement(announcementId: string): Promise<void> {
  const announcementRef = doc(announcementsCollection, announcementId);
  await deleteDoc(announcementRef);
}

// 回答ログ関連の関数

/**
 * 回答ログを記録
 */
export async function saveResponseLog(log: Omit<ResponseLog, "id">): Promise<string> {
  const logRef = doc(responseLogsCollection);
  const logId = logRef.id;

  const logData: ResponseLog = {
    ...log,
    id: logId,
  };

  await setDoc(logRef, logData);
  return logId;
}

/**
 * 特定のメンバーの変更ログを取得
 */
export async function getResponseLogsForMember(memberId: string): Promise<ResponseLog[]> {
  const q = query(responseLogsCollection, where("memberId", "==", memberId));
  const querySnapshot = await getDocs(q);

  const logs: ResponseLog[] = [];
  querySnapshot.forEach((doc) => {
    logs.push(doc.data() as ResponseLog);
  });

  return logs.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
}

/**
 * 特定の予定の変更ログを取得
 */
export async function getResponseLogsForEvent(eventId: string): Promise<ResponseLog[]> {
  const q = query(responseLogsCollection, where("eventId", "==", eventId));
  const querySnapshot = await getDocs(q);

  const logs: ResponseLog[] = [];
  querySnapshot.forEach((doc) => {
    logs.push(doc.data() as ResponseLog);
  });

  return logs.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
}

// テンプレート関連の関数

/**
 * イベントテンプレートを作成
 */
export async function createEventTemplate(template: Omit<EventTemplate, "id" | "createdAt">): Promise<string> {
  const templateRef = doc(templatesCollection);
  const templateId = templateRef.id;

  const templateData: EventTemplate = {
    ...template,
    id: templateId,
    createdAt: new Date().toISOString(),
  };

  await setDoc(templateRef, templateData);
  return templateId;
}

/**
 * すべてのテンプレートを取得
 */
export async function getAllEventTemplates(): Promise<EventTemplate[]> {
  const querySnapshot = await getDocs(templatesCollection);

  const templates: EventTemplate[] = [];
  querySnapshot.forEach((doc) => {
    templates.push(doc.data() as EventTemplate);
  });

  return templates;
}

/**
 * テンプレートを削除
 */
export async function deleteEventTemplate(templateId: string): Promise<void> {
  const templateRef = doc(templatesCollection, templateId);
  await deleteDoc(templateRef);
}

// リマインダー関連の関数

/**
 * リマインダーを作成
 */
export async function createReminder(reminder: Omit<ReminderSetting, "id">): Promise<string> {
  const reminderRef = doc(remindersCollection);
  const reminderId = reminderRef.id;

  const reminderData: ReminderSetting = {
    ...reminder,
    id: reminderId,
  };

  await setDoc(reminderRef, reminderData);
  return reminderId;
}

/**
 * 未送信のリマインダーを取得
 */
export async function getUnsentReminders(): Promise<ReminderSetting[]> {
  const q = query(remindersCollection, where("sent", "==", false));
  const querySnapshot = await getDocs(q);

  const reminders: ReminderSetting[] = [];
  querySnapshot.forEach((doc) => {
    reminders.push(doc.data() as ReminderSetting);
  });

  return reminders;
}

/**
 * リマインダーを送信済みにマーク
 */
export async function markReminderAsSent(reminderId: string): Promise<void> {
  const reminderRef = doc(remindersCollection, reminderId);
  await setDoc(reminderRef, {
    sent: true,
    sentAt: new Date().toISOString(),
  }, { merge: true });
}