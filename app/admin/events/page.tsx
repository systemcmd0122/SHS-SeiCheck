"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";

interface TempEvent {
    id: string;
    title: string;
}

export default function AdminEventsPage() {
    const [events, setEvents] = useState<TempEvent[]>([]);
    const [title, setTitle] = useState("");

    useEffect(() => {
        const fetchEvents = async () => {
            const res = await fetch("/api/temp-events", { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.data)) {
                    setEvents(data.data);
                }
            }
        };
        fetchEvents();
        const interval = setInterval(fetchEvents, 30000);
        return () => clearInterval(interval);
    }, []);

    const addEvent = async () => {
        if (!title.trim()) return;
        const res = await fetch("/api/temp-events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title,
                dateTime: new Date().toISOString(),
                type: "臨時"
            }),
        });
        if (res.ok) {
            setTitle("");
            const data = await res.json();
            setEvents((prev) => [...prev, data.data]);
        }
    };

    const removeEvent = async (id: string) => {
        await fetch("/api/temp-events", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });
        setEvents((prev) => prev.filter((e) => e.id !== id));
    };
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-4xl font-bold mb-8">今日することリスト</h1>

                {/* 入力フォーム */}
                <Card className="border-0 bg-slate-700/50 backdrop-blur mb-8">
                    <CardHeader>
                        <CardTitle>新規追加</CardTitle>
                    </CardHeader>
                    <CardContent className="flex gap-3">
                        <Input
                            placeholder="今日やることを入力..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && addEvent()}
                            className="flex-1"
                        />
                        <Button
                            onClick={addEvent}
                            disabled={!title.trim()}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            追加
                        </Button>
                    </CardContent>
                </Card>

                {/* リスト表示 */}
                <Card className="border-0 bg-slate-700/50 backdrop-blur">
                    <CardHeader>
                        <CardTitle>やることリスト ({events.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {events.length === 0 ? (
                            <p className="text-slate-400 text-lg">今日やることはまだありません</p>
                        ) : (
                            events.map((e, idx) => (
                                <div
                                    key={`${e.id}-${idx}`}
                                    className="flex items-center justify-between p-4 rounded-lg bg-slate-600/50 hover:bg-slate-600 transition-colors"
                                >
                                    <span className="text-lg font-medium">{e.title}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeEvent(e.id)}
                                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
