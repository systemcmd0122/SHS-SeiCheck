"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, AlertCircle, ArrowLeft, Monitor } from "lucide-react";
import { listenTodayTasks, addTodayTask, deleteTodayTask, listenTVSettings, updateTVSettings, type TVDashboardSettings } from "@/lib/db";

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
    const [tvSettings, setTvSettings] = useState<TVDashboardSettings | null>(null);
    const [tvSettingsLoading, setTvSettingsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // リアルタイムリスナーで今日のタスクを監視
        console.log("Setting up realtime listener for today's tasks...");
        const unsubscribe = listenTodayTasks((tasks) => {
            console.log("Realtime update received:", tasks);
            setEvents(tasks as TempEvent[]);
        });

        // TV設定をリアルタイムで監視
        const unsubscribeTVSettings = listenTVSettings((settings) => {
            console.log("TV Settings updated:", settings);
            setTvSettings(settings);
        });

        return () => {
            console.log("Cleaning up realtime listener");
            unsubscribe();
            unsubscribeTVSettings();
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

    const handleTVSettingChange = async (setting: keyof Omit<TVDashboardSettings, "id" | "updatedAt">, value: boolean) => {
        if (!tvSettings) {
            console.warn("TV Settings not loaded yet");
            return;
        }

        setTvSettingsLoading(true);
        try {
            console.log(`Changing ${setting} to ${value}`);
            await updateTVSettings({
                [setting]: value,
            });
            console.log(`Successfully updated ${setting}`);
            // リアルタイムリスナーが自動的に更新する
        } catch (err) {
            console.error("Failed to update TV settings:", err);
            setError(err instanceof Error ? err.message : "TV設定の更新に失敗しました");
        } finally {
            setTvSettingsLoading(false);
        }
    };
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 sm:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6 sm:mb-8 gap-4">
                    <h1 className="text-2xl sm:text-4xl font-bold">管理パネル</h1>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push("/admin")}
                        className="bg-slate-700 hover:bg-slate-600 border-slate-600 text-white whitespace-nowrap"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">戻る</span>
                    </Button>
                </div>

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

                {/* タブ */}
                <Tabs defaultValue="tasks" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-700/50 mb-6 sm:mb-8">
                        <TabsTrigger value="tasks" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm">
                            <span>リスト</span>
                        </TabsTrigger>
                        <TabsTrigger value="tv" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm">
                            <Monitor className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">設定</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* タスク管理タブ */}
                    <TabsContent value="tasks" className="space-y-6 mt-6">
                        {/* 入力フォーム */}
                        <Card className="border-0 bg-slate-700/50 backdrop-blur">
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
                    </TabsContent>

                    {/* TV設定タブ */}
                    <TabsContent value="tv" className="space-y-4 sm:space-y-6 mt-6">
                        <Card className="border-0 bg-slate-700/50 backdrop-blur">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                    <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="hidden sm:inline">TV画面</span>表示設定
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 sm:space-y-6">
                                {tvSettings ? (
                                    <div className="space-y-4 sm:space-y-5">
                                        {/* 次の予定 */}
                                        <div className="flex items-start sm:items-center justify-between p-3 sm:p-4 rounded-lg bg-slate-600/30 hover:bg-slate-600/50 transition-colors gap-3 sm:gap-4">
                                            <div className="flex-1 min-w-0">
                                                <Label className="text-sm sm:text-base font-medium text-white cursor-pointer">
                                                    今日の予定
                                                </Label>
                                                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                                                    左側上部に表示される、本日の予定の詳細情報
                                                </p>
                                            </div>
                                            <Switch
                                                checked={tvSettings.showNextEvent}
                                                onCheckedChange={(checked) =>
                                                    handleTVSettingChange("showNextEvent", checked)
                                                }
                                                disabled={tvSettingsLoading}
                                                className="flex-shrink-0"
                                            />
                                        </div>

                                        {/* 本日の予定 */}
                                        <div className="flex items-start sm:items-center justify-between p-3 sm:p-4 rounded-lg bg-slate-600/30 hover:bg-slate-600/50 transition-colors gap-3 sm:gap-4">
                                            <div className="flex-1 min-w-0">
                                                <Label className="text-sm sm:text-base font-medium text-white cursor-pointer">
                                                    本日の予定一覧
                                                </Label>
                                                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                                                    左側下部に表示される、本日の全予定の一覧
                                                </p>
                                            </div>
                                            <Switch
                                                checked={tvSettings.showTodayEvents}
                                                onCheckedChange={(checked) =>
                                                    handleTVSettingChange("showTodayEvents", checked)
                                                }
                                                disabled={tvSettingsLoading}
                                                className="flex-shrink-0"
                                            />
                                        </div>

                                        {/* これからの予定 */}
                                        <div className="flex items-start sm:items-center justify-between p-3 sm:p-4 rounded-lg bg-slate-600/30 hover:bg-slate-600/50 transition-colors gap-3 sm:gap-4">
                                            <div className="flex-1 min-w-0">
                                                <Label className="text-sm sm:text-base font-medium text-white cursor-pointer">
                                                    これからの予定
                                                </Label>
                                                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                                                    明日以降の予定（オートスクロール）
                                                </p>
                                            </div>
                                            <Switch
                                                checked={tvSettings.showUpcomingEvents}
                                                onCheckedChange={(checked) =>
                                                    handleTVSettingChange("showUpcomingEvents", checked)
                                                }
                                                disabled={tvSettingsLoading}
                                                className="flex-shrink-0"
                                            />
                                        </div>

                                        {/* お知らせ */}
                                        <div className="flex items-start sm:items-center justify-between p-3 sm:p-4 rounded-lg bg-slate-600/30 hover:bg-slate-600/50 transition-colors gap-3 sm:gap-4">
                                            <div className="flex-1 min-w-0">
                                                <Label className="text-sm sm:text-base font-medium text-white cursor-pointer">
                                                    お知らせ
                                                </Label>
                                                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                                                    お知らせの表示（オートスクロール）
                                                </p>
                                            </div>
                                            <Switch
                                                checked={tvSettings.showAnnouncements}
                                                onCheckedChange={(checked) =>
                                                    handleTVSettingChange("showAnnouncements", checked)
                                                }
                                                disabled={tvSettingsLoading}
                                                className="flex-shrink-0"
                                            />
                                        </div>

                                        {/* 統計情報 */}
                                        <div className="flex items-start sm:items-center justify-between p-3 sm:p-4 rounded-lg bg-slate-600/30 hover:bg-slate-600/50 transition-colors gap-3 sm:gap-4">
                                            <div className="flex-1 min-w-0">
                                                <Label className="text-sm sm:text-base font-medium text-white cursor-pointer">
                                                    統計情報
                                                </Label>
                                                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                                                    参加者数などの統計情報
                                                </p>
                                            </div>
                                            <Switch
                                                checked={tvSettings.showStatistics}
                                                onCheckedChange={(checked) =>
                                                    handleTVSettingChange("showStatistics", checked)
                                                }
                                                disabled={tvSettingsLoading}
                                                className="flex-shrink-0"
                                            />
                                        </div>

                                        {/* ニュース */}
                                        <div className="flex items-start sm:items-center justify-between p-3 sm:p-4 rounded-lg bg-slate-600/30 hover:bg-slate-600/50 transition-colors gap-3 sm:gap-4">
                                            <div className="flex-1 min-w-0">
                                                <Label className="text-sm sm:text-base font-medium text-white cursor-pointer">
                                                    最新ニュース
                                                </Label>
                                                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                                                    外部ニュースの表示（オートスクロール）
                                                </p>
                                            </div>
                                            <Switch
                                                checked={tvSettings.showNews}
                                                onCheckedChange={(checked) =>
                                                    handleTVSettingChange("showNews", checked)
                                                }
                                                disabled={tvSettingsLoading}
                                                className="flex-shrink-0"
                                            />
                                        </div>

                                        {/* 欠席者一覧 */}
                                        <div className="flex items-start sm:items-center justify-between p-3 sm:p-4 rounded-lg bg-slate-600/30 hover:bg-slate-600/50 transition-colors gap-3 sm:gap-4">
                                            <div className="flex-1 min-w-0">
                                                <Label className="text-sm sm:text-base font-medium text-white cursor-pointer">
                                                    今日来ない人一覧
                                                </Label>
                                                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                                                    欠席者と理由の表示
                                                </p>
                                            </div>
                                            <Switch
                                                checked={tvSettings.showAbsentList}
                                                onCheckedChange={(checked) =>
                                                    handleTVSettingChange("showAbsentList", checked)
                                                }
                                                disabled={tvSettingsLoading}
                                                className="flex-shrink-0"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-slate-400">設定を読み込み中...</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
