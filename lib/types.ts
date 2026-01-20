export interface Member {
  id: string;
  name: string;
  committee: string;
}

export type EventType = "定例会" | "行事準備" | "本番" | "臨時集会" | "その他";

export interface Event {
  id: string;
  name: string;
  date: string;
  type: EventType;
  deadline?: string;
  createdAt: Date;
}

export interface Response {
  id: string;
  memberId: string;
  memberName: string;
  eventId: string;
  status: "参加" | "遅れる" | "不参加" | null;
  reason?: string;
  updatedAt: Date;
  history?: ResponseHistory[];
}

export interface ResponseHistory {
  previousStatus: "参加" | "遅れる" | "不参加" | null;
  newStatus: "参加" | "遅れる" | "不参加" | null;
  changedAt: Date;
}

// PWA関連の型定義
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
  }>;
}

export interface NavigatorWithWakeLock extends Navigator {
  wakeLock?: {
    request(type: 'screen'): Promise<WakeLockSentinel>;
  };
}

export interface WakeLockSentinel {
  release(): Promise<void>;
  addEventListener(type: 'release', listener: () => void): void;
  removeEventListener(type: 'release', listener: () => void): void;
}

export const MEMBERS: Member[] = [
  { id: "1", name: "岩田 康孝", committee: "HR委員会" },
  { id: "2", name: "黒木 梨帆", committee: "交通委員会" },
  { id: "3", name: "長谷川 洸武", committee: "広報委員会" },
  { id: "4", name: "遠竹 美優", committee: "学習委員会" },
  { id: "5", name: "猪口 ゆいか", committee: "風紀委員会" },
  { id: "6", name: "財津 幸希", committee: "体育委員会" },
  { id: "7", name: "河野 直彪", committee: "美化委員会" },
  { id: "8", name: "是澤 美莉亜", committee: "保健委員会" },
  { id: "9", name: "山本 泰綺", committee: "図書委員会" },
  { id: "10", name: "齋藤 徠夢", committee: "文化委員会" },
  { id: "11", name: "徳田 太祐", committee: "生徒会長" },
  { id: "12", name: "井内 翔太", committee: "生徒会副会長" },
];