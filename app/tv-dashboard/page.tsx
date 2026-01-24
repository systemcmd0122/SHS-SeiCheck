"use client";

import { useState, useEffect } from "react";
import { format, isSameDay, isFuture, differenceInMinutes, differenceInHours, differenceInDays, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, TrendingUp, AlertCircle, Newspaper } from "lucide-react";
import { listenTodayTasks } from "@/lib/db";

interface TodayEvent {
    id: string;
    title: string;
    dateTime: string;
    type: string;
    deadline: string;
}

interface Statistics {
    participated: number;
    late: number;
    absent: number;
    unanswered: number;
    total: number;
}

interface NewsItem {
    title: string;
    description: string;
    link: string;
    pubDate: string;
}

interface AbsentMember {
    eventId: string;
    eventTitle: string;
    memberId: string;
    memberName: string;
    reason: string;
}

export default function TVDashboard() {
    const [events, setEvents] = useState<TodayEvent[]>([]);
    const [stats, setStats] = useState<Statistics | null>(null);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [news, setNews] = useState<NewsItem[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [currentAnnouncement, setCurrentAnnouncement] = useState(0);
    const [currentNews, setCurrentNews] = useState(0);
    const [currentUpcoming, setCurrentUpcoming] = useState(0);
    const [absentList, setAbsentList] = useState<AbsentMember[]>([]);
    const [tempEvents, setTempEvents] = useState<TodayEvent[]>([]);

    // 時刻更新
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // データ読み込み
    useEffect(() => {
        const loadData = async () => {
            try {
                // イベント読み込み
                const eventsRes = await fetch("/api/events");
                let mainEvents: TodayEvent[] = [];
                if (eventsRes.ok) {
                    const data = await eventsRes.json();
                    if (data.success && Array.isArray(data.data)) {
                        mainEvents = data.data;
                    }
                }

                // 両方をマージ
                setEvents(mainEvents);

                // アナウンスメント読み込み
                const announcementsRes = await fetch("/api/announcements");
                if (announcementsRes.ok) {
                    const data = await announcementsRes.json();
                    if (data.success && Array.isArray(data.data)) {
                        setAnnouncements(data.data);
                    }
                }

                // 統計情報読み込み
                const statsRes = await fetch("/api/statistics");
                if (statsRes.ok) {
                    const data = await statsRes.json();
                    if (data.success && data.data) {
                        setStats(data.data);
                    }
                }

                // ニュース読み込み
                const newsRes = await fetch("/api/news");
                if (newsRes.ok) {
                    const data = await newsRes.json();
                    if (data.success && Array.isArray(data.data)) {
                        setNews(data.data);
                    }
                }
            } catch (error) {
                console.warn("Failed to load dashboard data:", error);
            }
        };

        loadData();
        // 30秒ごとにデータを更新
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, []);

    // 今日のタスクをリアルタイムで監視
    useEffect(() => {
        const unsubscribe = listenTodayTasks((tasks) => {
            setTempEvents(tasks as TodayEvent[]);
        });
        return () => unsubscribe();
    }, []);

    // アナウンスメント自動ローテーション
    useEffect(() => {
        if (announcements.length === 0) return;
        const timer = setInterval(() => {
            setCurrentAnnouncement((prev) => (prev + 1) % announcements.length);
        }, 8000); // 8秒ごとに切り替え
        return () => clearInterval(timer);
    }, [announcements.length]);

    // ニュース自動更新・ローテーション
    useEffect(() => {
        if (news.length === 0) return;

        const timer = setInterval(() => {
            setCurrentNews((prev) => {
                const nextIndex = prev + 1;
                // ニュース配列の最後に達したら、新しいニュースを取得
                if (nextIndex >= news.length) {
                    // 新しいニュースを取得
                    const fetchNews = async () => {
                        try {
                            const newsRes = await fetch("/api/news");
                            if (newsRes.ok) {
                                const data = await newsRes.json();
                                if (data.success && Array.isArray(data.data)) {
                                    setNews(data.data);
                                    setCurrentNews(0); // 最初のニュースから再開
                                }
                            }
                        } catch (error) {
                            console.warn("Failed to fetch news:", error);
                        }
                    };
                    fetchNews();
                    return 0;
                }
                return nextIndex;
            });
        }, 6000); // 6秒ごとに切り替え
        return () => clearInterval(timer);
    }, [news.length]);

    // 今日の予定（正規イベント + タスク）
    const todayEvents = [...events, ...tempEvents]
        .filter((e) => {
            try {
                if (!e.dateTime && !tempEvents.includes(e)) return false;
                if (tempEvents.includes(e)) return true; // タスクは常に表示
                const eventDate = new Date(e.dateTime);
                if (isNaN(eventDate.getTime())) return false;
                return isSameDay(eventDate, currentTime);
            } catch {
                return false;
            }
        })
        .sort((a, b) => {
            // タスク（dateTime がない）は最後に表示
            if (!a.dateTime) return 1;
            if (!b.dateTime) return -1;
            return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
        });

    // 次の予定
    const nextEvent = todayEvents.find((e) => isFuture(new Date(e.dateTime)));
    const timeUntilNext = nextEvent
        ? (() => {
            const eventTime = new Date(nextEvent.dateTime);
            const days = differenceInDays(eventTime, currentTime);
            const hours = differenceInHours(eventTime, currentTime) % 24;
            const minutes = differenceInMinutes(eventTime, currentTime) % 60;

            if (days > 0) return `${days}日${hours}時間後`;
            if (hours > 0) return `${hours}時間${minutes}分後`;
            return `${minutes}分後`;
        })()
        : null;

    // これからの予定（明日以降）
    const upcomingEvents = events
        .filter((e) => {
            try {
                if (!e.dateTime) return false;
                const eventDate = new Date(e.dateTime);
                if (isNaN(eventDate.getTime())) return false;
                return isFuture(eventDate) && !isSameDay(eventDate, currentTime);
            } catch {
                return false;
            }
        })
        .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
        .slice(0, 3);

    const currentAnn = announcements[currentAnnouncement];

    // これからの予定自動ローテーション
    useEffect(() => {
        if (upcomingEvents.length === 0) return;
        const timer = setInterval(() => {
            setCurrentUpcoming((prev) => (prev + 1) % upcomingEvents.length);
        }, 7000); // 7秒ごとに切り替え
        return () => clearInterval(timer);
    }, [upcomingEvents.length]);

    // 欠席者リスト取得
    useEffect(() => {
        const fetchAbsent = async () => {
            try {
                const res = await fetch("/api/absent-list");
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && Array.isArray(data.data)) {
                        setAbsentList(data.data);
                    }
                }
            } catch (e) {
                // エラー時は何もしない
            }
        };
        fetchAbsent();
        const interval = setInterval(fetchAbsent, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6" suppressHydrationWarning>
            {/* ヘッダー - 時刻表示 */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800" suppressHydrationWarning>
                <div>
                    <h1 className="text-7xl font-bold text-slate-100">
                        {format(currentTime, "HH:mm:ss")}
                    </h1>
                    <p className="text-2xl text-slate-400 mt-2 font-normal">
                        {format(currentTime, "yyyy年M月d日(E)", { locale: ja })}
                    </p>
                </div>
                <div className="text-right">
                    <h2 className="text-6xl font-bold text-slate-200">生徒会</h2>
                    <p className="text-xl text-slate-500 mt-2 font-normal">ダッシュボード</p>
                </div>
            </div>

            <div className="grid grid-cols-5 gap-4 h-[calc(100vh-200px)]" suppressHydrationWarning>
                {/* 左列：今日の予定 */}
                <div className="col-span-1 flex flex-col gap-4">
                    {/* 次の予定（大） */}
                    {nextEvent ? (
                        <Card className="border-0 bg-gradient-to-br from-slate-800 to-slate-900 flex-1 flex flex-col shadow-sm rounded-2xl">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-2xl flex items-center gap-3 text-slate-100">
                                    <Clock className="w-6 h-6 text-slate-400" />
                                    次の予定
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col justify-center gap-4">
                                <div>
                                    <p className="text-4xl font-semibold mb-4 text-slate-100">{nextEvent.title}</p>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-2xl bg-slate-700/50 p-3 rounded-xl">
                                            <Clock className="w-6 h-6 text-slate-400" />
                                            <span className="text-slate-200">{format(new Date(nextEvent.dateTime), "HH:mm")}</span>
                                        </div>
                                        <div className="text-3xl font-semibold text-slate-300 bg-slate-700/50 p-3 rounded-xl">
                                            {timeUntilNext}
                                        </div>
                                        <Badge className="text-base py-2 px-4 bg-slate-700 text-slate-200 font-normal rounded-lg">
                                            {nextEvent.type}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-0 bg-gradient-to-br from-slate-800 to-slate-900 flex-1 flex flex-col shadow-sm rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-2xl text-slate-300">今日の予定</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 flex items-center justify-center">
                                <p className="text-2xl text-slate-400 font-normal">今日の予定はありません</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* 本日の予定一覧（小） */}
                    <Card className="border-0 bg-slate-800/50 shadow-sm rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-slate-200">
                                <Calendar className="w-5 h-5 text-slate-400" />
                                本日の予定
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {todayEvents.length === 0 ? (
                                <p className="text-slate-400 text-base">本日の予定はありません</p>
                            ) : (
                                todayEvents.map((e) => (
                                    <div
                                        key={e.id}
                                        className="p-3 rounded-lg bg-slate-700/50 flex items-center justify-between hover:bg-slate-700/70 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-normal text-base truncate text-slate-100">{e.title}</p>
                                            {e.dateTime && (
                                                <p className="text-xs text-slate-400">
                                                    {format(new Date(e.dateTime), "HH:mm")}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* 中央列：これからの予定 & お知らせ */}
                <div className="col-span-1 flex flex-col gap-4">
                    {/* これからの予定 - オートスクロール */}
                    <Card className="border-0 bg-gradient-to-br from-slate-800 to-slate-900 flex-1 flex flex-col shadow-sm rounded-2xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-2xl text-slate-100">📅 これからの予定</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col justify-center gap-3 overflow-hidden">
                            {upcomingEvents.length === 0 ? (
                                <p className="text-lg text-slate-400 font-normal">予定はありません</p>
                            ) : (
                                <div>
                                    <div key={upcomingEvents[currentUpcoming].id} className="p-3 rounded-xl bg-slate-700/50">
                                        <p className="font-normal text-2xl text-slate-100 mb-2">{upcomingEvents[currentUpcoming].title}</p>
                                        <p className="text-base text-slate-400">
                                            {format(new Date(upcomingEvents[currentUpcoming].dateTime), "M月d日(E) HH:mm", {
                                                locale: ja,
                                            })}
                                        </p>
                                    </div>
                                    {upcomingEvents.length > 1 && (
                                        <div className="flex items-center gap-2 justify-center mt-3">
                                            {upcomingEvents.map((_, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentUpcoming ? "bg-slate-200 w-4" : "bg-slate-500"}`}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* お知らせ */}
                    {currentAnn && (
                        <Card className="border-0 bg-slate-800/50 flex-1 flex flex-col shadow-sm rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2 text-slate-100">
                                    <AlertCircle className="w-5 h-5 text-slate-400" />
                                    お知らせ
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col justify-center gap-2">
                                <h3 className="text-xl font-normal text-slate-200">{currentAnn.title}</h3>
                                <p className="text-lg text-slate-400 leading-relaxed line-clamp-5">
                                    {currentAnn.content}
                                </p>
                                {announcements.length > 1 && (
                                    <div className="flex items-center gap-2 justify-center mt-3">
                                        {announcements.map((_, idx) => (
                                            <div
                                                key={idx}
                                                className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentAnnouncement ? "bg-slate-200 w-4" : "bg-slate-500"
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* 右列：統計情報 */}
                <div className="col-span-1">
                    {stats ? (
                        <Card className="border-0 bg-gradient-to-br from-slate-800 to-slate-900 h-full flex flex-col shadow-sm rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2 text-slate-100">
                                    <TrendingUp className="w-5 h-5 text-slate-400" />
                                    統計情報
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col justify-around">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-slate-400 text-sm mb-2">参加</p>
                                        <p className="text-4xl font-semibold text-slate-200">
                                            {stats.participated}
                                            <span className="text-lg text-slate-400">/{stats.total}</span>
                                        </p>
                                        <p className="text-base text-slate-500 mt-1">
                                            {Math.round((stats.participated / stats.total) * 100)}%
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-slate-700/50 p-3 rounded-lg">
                                            <p className="text-slate-400 text-xs mb-1">遅刻予定</p>
                                            <p className="text-3xl font-semibold text-slate-200">{stats.late}</p>
                                        </div>
                                        <div className="bg-slate-700/50 p-3 rounded-lg">
                                            <p className="text-slate-400 text-xs mb-1">欠席</p>
                                            <p className="text-3xl font-semibold text-slate-200">{stats.absent}</p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-700/50 p-3 rounded-lg">
                                        <p className="text-slate-400 text-xs mb-1">未回答</p>
                                        <p className="text-3xl font-semibold text-slate-200">{stats.unanswered}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-0 bg-slate-800/50 h-full flex items-center justify-center shadow-sm rounded-2xl">
                            <CardContent>
                                <p className="text-base text-slate-400">統計情報を読み込み中...</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* 右列：ニュース */}
                <div className="col-span-1">
                    {news.length > 0 && news[currentNews] ? (
                        <Card className="border-0 bg-gradient-to-br from-slate-800 to-slate-900 h-full flex flex-col shadow-sm rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2 text-slate-100">
                                    <Newspaper className="w-5 h-5 text-slate-400" />
                                    最新ニュース
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col justify-center gap-3 overflow-hidden">
                                <div className="relative">
                                    <div
                                        key={`news-${currentNews}`}
                                        className="transition-all duration-700 ease-out"
                                        style={{
                                            animation: "slideInFromRight 0.7s ease-out",
                                        }}
                                    >
                                        <h3 className="text-lg font-normal leading-tight line-clamp-4 text-slate-100">
                                            {news[currentNews].title}
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-2 line-clamp-3">
                                            {news[currentNews].description}
                                        </p>
                                    </div>
                                </div>
                                {news.length > 1 && (
                                    <div className="flex items-center gap-2 justify-center mt-4">
                                        {news.map((_, idx) => (
                                            <div
                                                key={idx}
                                                className={`rounded-full transition-all duration-500 ${idx === currentNews
                                                    ? "w-6 h-2 bg-gradient-to-r from-slate-200 to-slate-300 shadow-lg shadow-slate-300/30"
                                                    : "w-2 h-2 bg-slate-600 hover:bg-slate-500"
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-0 bg-slate-800/50 h-full flex items-center justify-center shadow-sm rounded-2xl">
                            <CardContent>
                                <p className="text-base text-slate-400 text-center">ニュースを読み込み中...</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* 最右列：今日来ない人一覧と理由 */}
                <div className="col-span-1">
                    <Card className="border-0 bg-gradient-to-br from-slate-800 to-slate-900 h-full flex flex-col shadow-sm rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2 text-slate-100">
                                <AlertCircle className="w-5 h-5 text-slate-400" />
                                今日来ない人一覧
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto">
                            {absentList.length === 0 ? (
                                <p className="text-slate-400 text-base">本日欠席者はいません</p>
                            ) : (
                                absentList.map((a) => (
                                    <div key={a.memberId + a.eventId} className="mb-3 p-3 rounded-lg bg-slate-700/50">
                                        <div className="font-normal text-base text-slate-100">{a.memberName}</div>
                                        <div className="text-slate-400 text-xs">{a.eventTitle}</div>
                                        <div className="text-slate-500 text-xs mt-1">理由: {a.reason}</div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    );
}
