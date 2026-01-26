"use client";

import { useState, useEffect, useRef } from "react";
import { format, isSameDay, isFuture, differenceInMinutes, differenceInHours, differenceInDays } from "date-fns";
import { ja } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, TrendingUp, AlertCircle, Newspaper, Bell } from "lucide-react";
import { listenTVSettings } from "@/lib/db";

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

interface TVDashboardSettings {
    showStatistics?: boolean;
    showNews?: boolean;
    showAbsentList?: boolean;
    showNextEvent?: boolean;
    showTodayEvents?: boolean;
    showUpcomingEvents?: boolean;
    showAnnouncements?: boolean;
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
    const [currentTodayEvent, setCurrentTodayEvent] = useState(0);
    const [absentList, setAbsentList] = useState<AbsentMember[]>([]);
    const [tempEvents, setTempEvents] = useState<TodayEvent[]>([]);
    const [tvSettings, setTvSettings] = useState<TVDashboardSettings>({});
    const [isMounted, setIsMounted] = useState(false);
    const prevTvSettingsRef = useRef<TVDashboardSettings>({});

    // 時刻更新
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // ハイドレーション処理
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // TV設定をリアルタイムで監視
    useEffect(() => {
        console.log("Setting up TV settings listener...");
        const unsubscribe = listenTVSettings((settings) => {
            console.log("TV Settings updated in TV Dashboard:", settings);
            setTvSettings(settings);
        });

        return () => {
            console.log("Cleaning up TV settings listener");
            unsubscribe();
        };
    }, []);

    // データ読み込み
    useEffect(() => {
        const loadData = async () => {
            try {
                const eventsRes = await fetch("/api/events");
                let mainEvents: TodayEvent[] = [];
                if (eventsRes.ok) {
                    const data = await eventsRes.json();
                    if (data.success && Array.isArray(data.data)) {
                        mainEvents = data.data.filter((e: any) => e && e.title);
                    }
                }

                // Google Calendar イベントを取得
                const googleEventsRes = await fetch("/api/google-calendar/events");
                if (googleEventsRes.ok) {
                    const data = await googleEventsRes.json();
                    if (data.success && Array.isArray(data.data)) {
                        const googleEvents: TodayEvent[] = data.data
                            .filter((e: any) => e && e.title)
                            .map((e: any) => ({
                                id: e.id,
                                title: e.title,
                                dateTime: e.startTime,
                                type: "google-calendar",
                                deadline: e.endTime,
                            }));
                        mainEvents = [...mainEvents, ...googleEvents];
                    }
                }

                setEvents(mainEvents);

                const announcementsRes = await fetch("/api/announcements");
                if (announcementsRes.ok) {
                    const data = await announcementsRes.json();
                    if (data.success && Array.isArray(data.data)) {
                        setAnnouncements(data.data.filter((a: any) => a && a.title));
                    }
                }

                const statsRes = await fetch("/api/statistics");
                if (statsRes.ok) {
                    const data = await statsRes.json();
                    if (data.success && data.data) {
                        setStats(data.data);
                    }
                }

                const newsRes = await fetch("/api/news");
                if (newsRes.ok) {
                    const data = await newsRes.json();
                    if (data.success && Array.isArray(data.data)) {
                        setNews(data.data.filter((n: any) => n && n.title));
                    }
                }
            } catch (error) {
                console.warn("Failed to load dashboard data:", error);
            }
        };

        loadData();
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, []);

    // 欠席者リスト取得
    useEffect(() => {
        const fetchAbsent = async () => {
            try {
                const res = await fetch("/api/absent-list");
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && Array.isArray(data.data)) {
                        setAbsentList(data.data.filter((a: any) => a && a.eventTitle && a.memberName));
                    }
                }
            } catch (e) {
                console.warn("Failed to fetch absent list:", e);
            }
        };
        fetchAbsent();
        const interval = setInterval(fetchAbsent, 30000);
        return () => clearInterval(interval);
    }, []);

    // 本日の予定の自動ローテーション
    useEffect(() => {
        if (events.length + tempEvents.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentTodayEvent((prev) => {
                const todayCount = events.length + tempEvents.length;
                return (prev + 1) % todayCount;
            });
        }, 6000);
        return () => clearInterval(timer);
    }, [events.length, tempEvents.length]);

    // アナウンスメント自動ローテーション
    useEffect(() => {
        if (announcements.length === 0) return;
        const timer = setInterval(() => {
            setCurrentAnnouncement((prev) => (prev + 1) % announcements.length);
        }, 8000);
        return () => clearInterval(timer);
    }, [announcements.length]);

    // ニュース自動ローテーション
    useEffect(() => {
        if (news.length === 0) return;
        const timer = setInterval(() => {
            setCurrentNews((prev) => {
                const nextIndex = prev + 1;
                if (nextIndex >= news.length) {
                    const fetchNews = async () => {
                        try {
                            const newsRes = await fetch("/api/news");
                            if (newsRes.ok) {
                                const data = await newsRes.json();
                                if (data.success && Array.isArray(data.data)) {
                                    setNews(data.data);
                                    setCurrentNews(0);
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
        }, 6000);
        return () => clearInterval(timer);
    }, [news.length]);

    // 今日の予定（正規イベント + タスク）
    const todayEvents = [...events, ...tempEvents]
        .filter((e) => {
            try {
                if (!e.dateTime && !tempEvents.includes(e)) return false;
                if (tempEvents.includes(e)) return true;
                const eventDate = new Date(e.dateTime);
                if (isNaN(eventDate.getTime())) return false;
                return isSameDay(eventDate, currentTime);
            } catch {
                return false;
            }
        })
        .sort((a, b) => {
            if (!a.dateTime) return 1;
            if (!b.dateTime) return -1;
            return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
        });

    // 次の予定
    const nextEvent = todayEvents.find((e) => e.dateTime && isFuture(new Date(e.dateTime)));
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
        }, 7000);
        return () => clearInterval(timer);
    }, [upcomingEvents.length]);

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6" suppressHydrationWarning>
            <style jsx global>{`
                @keyframes slideInFromRight {
                    from {
                        opacity: 0;
                        transform: translateX(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                
                @keyframes fadeOut {
                    from {
                        opacity: 1;
                        transform: scale(1);
                    }
                    to {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                }
                
                @keyframes pulse {
                    0%, 100% {
                        box-shadow: 0 0 0 0 rgba(148, 163, 184, 0.4);
                    }
                    50% {
                        box-shadow: 0 0 0 10px rgba(148, 163, 184, 0);
                    }
                }
                
                .animate-in {
                    animation: fadeIn 0.5s ease-out forwards;
                }
                
                .animate-out {
                    animation: fadeOut 0.5s ease-out forwards;
                }
                
                .fade-in {
                    animation: fadeIn 0.5s ease-out;
                }
                
                .fade-out {
                    animation: fadeOut 0.5s ease-out;
                }
                
                .zoom-in-95 {
                    transform: scale(0.95);
                }
                
                .zoom-out-95 {
                    transform: scale(0.95);
                }
                
                .slide-content {
                    animation: slideInFromRight 0.7s ease-out;
                }
                
                .pulse-border {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                
                .card-enter {
                    animation: fadeIn 0.6s ease-out;
                }
            `}</style>

            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800 card-enter" suppressHydrationWarning>
                <div>
                    <h1 className="text-7xl font-bold text-slate-100 transition-all duration-300">
                        {isMounted ? format(currentTime, "HH:mm:ss") : "--:--:--"}
                    </h1>
                    <p className="text-2xl text-slate-400 mt-2 font-normal">
                        {isMounted ? format(currentTime, "yyyy年M月d日(E)", { locale: ja }) : "日付を読み込み中..."}
                    </p>
                </div>
                <div className="text-right">
                    <h2 className="text-6xl font-bold text-slate-200">生徒会</h2>
                    <p className="text-xl text-slate-500 mt-2 font-normal">ダッシュボード</p>
                </div>
            </div>

            {(() => {
                let gridCols = 3;
                if ((tvSettings?.showStatistics !== false && stats)) gridCols++;
                if ((tvSettings?.showNews !== false && news.length > 0)) gridCols++;
                if ((tvSettings?.showAbsentList !== false)) gridCols++;

                return (
                    <div
                        className="gap-4 h-[calc(100vh-200px)] grid transition-all duration-700 ease-in-out"
                        style={{
                            gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
                        }}
                        suppressHydrationWarning
                    >
                        <div className="col-span-1 flex flex-col gap-4 h-full">
                            {tvSettings?.showNextEvent === true && nextEvent ? (
                                <Card className="border-0 bg-gradient-to-br from-slate-800 to-slate-900 flex-shrink-0 h-1/2 max-h-[calc((100vh-250px-8px)/2)] flex flex-col shadow-sm rounded-2xl card-enter pulse-border overflow-hidden group hover:shadow-lg hover:shadow-slate-700/50 transition-all duration-300">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-2xl flex items-center gap-3 text-slate-100">
                                            <Clock className="w-6 h-6 text-slate-400 group-hover:text-slate-300 transition-colors" />
                                            次の予定
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-1 flex flex-col justify-center gap-4">
                                        <div className="transition-all duration-300">
                                            <p className="text-4xl font-semibold mb-4 text-slate-100">{nextEvent.title}</p>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3 text-2xl bg-slate-700/50 p-3 rounded-xl hover:bg-slate-700/70 transition-all duration-300">
                                                    <Clock className="w-6 h-6 text-slate-400" />
                                                    <span className="text-slate-200">{format(new Date(nextEvent.dateTime), "HH:mm")}</span>
                                                </div>
                                                <div className="text-3xl font-semibold text-slate-300 bg-slate-700/50 p-3 rounded-xl hover:bg-slate-700/70 transition-all duration-300">
                                                    {timeUntilNext}
                                                </div>
                                                <Badge className="text-base py-2 px-4 bg-slate-700 text-slate-200 font-normal rounded-lg hover:bg-slate-600 transition-colors duration-300">
                                                    {nextEvent.type}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : tvSettings?.showNextEvent !== false ? (
                                <Card className="border-0 bg-slate-800/50 shadow-sm rounded-2xl flex-shrink-0 h-1/2 max-h-[calc((100vh-250px-8px)/2)] flex flex-col card-enter overflow-hidden hover:shadow-lg hover:shadow-slate-700/30 transition-all duration-300">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2 text-slate-200">
                                            <Calendar className="w-5 h-5 text-slate-400" />
                                            今日の予定
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-1 flex flex-col justify-center gap-3 overflow-hidden">
                                        {todayEvents.length === 0 ? (
                                            <p className="text-slate-400 text-base">今日の予定はありません</p>
                                        ) : (
                                            <div>
                                                <div
                                                    key={`today-${currentTodayEvent}`}
                                                    className="slide-content"
                                                >
                                                    <div className="p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700/70 transition-all duration-300">
                                                        <p className="font-normal text-base line-clamp-2 text-slate-100 mb-2">{todayEvents[currentTodayEvent]?.title}</p>
                                                    </div>
                                                </div>
                                                {todayEvents.length > 1 && (
                                                    <div className="flex items-center gap-2 justify-center mt-4">
                                                        {todayEvents.map((_, idx) => (
                                                            <div
                                                                key={idx}
                                                                className={`rounded-full transition-all duration-500 ${idx === currentTodayEvent
                                                                    ? "w-6 h-2 bg-gradient-to-r from-slate-200 to-slate-300 shadow-lg shadow-slate-300/30"
                                                                    : "w-2 h-2 bg-slate-600 hover:bg-slate-500 cursor-pointer"
                                                                    }`}
                                                                onClick={() => setCurrentTodayEvent(idx)}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ) : null}

                            {tvSettings?.showTodayEvents === true && (
                                <Card className="border-0 bg-slate-800/50 flex-1 max-h-[calc((100vh-250px-8px)/2)] flex flex-col shadow-sm rounded-2xl overflow-hidden card-enter hover:shadow-lg hover:shadow-slate-700/30 transition-all duration-300">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2 text-slate-200">
                                            <Calendar className="w-5 h-5 text-slate-400" />
                                            本日の予定
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-1 flex flex-col justify-center gap-3 overflow-hidden">
                                        {todayEvents.length === 0 ? (
                                            <p className="text-slate-400 text-base">本日の予定はありません</p>
                                        ) : (
                                            <div>
                                                <div
                                                    key={`today-${currentTodayEvent}`}
                                                    className="slide-content"
                                                >
                                                    <div className="p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700/70 transition-all duration-300">
                                                        <p className="font-normal text-base line-clamp-2 text-slate-100 mb-2">{todayEvents[currentTodayEvent].title}</p>
                                                    </div>
                                                </div>
                                                {todayEvents.length > 1 && (
                                                    <div className="flex items-center gap-2 justify-center mt-4">
                                                        {todayEvents.map((_, idx) => (
                                                            <div
                                                                key={idx}
                                                                className={`rounded-full transition-all duration-500 ${idx === currentTodayEvent
                                                                    ? "w-6 h-2 bg-gradient-to-r from-slate-200 to-slate-300 shadow-lg shadow-slate-300/30"
                                                                    : "w-2 h-2 bg-slate-600 hover:bg-slate-500 cursor-pointer"
                                                                    }`}
                                                                onClick={() => setCurrentTodayEvent(idx)}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        <div className="col-span-2 flex flex-col gap-4 h-full">
                            {tvSettings?.showUpcomingEvents === true && (
                                <Card className="border-0 bg-gradient-to-br from-slate-800 to-slate-900 flex-1 max-h-[calc((100vh-250px-8px)/2)] flex flex-col shadow-sm rounded-2xl card-enter overflow-hidden hover:shadow-lg hover:shadow-slate-700/50 transition-all duration-300">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-2xl flex items-center gap-3 text-slate-100">
                                            <Bell className="w-6 h-6 text-slate-400" />
                                            これからの予定
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-1 flex flex-col justify-center gap-3 overflow-hidden">
                                        {upcomingEvents.length === 0 ? (
                                            <p className="text-lg text-slate-400 font-normal">予定はありません</p>
                                        ) : (
                                            <div>
                                                <div
                                                    key={`upcoming-${currentUpcoming}`}
                                                    className="slide-content"
                                                >
                                                    <div className="p-3 rounded-xl bg-slate-700/50 hover:bg-slate-700/70 transition-all duration-300">
                                                        <p className="font-normal text-2xl text-slate-100 mb-2">{upcomingEvents[currentUpcoming].title}</p>
                                                        <p className="text-base text-slate-400">
                                                            {format(new Date(upcomingEvents[currentUpcoming].dateTime), "M月d日(E)", {
                                                                locale: ja,
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                                {upcomingEvents.length > 1 && (
                                                    <div className="flex items-center gap-2 justify-center mt-4">
                                                        {upcomingEvents.map((_, idx) => (
                                                            <div
                                                                key={idx}
                                                                className={`rounded-full transition-all duration-500 ${idx === currentUpcoming
                                                                    ? "w-6 h-2 bg-gradient-to-r from-slate-200 to-slate-300 shadow-lg shadow-slate-300/30"
                                                                    : "w-2 h-2 bg-slate-600 hover:bg-slate-500 cursor-pointer"
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {tvSettings?.showAnnouncements === true && currentAnn && (
                                <Card className="border-0 bg-slate-800/50 flex-1 max-h-[calc((100vh-250px-8px)/2)] flex flex-col shadow-sm rounded-2xl overflow-hidden card-enter hover:shadow-lg hover:shadow-slate-700/30 transition-all duration-300">
                                    <CardHeader>
                                        <CardTitle className="text-xl flex items-center gap-2 text-slate-100">
                                            <AlertCircle className="w-5 h-5 text-slate-400" />
                                            お知らせ
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-1 flex flex-col justify-center gap-2 overflow-y-auto">
                                        <div
                                            key={`announcement-${currentAnnouncement}`}
                                            className="slide-content"
                                        >
                                            <h3 className="text-xl font-normal text-slate-200">{currentAnn.title}</h3>
                                            <p className="text-lg text-slate-400 leading-relaxed">
                                                {currentAnn.content}
                                            </p>
                                        </div>
                                        {announcements.length > 1 && (
                                            <div className="flex items-center gap-2 justify-center mt-3">
                                                {announcements.map((_, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`rounded-full transition-all duration-500 ${idx === currentAnnouncement
                                                            ? "w-4 h-1.5 bg-slate-200"
                                                            : "w-1.5 h-1.5 bg-slate-500 hover:bg-slate-400 cursor-pointer"
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {tvSettings?.showStatistics === true && stats && (
                            <div>
                                <Card className="border-0 bg-gradient-to-br from-slate-800 to-slate-900 h-full max-h-[calc(100vh-250px)] flex flex-col shadow-sm rounded-2xl overflow-hidden card-enter hover:shadow-lg hover:shadow-slate-700/50 transition-all duration-300">
                                    <CardHeader>
                                        <CardTitle className="text-xl flex items-center gap-2 text-slate-100">
                                            <TrendingUp className="w-5 h-5 text-slate-400" />
                                            統計情報
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-1 flex flex-col justify-around">
                                        {stats && (
                                            <div className="space-y-4">
                                                <div className="transition-all duration-300 hover:translate-x-1">
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
                                                    <div className="bg-slate-700/50 p-3 rounded-lg hover:bg-slate-700/70 transition-all duration-300 hover:scale-105">
                                                        <p className="text-slate-400 text-xs mb-1">遅刻予定</p>
                                                        <p className="text-3xl font-semibold text-slate-200">{stats.late}</p>
                                                    </div>
                                                    <div className="bg-slate-700/50 p-3 rounded-lg hover:bg-slate-700/70 transition-all duration-300 hover:scale-105">
                                                        <p className="text-slate-400 text-xs mb-1">欠席</p>
                                                        <p className="text-3xl font-semibold text-slate-200">{stats.absent}</p>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-700/50 p-3 rounded-lg hover:bg-slate-700/70 transition-all duration-300 hover:scale-105">
                                                    <p className="text-slate-400 text-xs mb-1">未回答</p>
                                                    <p className="text-3xl font-semibold text-slate-200">{stats.unanswered}</p>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {tvSettings?.showNews === true && news.length > 0 && news[currentNews] && (
                            <div>
                                <Card className="border-0 bg-gradient-to-br from-slate-800 to-slate-900 h-full max-h-[calc(100vh-250px)] flex flex-col shadow-sm rounded-2xl overflow-hidden card-enter hover:shadow-lg hover:shadow-slate-700/50 transition-all duration-300">
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
                                                className="slide-content"
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
                                                            : "w-2 h-2 bg-slate-600 hover:bg-slate-500 cursor-pointer"
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {tvSettings?.showAbsentList === true && (
                            <div>
                                <Card className="border-0 bg-gradient-to-br from-slate-800 to-slate-900 h-full max-h-[calc(100vh-250px)] flex flex-col shadow-sm rounded-2xl overflow-hidden card-enter hover:shadow-lg hover:shadow-slate-700/50 transition-all duration-300">
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
                                            absentList.map((a, idx) => (
                                                <div
                                                    key={a.memberId + a.eventId}
                                                    className="mb-3 p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700/70 transition-all duration-300 hover:translate-x-1"
                                                    style={{
                                                        animation: `fadeIn 0.5s ease-out ${idx * 0.1}s backwards`
                                                    }}
                                                >
                                                    <div className="font-normal text-base text-slate-100">{a.memberName}</div>
                                                    <div className="text-slate-400 text-xs">{a.eventTitle}</div>
                                                    <div className="text-slate-500 text-xs mt-1">理由: {a.reason}</div>
                                                </div>
                                            ))
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                );
            })()}
        </div>
    );
}