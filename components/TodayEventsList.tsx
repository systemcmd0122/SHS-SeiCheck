"use client";

import { format, isSameDay } from "date-fns";
import { ja } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronRight } from "lucide-react";

interface TodayEventsListProps {
    events: any[];
    onEventClick?: (event: any) => void;
}

export function TodayEventsList({ events, onEventClick }: TodayEventsListProps) {
    const today = new Date();
    const todayEvents = events.filter((e) => {
        try {
            const dateTime = e.dateTime || e.startTime;
            if (!dateTime) return false;
            const eventDate = new Date(dateTime);
            if (isNaN(eventDate.getTime())) return false;
            return isSameDay(eventDate, today);
        } catch {
            return false;
        }
    }).sort((a, b) => {
        const aTime = a.dateTime || a.startTime;
        const bTime = b.dateTime || b.startTime;
        return new Date(aTime).getTime() - new Date(bTime).getTime();
    });

    return (
        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Calendar className="w-24 h-24" />
            </div>
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-primary font-black italic uppercase tracking-tighter">
                    <Calendar className="w-5 h-5" />
                    今日の予定
                </CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                    {format(today, "yyyy.MM.dd (EEE)", { locale: ja })}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {todayEvents.length === 0 ? (
                    <div className="py-10 text-center bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
                        <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">今日の予定はありません</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {todayEvents.map((event) => (
                            <div
                                key={event.id}
                                className={`group p-4 rounded-2xl border border-primary/10 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm shadow-sm transition-all ${onEventClick ? 'hover:shadow-lg hover:bg-white dark:hover:bg-gray-900 cursor-pointer active:scale-[0.98]' : ''}`}
                                onClick={() => onEventClick?.(event)}
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-black text-sm sm:text-base mb-2 group-hover:text-primary transition-colors">
                                            {event.title}
                                        </h3>
                                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-white/50 dark:bg-black/20">
                                            {event.type}
                                        </Badge>
                                    </div>
                                    {onEventClick && <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:translate-x-1 transition-transform">
                                        <ChevronRight className="w-5 h-5" />
                                    </div>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
