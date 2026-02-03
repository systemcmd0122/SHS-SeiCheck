"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Calendar } from "lucide-react";
import type { Event, Response, ResponseLog, Member } from "@/lib/types";

interface HistoryPanelProps {
    events: Event[];
    responses: Response[];
    members: Member[];
    logs?: ResponseLog[];
}

export function HistoryPanel({ events, responses, members, logs = [] }: HistoryPanelProps) {
    const [memberHistory, setMemberHistory] = useState<any[]>([]);
    const [sortedEvents, setSortedEvents] = useState<Event[]>([]);

    const safeFormat = (dateStr: string | undefined, formatStr: string) => {
        if (!dateStr) return "---";
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return "---";
            return format(date, formatStr, { locale: ja });
        } catch (e) {
            return "---";
        }
    };

    useEffect(() => {
        // 過去の予定を降順でソート
        const past = events
            .filter((e) => {
                const date = new Date(e.dateTime);
                return !isNaN(date.getTime()) && date < new Date();
            })
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
        <div className="space-y-6">
            {/* ヘッダー */}
            <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <History className="w-6 h-6" />
                    履歴・ログ
                </h2>
                <p className="text-sm text-muted-foreground mt-1">過去の予定とメンバーの参加履歴</p>
            </div>

            {/* メンバー個別参加履歴 */}
            <Card>
                <CardHeader>
                    <CardTitle>メンバー別参加率</CardTitle>
                    <CardDescription>過去の予定における各メンバーの参加率</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {memberHistory
                            .sort((a, b) => b.rate - a.rate)
                            .map((history) => (
                                <div key={history.memberId} className="flex items-center justify-between p-3 border rounded">
                                    <div className="flex-1">
                                        <h3 className="font-medium">{history.memberName}</h3>
                                        <div className="text-sm text-muted-foreground mt-1">
                                            参加: {history.attended} | 不参加: {history.absent} | 遅れる: {history.late}
                                        </div>
                                    </div>
                                    <Badge className="ml-2" variant={history.rate >= 80 ? "default" : "secondary"}>
                                        {history.rate}%
                                    </Badge>
                                </div>
                            ))}
                    </div>
                </CardContent>
            </Card>

            {/* 過去の予定一覧 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        過去の予定
                    </CardTitle>
                    <CardDescription>
                        {sortedEvents.length > 0 ? `${sortedEvents.length}件の過去の予定` : "過去の予定はありません"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {sortedEvents.length > 0 ? (
                        <div className="space-y-3">
                            {sortedEvents.slice(0, 10).map((event) => {
                                const eventResponses = responses.filter((r) => r.eventId === event.id);
                                const attended = eventResponses.filter((r) => r.status === "参加").length;
                                const absent = eventResponses.filter((r) => r.status === "不参加").length;
                                const late = eventResponses.filter((r) => r.status === "遅れる").length;
                                const unanswered = members.length - eventResponses.length;

                                return (
                                    <div key={event.id} className="border rounded p-4 space-y-2">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-medium">{event.title}</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {safeFormat(event.dateTime, "yyyy年M月d日 HH:mm")}
                                                </p>
                                            </div>
                                            <Badge variant="outline">{event.type}</Badge>
                                        </div>
                                        <div className="flex gap-2 flex-wrap text-sm">
                                            <Badge className={getStatusBadgeColor("参加")}>参加: {attended}</Badge>
                                            <Badge className={getStatusBadgeColor("不参加")}>不参加: {absent}</Badge>
                                            <Badge className={getStatusBadgeColor("遅れる")}>遅れる: {late}</Badge>
                                            <Badge variant="secondary">未回答: {unanswered}</Badge>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-6">過去の予定はありません</p>
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
                                            {safeFormat(log.changedAt, "yyyy-MM-dd HH:mm")}
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
