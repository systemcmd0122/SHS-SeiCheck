"use client";

import { useState, useEffect } from "react";
import { MemberSelectionPage } from "@/components/MemberSelectionPage";

export default function Home() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await fetch("/api/google-calendar/events");
        if (!response.ok) {
          console.warn("Failed to load events: API not available");
          return;
        }
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setEvents(data.data);
        }
      } catch (error) {
        console.warn("Failed to load events:", error);
        // APIが存在しない場合は空配列で続行
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
    />
  );
}
