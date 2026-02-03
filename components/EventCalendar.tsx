"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2, Plus, X, Share2, Zap, Maximize2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import { ClassroomCopyDialog } from "@/components/ClassroomCopyDialog";

interface GoogleCalendarEvent {
    id: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
}

interface EventCalendarProps {
    events: any[]; // 独自DBイベント用
    onEventClick?: (event: any) => void;
    onAddEvent?: () => void;
    onDeleteEvent?: (eventId: string) => void; // 削除ハンドラーを追加
    includeGoogleCalendar?: boolean;
    googleCalendarId?: string;
    highlightDates?: string[]; // YYYY-MM-DD形式の強調表示日付
    compact?: boolean; // コンパクトモード（ホーム画面用）
}

export function EventCalendar({
    events = [],
    onEventClick,
    onAddEvent,
    onDeleteEvent, // 削除ハンドラーを追加
    includeGoogleCalendar = true,
    googleCalendarId = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID || "",
    highlightDates = [],
    compact = false,
}: EventCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [classroomCopyOpen, setClassroomCopyOpen] = useState(false);
    const [selectedGoogleEvents, setSelectedGoogleEvents] = useState<GoogleCalendarEvent[]>([]);

    useEffect(() => {
        if (!includeGoogleCalendar) return;

        const loadGoogleEvents = async () => {
            setIsLoading(true);
            try {
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth() + 1;
                const url = `/api/google-calendar/events?year=${year}&month=${month}&calendarId=${encodeURIComponent(googleCalendarId)}`;

                const response = await fetch(url);
                const json = await response.json();

                if (response.ok && json.success) {
                    setGoogleEvents(json.data || []);
                } else {
                    console.error("Google Calendar API Error:", json.error);
                }
            } catch (error) {
                console.error("Fetch Error:", error);
                setGoogleEvents([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadGoogleEvents();
    }, [currentDate, includeGoogleCalendar, googleCalendarId]);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const weeks: (Date | null)[][] = [];
    let week: (Date | null)[] = [];
    for (let i = 0; i < monthStart.getDay(); i++) week.push(null);
    daysInMonth.forEach((day) => {
        if (week.length === 7) {
            weeks.push(week);
            week = [];
        }
        week.push(day);
    });
    while (week.length < 7) week.push(null);
    weeks.push(week);

    const getGoogleEventsForDate = (date: Date | null) => {
        if (!date) return [];
        const dStr = format(date, "yyyy-MM-dd");
        return googleEvents.filter((e) => {
            try {
                if (!e.startTime) return false;
                return format(new Date(e.startTime), "yyyy-MM-dd") === dStr;
            } catch {
                return false;
            }
        });
    };

    const getEventTypeColor = (type: string) => {
        switch (type) {
            case "定例会": return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-400 dark:border-green-800/60";
            case "行事準備": return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800/60";
            case "本番": return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-400 dark:border-purple-800/60";
            case "臨時集会": return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800/60";
            default: return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
        }
    };

    const getDBEventsForDate = (date: Date | null) => {
        if (!date) return [];
        const dStr = format(date, "yyyy-MM-dd");
        return events.filter((e) => {
            try {
                if (!e.dateTime) return false;
                const eventDate = new Date(e.dateTime);
                if (isNaN(eventDate.getTime())) return false;
                return format(eventDate, "yyyy-MM-dd") === dStr;
            } catch {
                return false;
            }
        });
    };

    const selectedDateDBEvents = selectedDate ? getDBEventsForDate(selectedDate) : [];
    const selectedDateGoogleEvents = selectedDate ? getGoogleEventsForDate(selectedDate) : [];

    return (
        <>
            <Card className={`border-0 shadow-md ${compact ? "h-fit" : ""}`}>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-2 pb-3 sm:pb-6">
                    <CardTitle className={`font-bold ${compact ? "text-lg" : "text-xl md:text-2xl"}`}>
                        {format(currentDate, "yyyy年M月", { locale: ja })}
                    </CardTitle>
                    <div className="flex gap-2 items-center flex-shrink-0">
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                        {googleEvents.length > 0 && (
                            <Link href="/planning-chat">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-orange-600 hover:bg-orange-100 dark:text-orange-400 dark:hover:bg-orange-900/30"
                                    title="予定計画アシスタント（全画面）"
                                >
                                    <Zap className="w-5 h-5" />
                                </Button>
                            </Link>
                        )}
                        {onAddEvent && (
                            <Button variant="ghost" size="icon" onClick={onAddEvent} className="text-primary hover:bg-primary/10" aria-label="予定を追加">
                                <Plus className="w-5 h-5" />
                            </Button>
                        )}
                        <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} aria-label="前月">
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} aria-label="次月">
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                    <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
                        {["日", "月", "火", "水", "木", "金", "土"].map((day, i) => (
                            <div key={day} className={`text-center font-semibold text-xs sm:text-sm py-1 sm:py-2 ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-muted-foreground"}`}>
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                        {weeks.map((week, wi) => week.map((day, di) => {
                            const dayGevs = getGoogleEventsForDate(day);
                            const dayDBevs = getDBEventsForDate(day);
                            const isToday = day ? isSameDay(day, new Date()) : false;
                            const dateStr = day ? format(day, "yyyy-MM-dd") : "";
                            const isHighlighted = highlightDates.includes(dateStr);
                            const hasEvents = dayDBevs.length > 0 || dayGevs.length > 0;

                            return (
                                <div
                                    key={`${wi}-${di}`}
                                    className={`h-[110px] w-full p-1 sm:p-1.5 rounded-lg border transition-all overflow-hidden flex flex-col ${!day ? "bg-muted/10 opacity-50" : isHighlighted ? "border-amber-400 bg-amber-50 shadow-md hover:shadow-lg dark:border-amber-700 dark:bg-amber-900/30" : isToday ? "border-primary bg-primary/5 shadow-inner dark:bg-primary/10" : "border-muted bg-card hover:border-primary/40 dark:bg-slate-800/50"} ${(hasEvents || day) ? "cursor-pointer" : ""}`}
                                    onClick={() => {
                                        if (day) setSelectedDate(day);
                                    }}
                                >
                                    {day && (
                                        <>
                                            <div className={`text-xs sm:text-sm font-bold mb-0.5 flex-shrink-0 ${isToday ? "text-primary" : isHighlighted ? "text-amber-600" : ""}`}>{format(day, "d")}</div>
                                            <div className="space-y-0.5 text-[8px] sm:text-[9px]">
                                                {(() => {
                                                    const allEvents = [...dayDBevs, ...dayGevs];
                                                    const displayedCount = Math.min(3, allEvents.length);
                                                    const remainingCount = allEvents.length - displayedCount;

                                                    return (
                                                        <>
                                                            {dayDBevs.slice(0, 3).map((de) => (
                                                                <div
                                                                    key={de.id}
                                                                    className={`${getEventTypeColor(de.type)} border rounded px-1 py-0.5 truncate hover:opacity-80 font-medium cursor-pointer text-[7px] sm:text-[8px] transition-opacity`}
                                                                    title={`${de.type}: ${de.title}${de.description ? '\n' + de.description : ''}`}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onEventClick?.(de);
                                                                    }}
                                                                >
                                                                    ✓ {de.title}
                                                                </div>
                                                            ))}
                                                            {dayDBevs.length < 3 && dayGevs.slice(0, 3 - dayDBevs.length).map((ge) => (
                                                                <div
                                                                    key={ge.id}
                                                                    className="bg-blue-100 text-blue-700 border border-blue-200 rounded px-1 py-0.5 truncate font-medium text-[7px] sm:text-[8px] dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800/60"
                                                                    title={ge.title}
                                                                >
                                                                    📅 {ge.title}
                                                                </div>
                                                            ))}
                                                            {remainingCount > 0 && (
                                                                <div className="text-[7px] sm:text-[8px] text-muted-foreground text-center font-medium">
                                                                    ...+{remainingCount}
                                                                </div>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        }))}
                    </div>
                </CardContent>
            </Card>
            {/* 日付詳細ダイアログ */}
            <Dialog open={selectedDate !== null} onOpenChange={(open) => !open && setSelectedDate(null)}>
                <DialogContent className="w-[95vw] sm:max-w-2xl md:max-w-3xl max-h-[85vh] flex flex-col p-4 sm:p-6">
                    <DialogHeader className="flex-shrink-0">
                        <DialogTitle className="text-lg sm:text-xl">
                            {selectedDate ? format(selectedDate, "yyyy年M月d日(E)", { locale: ja }) : ""}
                        </DialogTitle>
                        <DialogDescription className="text-sm sm:text-base">
                            この日付の予定一覧
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-2">
                        {/* 出欠確認予定（その他以外） */}
                        {(() => {
                            const attendanceEvents = selectedDateDBEvents.filter(e => e.type !== "その他");
                            return attendanceEvents.length > 0 ? (
                                <div>
                                    <h3 className="font-semibold text-sm sm:text-base mb-3 flex items-center gap-2 text-green-700 dark:text-green-400">
                                        <div className="w-3 h-3 rounded-full bg-green-500 dark:bg-green-600 flex-shrink-0"></div>
                                        <span>出欠確認予定 ({attendanceEvents.length}件)</span>
                                    </h3>
                                    <div className="space-y-2">
                                        {attendanceEvents.map((event) => (
                                            <div
                                                key={event.id}
                                                className={`p-3 sm:p-4 rounded-lg border border-green-200 bg-green-50 dark:border-green-800/60 dark:bg-green-900/20 ${onEventClick ? 'hover:bg-green-100 cursor-pointer transition-colors dark:hover:bg-green-900/40' : ''}`}
                                            >
                                                <div className="flex items-start justify-between gap-2 sm:gap-3">
                                                    <div
                                                        className="flex-1 min-w-0"
                                                        onClick={() => {
                                                            onEventClick?.(event);
                                                            setSelectedDate(null);
                                                        }}
                                                    >
                                                        <h4 className="font-medium text-sm sm:text-base break-words">{event.title}</h4>
                                                        <Badge variant="outline" className="mt-2 text-xs">
                                                            {event.type}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {onEventClick && <span className="text-lg sm:text-xl flex-shrink-0">→</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null;
                        })()}

                        {/* カレンダーから追加した予定（その他） */}
                        {(() => {
                            const calendarEvents = selectedDateDBEvents.filter(e => e.type === "その他");
                            return calendarEvents.length > 0 ? (
                                <div>
                                    <h3 className="font-semibold text-sm sm:text-base mb-3 flex items-center gap-2 text-blue-700 dark:text-blue-400">
                                        <div className="w-3 h-3 rounded-full bg-blue-500 dark:bg-blue-600 flex-shrink-0"></div>
                                        <span>カレンダー予定 ({calendarEvents.length}件)</span>
                                    </h3>
                                    <div className="space-y-2">
                                        {calendarEvents.map((event) => (
                                            <div
                                                key={event.id}
                                                className={`p-3 sm:p-4 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800/60 dark:bg-blue-900/20 ${onEventClick ? 'hover:bg-blue-100 cursor-pointer transition-colors dark:hover:bg-blue-900/40' : ''}`}
                                            >
                                                <div className="flex items-start justify-between gap-2 sm:gap-3">
                                                    <div
                                                        className="flex-1 min-w-0"
                                                        onClick={() => {
                                                            onEventClick?.(event);
                                                            setSelectedDate(null);
                                                        }}
                                                    >
                                                        <h4 className="font-medium text-sm sm:text-base break-words">{event.title}</h4>
                                                        <Badge variant="outline" className="mt-2 text-xs">
                                                            {event.type}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {onEventClick && <span className="text-lg sm:text-xl flex-shrink-0">→</span>}
                                                        {onDeleteEvent && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onDeleteEvent(event.id);
                                                                }}
                                                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 p-2 rounded transition-colors"
                                                                title="削除"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null;
                        })()}

                        {/* Google Calendar予定 */}
                        {selectedDateGoogleEvents.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-sm sm:text-base mb-3 flex items-center gap-2 text-blue-700 dark:text-blue-400">
                                    <div className="w-3 h-3 rounded-full bg-blue-500 dark:bg-blue-600 flex-shrink-0"></div>
                                    <span>Google Calendar ({selectedDateGoogleEvents.length}件)</span>
                                </h3>
                                <div className="space-y-2">
                                    {selectedDateGoogleEvents.map((event) => (
                                        <div
                                            key={event.id}
                                            className="p-3 sm:p-4 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800/60 dark:bg-blue-900/20"
                                        >
                                            <h4 className="font-medium text-sm sm:text-base break-words">{event.title}</h4>
                                            {event.description && (
                                                <p className="text-xs sm:text-sm text-muted-foreground mt-2 line-clamp-2">
                                                    {event.description}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedDateDBEvents.length === 0 && selectedDateGoogleEvents.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-sm text-muted-foreground">
                                    この日付に予定はありません
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between gap-2 pt-4 border-t flex-shrink-0">
                        {(selectedDateGoogleEvents.length > 0 || (() => {
                            const calendarEvents = selectedDateDBEvents.filter(e => e.type === "その他");
                            return calendarEvents.length > 0;
                        })()) && (
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="flex items-center gap-2"
                                    onClick={() => {
                                        // Google CalendarイベントとカレンダーDB予定を変換して共有
                                        const calendarEvents = selectedDateDBEvents.filter(e => e.type === "その他").map(event => ({
                                            id: event.id,
                                            title: event.title,
                                            description: event.description || "",
                                            startTime: event.dateTime,
                                            endTime: event.dateTime,
                                        }));
                                        const allEventsToShare = [...selectedDateGoogleEvents, ...calendarEvents];
                                        setSelectedGoogleEvents(allEventsToShare);
                                        setClassroomCopyOpen(true);
                                    }}
                                >
                                    <Share2 className="w-4 h-4" />
                                    Classroomに共有
                                </Button>
                            )}
                        <DialogClose asChild>
                            <Button variant="outline" size="sm" className="mt-2">
                                <X className="w-4 h-4 mr-2" />
                                閉じる
                            </Button>
                        </DialogClose>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Google Classroom共有ダイアログ */}
            <ClassroomCopyDialog
                open={classroomCopyOpen}
                onOpenChange={setClassroomCopyOpen}
                events={selectedGoogleEvents}
            />
        </>
    );
}