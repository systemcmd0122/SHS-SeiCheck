"use client";

import { format, isSameDay } from "date-fns";
import { ja } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

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
        <Card className="border-0 shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    今日の予定
                </CardTitle>
                <CardDescription>
                    {(() => {
                        try {
                            return format(today, "yyyy年M月d日(E)", { locale: ja });
                        } catch {
                            return "今日";
                        }
                    })()}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {todayEvents.length === 0 ? (
                    <div className="py-8 text-center">
                        <p className="text-muted-foreground">今日の予定はありません</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {todayEvents.map((event) => (
                            <div
                                key={event.id}
                                className={`p-4 rounded-lg border border-green-200 bg-green-50 dark:border-green-800/60 dark:bg-green-900/20 ${onEventClick ? 'hover:bg-green-100 cursor-pointer transition-colors dark:hover:bg-green-900/40' : ''}`}
                                onClick={() => onEventClick?.(event)}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-base mb-2">
                                            {event.title}
                                        </h3>
                                        <Badge variant="outline" className="text-xs">
                                            {event.type}
                                        </Badge>
                                    </div>
                                    {onEventClick && <span className="text-xl text-green-600 dark:text-green-400 flex-shrink-0">→</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
