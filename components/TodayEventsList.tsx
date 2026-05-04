"use client";

import { format, isSameDay } from "date-fns";
import { ja } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronRight } from "lucide-react";
import { EventListSkeleton } from "./Loading";

interface Event {
    id: string;
    title: string;
    type: string;
    dateTime?: string;
    startTime?: string;
    [key: string]: unknown;
}

interface TodayEventsListProps {
    events: Event[];
    onEventClick?: (event: Event) => void;
    isLoading?: boolean;
}

export function TodayEventsList({ events, onEventClick, isLoading }: TodayEventsListProps) {
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
        const aTime = a.dateTime || a.startTime || "";
        const bTime = b.dateTime || b.startTime || "";
        return new Date(aTime).getTime() - new Date(bTime).getTime();
    });

    return (
        <Card className="border shadow-sm overflow-hidden bg-card">
            <CardHeader className="pb-3 border-b bg-muted/30">
                <CardTitle className="flex items-center gap-2 text-sm font-bold">
                    <Calendar className="w-4 h-4 text-primary" />
                    今日の予定
                </CardTitle>
                <CardDescription className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {format(today, "yyyy.MM.dd (EEE)", { locale: ja })}
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
                {isLoading ? (
                    <EventListSkeleton />
                ) : todayEvents.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                        <p className="text-xs">今日の予定はありません</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {todayEvents.map((event) => (
                            <div
                                key={event.id}
                                className={`p-3 rounded-lg border bg-background transition-colors ${onEventClick ? 'hover:bg-muted cursor-pointer' : ''}`}
                                onClick={() => onEventClick?.(event)}
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-sm truncate">
                                            {event.title}
                                        </h3>
                                        <Badge variant="outline" className="text-[9px] h-4 mt-1">
                                            {event.type}
                                        </Badge>
                                    </div>
                                    {onEventClick && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
