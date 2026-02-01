"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlanningChatPage } from "@/components/PlanningChatPage";
import { GoogleCalendarEvent } from "@/lib/google-calendar";

export default function ChatPage() {
    const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const loadEvents = async () => {
            try {
                const response = await fetch("/api/google-calendar/events");
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && Array.isArray(data.data)) {
                        setEvents(data.data);
                    }
                }
            } catch (error) {
                console.error("Failed to load events:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadEvents();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-gray-300 dark:border-slate-600 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">読み込み中...</p>
                </div>
            </div>
        );
    }

    return <PlanningChatPage events={events} />;
}