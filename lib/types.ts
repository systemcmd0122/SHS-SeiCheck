// メンバーの型定義
export interface Member {
  id: string;
  name: string;
  committee: string;
}

// 予定の種類
export type EventType = "定例会" | "行事準備" | "本番" | "臨時集会" | "その他";

// 予定の種類の定数配列
export const EVENT_TYPES: EventType[] = ["定例会", "行事準備", "本番", "臨時集会", "その他"];

// 回答状態
export type ResponseStatus = "参加" | "遅れる" | "不参加" | "未回答";

// 回答状態の定数配列
export const RESPONSE_STATUSES: ResponseStatus[] = ["参加", "遅れる", "不参加", "未回答"];

// 予定の型定義
export interface Event {
  id: string;
  title: string;
  type: EventType;
  dateTime: string; // ISO 8601形式
  deadline: string; // ISO 8601形式
  createdAt: string;
  createdBy: string;
  description?: string;
}

// 回答の型定義
export interface Response {
  eventId: string;
  memberId: string;
  status: ResponseStatus;
  reason?: string; // 欠席理由
  updatedAt: string;
  updatedBy: string; // 回答者のID
}

// 予定と回答をまとめた型
export interface EventWithResponses {
  event: Event;
  responses: Record<string, Response>; // memberId -> Response
  unansweredMembers: Member[];
  isOverdue: boolean;
}

// 出欠状況の集計
export interface AttendanceSummary {
  eventId: string;
  eventTitle: string;
  eventType: EventType;
  eventDateTime: string;
  attended: number;
  absent: number;
  undecided: number;
  unanswered: number;
  total: number;
}

// よく使う理由のプリセット
export const REASON_PRESETS: Record<Exclude<ResponseStatus, "参加" | "未回答">, string[]> = {
  遅れる: ["授業が延長", "委員会活動", "部活動", "その他の用事"],
  不参加: ["体調不良", "家庭の事情", "他の予定", "授業・試験", "部活動"],
};

// お知らせの型定義
export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: "通常" | "重要" | "緊急";
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  isTeacher?: boolean; // 先生が投稿したかどうか
}

// お知らせの優先度
export type AnnouncementPriority = "通常" | "重要" | "緊急";

// お知らせの優先度の定数配列
export const ANNOUNCEMENT_PRIORITIES: AnnouncementPriority[] = ["通常", "重要", "緊急"];

// 回答ログの型定義
export interface ResponseLog {
  id: string;
  eventId: string;
  memberId: string;
  previousStatus: ResponseStatus | null;
  newStatus: ResponseStatus;
  changedAt: string;
  changedBy: string;
  previousReason?: string;
  newReason?: string;
}

// 共有リンク用の型定義
export interface SharedResponse {
  id: string;
  eventId: string;
  shareToken: string; // 共有トークン
  createdAt: string;
  createdBy: string;
  expiresAt?: string; // 有効期限（オプション）
}