"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlanningChatPage } from "@/components/PlanningChatPage";
import { GoogleCalendarEvent } from "@/lib/google-calendar";
import { LoadingScreen } from "@/components/Loading";

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
            <div>
                <LoadingScreen />
            </div>
        );
    }

    return <PlanningChatPage events={events} />;
}