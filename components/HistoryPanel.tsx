"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Calendar, Clock } from "lucide-react";
import type { Event, Response, ResponseLog, Member } from "@/lib/types";
import { cn } from "@/lib/utils";

interface HistoryPanelProps {
    events: Event[];
    responses: Response[];
    members: Member[];
    logs?: ResponseLog[];
}

export function HistoryPanel({ events, responses, members, logs = [] }: HistoryPanelProps) {
    const [memberHistory, setMemberHistory] = useState<any[]>([]);
    const [sortedEvents, setSortedEvents] = useState<Event[]>([]);

    useEffect(() => {
        // 過去の予定を降順でソート
        const past = events
            .filter((e) => new Date(e.dateTime) < new Date())
            .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

        setSortedEvents(past);

        // メンバーの参加履歴
        const history = members.map((member) => {
            const memberResponses = responses.filter((r) => r.memberId === member.id);
            const attended = memberResponses.filter((r) => r.status === "参加").length;
            const absent = memberResponses.filter((r) => r.status === "不参加").length;
            const late = memberResponses.filter((r) => r.status === "遅れる").length;

            return {
                memberId: member.id,
                memberName: member.name,
                attended,
                absent,
                late,
                rate: memberResponses.length > 0 ? Math.round((attended / memberResponses.length) * 100) : 0,
            };
        });

        setMemberHistory(history);
    }, [events, responses, members]);

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case "参加":
                return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200";
            case "不参加":
                return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200";
            case "遅れる":
                return "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* ヘッダー */}
            <div>
                <h2 className="text-2xl font-bold flex items-center gap-2 section-title">
                    <History className="w-6 h-6 text-primary" />
                    履歴・ログ
                </h2>
                <p className="text-sm text-muted-foreground mt-1">過去の予定とメンバーの参加履歴</p>
            </div>

            {/* メンバー個別参加履歴 */}
            <Card className="border-0 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30">
                    <CardTitle className="section-title">メンバー別参加率</CardTitle>
                    <CardDescription>過去の予定における各メンバーの参加率</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {memberHistory
                            .sort((a, b) => b.rate - a.rate)
                            .map((history) => (
                                <div key={history.memberId} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card card-hover transition-all">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-sm">{history.memberName}</h3>
                                        <div className="text-[10px] label-caps text-muted-foreground mt-1">
                                            参加: {history.attended} / 不参加: {history.absent} / 遅れ: {history.late}
                                        </div>
                                    </div>
                                    <Badge 
                                        className={cn(
                                            "ml-2 rounded-lg font-bold",
                                            history.rate >= 80 
                                                ? "bg-emerald-500 hover:bg-emerald-600" 
                                                : history.rate >= 50 
                                                    ? "bg-amber-500 hover:bg-amber-600" 
                                                    : "bg-rose-500 hover:bg-rose-600"
                                        )}
                                    >
                                        {history.rate}%
                                    </Badge>
                                </div>
                            ))}
                    </div>
                </CardContent>
            </Card>

            {/* 過去の予定一覧 */}
            <Card className="border-0 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30">
                    <CardTitle className="section-title flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        過去の予定
                    </CardTitle>
                    <CardDescription>
                        {sortedEvents.length > 0 ? `${sortedEvents.length}件の過去の予定` : "過去の予定はありません"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    {sortedEvents.length > 0 ? (
                        <div className="space-y-4">
                            {sortedEvents.slice(0, 10).map((event) => {
                                const eventResponses = responses.filter((r) => r.eventId === event.id);
                                const attended = eventResponses.filter((r) => r.status === "参加").length;
                                const absent = eventResponses.filter((r) => r.status === "不参加").length;
                                const late = eventResponses.filter((r) => r.status === "遅れる").length;
                                const unanswered = members.length - eventResponses.length;

                                return (
                                    <div key={event.id} className="p-4 rounded-xl border border-border/50 bg-card card-hover transition-all space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-bold text-base">{event.title}</h3>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                                                    <Clock className="w-3 h-3" />
                                                    {format(new Date(event.dateTime), "yyyy年M月d日 HH:mm", { locale: ja })}
                                                </p>
                                            </div>
                                            <Badge variant="secondary" className="font-normal">{event.type}</Badge>
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            <Badge className={cn("rounded-lg text-[10px] py-0 h-5 font-medium", getStatusBadgeColor("参加"))}>参加: {attended}</Badge>
                                            <Badge className={cn("rounded-lg text-[10px] py-0 h-5 font-medium", getStatusBadgeColor("遅れる"))}>遅れ: {late}</Badge>
                                            <Badge className={cn("rounded-lg text-[10px] py-0 h-5 font-medium", getStatusBadgeColor("不参加"))}>不参加: {absent}</Badge>
                                            <Badge variant="outline" className="rounded-lg text-[10px] py-0 h-5 font-medium">未回答: {unanswered}</Badge>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-12">過去の予定はありません</p>
                    )}
                </CardContent>
            </Card>

            {/* 回答変更ログ */}
            {logs.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>回答の変更履歴</CardTitle>
                        <CardDescription>最近の回答変更</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm">
                            {logs.slice(0, 20).map((log) => (
                                <div
                                    key={log.id}
                                    className="p-2 border rounded flex items-center justify-between"
                                >
                                    <div>
                                        <p className="font-medium">
                                            {members.find((m) => m.id === log.memberId)?.name || "不明"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {format(new Date(log.changedAt), "yyyy-MM-dd HH:mm", { locale: ja })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {log.previousStatus && (
                                            <Badge variant="outline" className="text-xs">
                                                {log.previousStatus}
                                            </Badge>
                                        )}
                                        <span className="text-xs">→</span>
                                        <Badge className="text-xs">{log.newStatus}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
