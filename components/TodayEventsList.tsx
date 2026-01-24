"use client";

import { format, isSameDay } from "date-fns";
import { ja } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar } from "lucide-react";

interface TodayEventsListProps {
    events: any[];
    onEventClick?: (event: any) => void;
}

export function TodayEventsList({ events, onEventClick }: TodayEventsListProps) {
    const today = new Date();
    const todayEvents = events.filter((e) => {
        try {
            if (!e.dateTime) return false;
            const eventDate = new Date(e.dateTime);
            if (isNaN(eventDate.getTime())) return false;
            return isSameDay(eventDate, today);
        } catch {
            return false;
        }
    }).sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

    return (
        <Card className="border-0 shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    今日の予定
                </CardTitle>
                <CardDescription>
                    {format(today, "yyyy年M月d日(E)", { locale: ja })}
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
                                className="p-4 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 cursor-pointer transition-colors dark:border-green-800/60 dark:bg-green-900/20 dark:hover:bg-green-900/40"
                                onClick={() => onEventClick?.(event)}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-base mb-2">
                                            {event.title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                            <Clock className="w-4 h-4" />
                                            <span>
                                                {format(new Date(event.dateTime), "HH:mm", { locale: ja })}
                                            </span>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                            {event.type}
                                        </Badge>
                                    </div>
                                    <span className="text-xl text-green-600 dark:text-green-400 flex-shrink-0">→</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
