"use client";

import { useState, useEffect } from "react";
import { format, differenceInHours } from "date-fns";
import { ja } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import type { Event, Response, Member } from "@/lib/types";

interface ReminderPanelProps {
    events: Event[];
    responses: Response[];
    members: Member[];
}

export function ReminderPanel({ events, responses, members }: ReminderPanelProps) {
    const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);
    const [unansweredMembers, setUnansweredMembers] = useState<any[]>([]);

    useEffect(() => {
        const now = new Date();

        // 締切が近い予定を検出
        const upcomingDeadlinesList = events
            .filter((event) => {
                const deadline = new Date(event.deadline);
                return deadline > now && differenceInHours(deadline, now) <= 24;
            })
            .map((event) => {
                const deadline = new Date(event.deadline);
                const hoursUntilDeadline = Math.round(differenceInHours(deadline, now) * 10) / 10;

                // この予定の未回答メンバーを取得
                const eventResponses = responses.filter((r) => r.eventId === event.id);
                const respondedMemberIds = eventResponses.map((r) => r.memberId);
                const unanswered = members.filter((m) => !respondedMemberIds.includes(m.id));

                return {
                    event,
                    hoursUntilDeadline,
                    unansweredCount: unanswered.length,
                    unanswered,
                };
            })
            .sort((a, b) => a.hoursUntilDeadline - b.hoursUntilDeadline);

        setUpcomingDeadlines(upcomingDeadlinesList);

        // 全予定の未回答メンバーを集計
        const unansweredMap: Record<string, number> = {};
        members.forEach((member) => {
            const answeredEventIds = new Set(
                responses.filter((r) => r.memberId === member.id).map((r) => r.eventId)
            );

            const unansweredCount = events.filter((event) => !answeredEventIds.has(event.id)).length;
            if (unansweredCount > 0) {
                unansweredMap[member.id] = unansweredCount;
            }
        });

        const unansweredList = Object.entries(unansweredMap)
            .map(([memberId, count]) => ({
                member: members.find((m) => m.id === memberId),
                unansweredCount: count,
            }))
            .filter((item) => item.member)
            .sort((a, b) => b.unansweredCount - a.unansweredCount);

        setUnansweredMembers(unansweredList);
    }, [events, responses, members]);

    const getUrgencyColor = (hoursUntilDeadline: number) => {
        if (hoursUntilDeadline <= 2) return "bg-red-100 border-red-300 dark:bg-red-950 dark:border-red-800";
        if (hoursUntilDeadline <= 6) return "bg-orange-100 border-orange-300 dark:bg-orange-950 dark:border-orange-800";
        return "bg-yellow-100 border-yellow-300 dark:bg-yellow-950 dark:border-yellow-800";
    };

    const getUrgencyBadge = (hoursUntilDeadline: number) => {
        if (hoursUntilDeadline <= 2) return "緊急";
        if (hoursUntilDeadline <= 6) return "注意";
        return "予定あり";
    };

    return (
        <div className="space-y-6">
            {/* ヘッダー */}
            <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Bell className="w-6 h-6" />
                    通知・リマインダー
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                    締切が近い予定と未回答者の管理
                </p>
            </div>

            {/* 締切アラート */}
            {upcomingDeadlines.length > 0 && (
                <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-500" />
                            回答期限切れ間近
                        </CardTitle>
                        <CardDescription className="text-red-700 dark:text-red-300">24時間以内に期限を迎える予定</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {upcomingDeadlines.map(({ event, hoursUntilDeadline, unansweredCount }) => (
                                <Alert key={event.id} className={`border-2 ${getUrgencyColor(hoursUntilDeadline)}`}>
                                    <AlertDescription className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold">{event.title}</p>
                                            <p className="text-sm mt-1">
                                                期限: {format(new Date(event.deadline), "M月d日 HH:mm", { locale: ja })}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                未回答者: {unansweredCount}名
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <Badge
                                                variant={
                                                    hoursUntilDeadline <= 2
                                                        ? "destructive"
                                                        : hoursUntilDeadline <= 6
                                                            ? "secondary"
                                                            : "default"
                                                }
                                            >
                                                {Math.floor(hoursUntilDeadline)}時間後
                                            </Badge>
                                            <p className="text-xs mt-2">{getUrgencyBadge(hoursUntilDeadline)}</p>
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 未回答者リスト */}
            {unansweredMembers.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            未回答メンバー
                        </CardTitle>
                        <CardDescription>
                            {unansweredMembers.length}名が回答を待っている予定があります
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {unansweredMembers.map(({ member, unansweredCount }) => (
                                <div
                                    key={member?.id}
                                    className="flex items-center justify-between p-3 border rounded"
                                >
                                    <div>
                                        <p className="font-medium">{member?.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {unansweredCount}件の予定に未回答
                                        </p>
                                    </div>
                                    <Button size="sm" variant="outline">
                                        リマインド送信
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* リマインダー情報 */}
            <Alert>
                <Bell className="h-4 w-4" />
                <AlertDescription>
                    <strong>リマインダー機能について:</strong>
                    <ul className="mt-2 space-y-1 text-sm ml-4 list-disc">
                        <li>締切前24時間のアラート表示（自動）</li>
                        <li>未回答メンバーへのリマインド通知（手動送信可能）</li>
                        <li>将来：メール通知機能の追加予定</li>
                    </ul>
                </AlertDescription>
            </Alert>

            {/* 通知なし */}
            {upcomingDeadlines.length === 0 && unansweredMembers.length === 0 && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <CheckCircle2 className="w-12 h-12 text-green-600 mb-4" />
                            <p className="font-medium">すべて対応済みです</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                期限が近い予定や未回答者はいません
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
