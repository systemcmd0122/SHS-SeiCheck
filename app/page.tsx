"use client";

import { useState, useEffect } from "react";
import { MemberSelectionPage } from "@/components/MemberSelectionPage";

interface Event {
  id: string;
  title: string;
  type: string;
  dateTime?: string;
  startTime?: string;
  [key: string]: unknown;
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isEventsLoading, setIsEventsLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      setIsEventsLoading(true);
      try {
        // Firestoreのイベントを取得
        const dbResponse = await fetch("/api/events");
        let dbEvents: Event[] = [];
        if (dbResponse.ok) {
          const dbData = await dbResponse.json();
          if (dbData.success && Array.isArray(dbData.data)) {
            dbEvents = dbData.data;
          }
        }

        // Google Calendarのイベントを取得
        const gcResponse = await fetch("/api/google-calendar/events");
        let gcEvents: Event[] = [];
        if (gcResponse.ok) {
          const gcData = await gcResponse.json();
          if (gcData.success && Array.isArray(gcData.data)) {
            gcEvents = gcData.data.map((e: any) => ({
              ...e,
              type: "google-calendar",
            }));
          }
        }

        // 両方をマージ
        setEvents([...dbEvents, ...gcEvents]);
      } catch (error) {
        console.warn("Failed to load events:", error);
        // APIが存在しない場合は空配列で続行
      } finally {
        setIsEventsLoading(false);
      }
    };

    loadEvents();
  }, []);

  return (
    <MemberSelectionPage
      title="生徒会出欠管理"
      description="メンバー選択してログイン"
      buttonLabel="ログイン"
      showAdminButton={true}
      events={events}
      isEventsLoading={isEventsLoading}
    />
  );
}
