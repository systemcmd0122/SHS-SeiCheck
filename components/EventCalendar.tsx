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
        try {
            const dStr = format(date, "yyyy-MM-dd");
            return googleEvents.filter((e) => {
                try {
                    if (!e.startTime) return false;
                    const startTime = new Date(e.startTime);
                    if (isNaN(startTime.getTime())) return false;
                    return format(startTime, "yyyy-MM-dd") === dStr;
                } catch {
                    return false;
                }
            });
        } catch {
            return [];
        }
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
        try {
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
        } catch {
            return [];
        }
    };

    const selectedDateDBEvents = selectedDate ? getDBEventsForDate(selectedDate) : [];
    const selectedDateGoogleEvents = selectedDate ? getGoogleEventsForDate(selectedDate) : [];

    const safeFormat = (date: Date | string | null | undefined, formatStr: string) => {
        if (!date) return "";
        try {
            const d = typeof date === "string" ? new Date(date) : date;
            if (isNaN(d.getTime())) return "";
            return format(d, formatStr, { locale: ja });
        } catch {
            return "";
        }
    };

    return (
        <>
            <Card className={`border-0 shadow-md ${compact ? "h-fit" : ""}`}>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-2 pb-3 sm:pb-6">
                    <CardTitle className={`font-bold ${compact ? "text-lg" : "text-xl md:text-2xl"}`}>
                        {safeFormat(currentDate, "yyyy年M月")}
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
                            const dateStr = day ? safeFormat(day, "yyyy-MM-dd") : "";
                            const isHighlighted = highlightDates.includes(dateStr);
                            const hasEvents = dayDBevs.length > 0 || dayGevs.length > 0;

                            return (
                                <div
                                    key={`${wi}-${di}`}
                                    className={`h-[80px] sm:h-[110px] w-full p-1 sm:p-1.5 rounded-lg border transition-all overflow-hidden flex flex-col group ${!day ? "bg-muted/5 opacity-30" : isHighlighted ? "border-amber-400 bg-amber-50 shadow-md hover:shadow-sm dark:border-amber-700 dark:bg-amber-900/30" : isToday ? "border-primary bg-primary/5 shadow-inner dark:bg-primary/10" : "border-muted bg-card hover:border-primary/40 dark:bg-slate-800/50"} ${(hasEvents || day) ? "cursor-pointer active:scale-95" : ""}`}
                                    onClick={() => {
                                        if (day) setSelectedDate(day);
                                    }}
                                >
                                    {day && (
                                        <>
                                            <div className={`text-[10px] sm:text-xs font-black mb-1 flex-shrink-0 ${isToday ? "text-primary underline underline-offset-2" : isHighlighted ? "text-amber-600" : "text-muted-foreground"}`}>{safeFormat(day, "d")}</div>
                                            
                                            {/* モバイル用ドット表示 (sm以下) */}
                                            <div className="flex flex-wrap gap-0.5 mt-auto sm:hidden">
                                                {dayDBevs.map((de) => (
                                                    <div key={de.id} className={`w-1.5 h-1.5 rounded-full ${de.isAttendanceRequired !== false ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                                                ))}
                                                {dayGevs.map((ge) => (
                                                    <div key={ge.id} className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                ))}
                                            </div>

                                            {/* デスクトップ用テキスト表示 (sm以上) */}
                                            <div className="hidden sm:block space-y-0.5 text-[9px]">
                                                {(() => {
                                                    const allEvents = [...dayDBevs, ...dayGevs];
                                                    const displayedCount = Math.min(3, allEvents.length);
                                                    const remainingCount = allEvents.length - displayedCount;

                                                    return (
                                                        <>
                                                            {dayDBevs.slice(0, 3).map((de) => (
                                                                <div
                                                                    key={de.id}
                                                                    className={`${getEventTypeColor(de.type)} border rounded px-1 py-0.5 truncate hover:opacity-80 font-bold cursor-pointer transition-opacity flex items-center gap-1 shadow-sm`}
                                                                    title={`${de.isAttendanceRequired !== false ? '[出欠確認] ' : ''}${de.type}: ${de.title}${de.description ? '\n' + de.description : ''}`}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onEventClick?.(de);
                                                                    }}
                                                                >
                                                                    <span className="shrink-0">{de.isAttendanceRequired !== false ? '*' : '-'}</span>
                                                                    <span className="truncate">{de.title}</span>
                                                                </div>
                                                            ))}
                                                            {dayDBevs.length < 3 && dayGevs.slice(0, 3 - dayDBevs.length).map((ge) => (
                                                                <div
                                                                    key={ge.id}
                                                                    className="bg-blue-100 text-blue-700 border border-blue-200 rounded px-1 py-0.5 truncate font-bold text-[8px] dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800/60 shadow-sm"
                                                                    title={ge.title}
                                                                >
                                                                    {ge.title}
                                                                </div>
                                                            ))}
                                                            {remainingCount > 0 && (
                                                                <div className="text-[8px] font-black text-muted-foreground/60 text-center uppercase tracking-tighter pt-1">
                                                                    他 {remainingCount} 件
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
                <DialogContent className="w-[92vw] sm:max-w-2xl md:max-w-3xl max-h-[85vh] flex flex-col p-6 rounded-lg border-none shadow-sm">
                    <DialogHeader className="flex-shrink-0 space-y-1">
                        <DialogTitle className="text-xl sm:text-2xl font-black italic tracking-tighter text-primary uppercase">
                            {safeFormat(selectedDate, "M月d日 (E)")}
                        </DialogTitle>
                        <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                            この日の予定
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto space-y-8 py-6 pr-2">
                        {/* 出欠確認予定（その他以外、または isAttendanceRequired === true） */}
                        {(() => {
                            const attendanceEvents = selectedDateDBEvents.filter(e => e.isAttendanceRequired !== false);
                            return attendanceEvents.length > 0 ? (
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        出欠確認 ({attendanceEvents.length})
                                    </h3>
                                    <div className="space-y-3">
                                        {attendanceEvents.map((event) => (
                                            <div
                                                key={event.id}
                                                className={`group p-4 rounded-lg border border-emerald-100 bg-emerald-50/30 dark:border-emerald-900/30 dark:bg-emerald-950/20 ${onEventClick ? 'hover:shadow-sm hover:bg-emerald-50 cursor-pointer transition-all active:scale-[0.98] dark:hover:bg-emerald-900/40' : ''}`}
                                                onClick={() => {
                                                    onEventClick?.(event);
                                                    setSelectedDate(null);
                                                }}
                                            >
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-black text-sm sm:text-lg break-words group-hover:text-emerald-700 transition-colors">{event.title}</h4>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-white/50 dark:bg-black/20">
                                                                {event.type}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    {onEventClick && <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                                        <ChevronRight className="w-5 h-5" />
                                                    </div>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null;
                        })()}

                        {/* カレンダーのみの予定（isAttendanceRequired === false） */}
                        {(() => {
                            const calendarEvents = selectedDateDBEvents.filter(e => e.isAttendanceRequired === false);
                            return calendarEvents.length > 0 ? (
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                        その他の予定 ({calendarEvents.length})
                                    </h3>
                                    <div className="space-y-3">
                                        {calendarEvents.map((event) => (
                                            <div
                                                key={event.id}
                                                className={`group p-4 rounded-lg border border-blue-100 bg-blue-50/30 dark:border-blue-900/30 dark:bg-blue-950/20 ${onEventClick ? 'hover:shadow-sm hover:bg-blue-50 cursor-pointer transition-all active:scale-[0.98] dark:hover:bg-blue-900/40' : ''}`}
                                                onClick={() => {
                                                    onEventClick?.(event);
                                                    setSelectedDate(null);
                                                }}
                                            >
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-black text-sm sm:text-lg break-words group-hover:text-blue-700 transition-colors">{event.title}</h4>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-white/50 dark:bg-black/20">
                                                                {event.type}
                                                            </Badge>
                                                            <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-widest">
                                                                表示のみ
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {onDeleteEvent && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onDeleteEvent(event.id);
                                                                }}
                                                                className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 p-2 rounded-full transition-all"
                                                                title="削除"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {onEventClick && <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
                                                            <ChevronRight className="w-5 h-5" />
                                                        </div>}
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
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 dark:text-blue-400 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                    Google Calendar ({selectedDateGoogleEvents.length})
                                </h3>
                                <div className="space-y-3">
                                    {selectedDateGoogleEvents.map((event) => (
                                        <div
                                            key={event.id}
                                            className="p-4 rounded-lg border border-muted bg-muted/20"
                                        >
                                            <h4 className="font-bold text-sm sm:text-base break-words">{event.title}</h4>
                                            {event.description && (
                                                <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic font-medium">
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
                            const calendarEvents = selectedDateDBEvents.filter(e => e.isAttendanceRequired === false);
                            return calendarEvents.length > 0;
                        })()) && (
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="flex items-center gap-2"
                                    onClick={() => {
                                        // Google CalendarイベントとカレンダーDB予定を変換して共有
                                        const calendarEvents = selectedDateDBEvents.filter(e => e.isAttendanceRequired === false).map(event => ({
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
