"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, AlertCircle } from "lucide-react";
import { listenTodayTasks, addTodayTask, deleteTodayTask } from "@/lib/db";

interface TempEvent {
    id: string;
    title: string;
    date?: string;
    createdAt?: string;
}

export default function AdminEventsPage() {
    const [events, setEvents] = useState<TempEvent[]>([]);
    const [title, setTitle] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // リアルタイムリスナーで今日のタスクを監視
        console.log("Setting up realtime listener for today's tasks...");
        const unsubscribe = listenTodayTasks((tasks) => {
            console.log("Realtime update received:", tasks);
            setEvents(tasks as TempEvent[]);
        });
        return () => {
            console.log("Cleaning up realtime listener");
            unsubscribe();
        };
    }, []);

    const addEvent = async () => {
        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
            setError("タイトルを入力してください");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log("Adding task:", trimmedTitle);
            const taskId = await addTodayTask(trimmedTitle);
            console.log("Task added successfully with ID:", taskId);
            setTitle("");
            // リアルタイムリスナーが自動的に更新する
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "タスク追加に失敗しました";
            console.error("Failed to add event:", err);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const removeEvent = async (id: string) => {
        setError(null);
        try {
            console.log("Deleting task with ID:", id);
            await deleteTodayTask(id);
            console.log("Task deleted successfully");
            // リアルタイムリスナーが自動的に更新する
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "タスク削除に失敗しました";
            console.error("Failed to remove event:", err);
            setError(errorMessage);
        }
    };
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-4xl font-bold mb-8">今日することリスト</h1>

                {/* エラーメッセージ表示 */}
                {error && (
                    <div className="mb-6 p-4 rounded-lg bg-red-900/30 border border-red-500/50 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        <p className="text-red-200">{error}</p>
                        <button
                            onClick={() => setError(null)}
                            className="ml-auto text-red-400 hover:text-red-300"
                        >
                            ✕
                        </button>
                    </div>
                )}

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
                            onKeyPress={(e) => e.key === "Enter" && !loading && addEvent()}
                            className="flex-1"
                            disabled={loading}
                        />
                        <Button
                            onClick={addEvent}
                            disabled={!title.trim() || loading}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? "追加中..." : "追加"}
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
                            events.map((e) => (
                                <div
                                    key={e.id}
                                    className="flex items-center justify-between p-4 rounded-lg bg-slate-600/50 hover:bg-slate-600 transition-colors"
                                >
                                    <div className="flex-1">
                                        <span className="text-lg font-medium">{e.title}</span>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {e.createdAt ? new Date(e.createdAt).toLocaleTimeString("ja-JP") : ""}
                                        </p>
                                    </div>
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
