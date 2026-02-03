"use client";

import { useEffect, useState } from "react";
import Papa from "papaparse";
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, TrendingUp } from "lucide-react";
import type { Event, Response } from "@/lib/types";
import { calculateAttendanceRate, generateChartData, aggregateAbsenceReasons } from "@/lib/statistics";
import { members } from "@/lib/members";

interface StatisticsProps {
    events: Event[];
    responses: Response[];
}

const COLORS = ["#22c55e", "#ef4444", "#f97316", "#gray"];

export function StatisticsPanel({ events, responses }: StatisticsProps) {
    const [chartData, setChartData] = useState<any[]>([]);
    const [absenceReasons, setAbsenceReasons] = useState<Record<string, number>>({});

    useEffect(() => {
        setChartData(generateChartData(events, responses, members.length));
        setAbsenceReasons(aggregateAbsenceReasons(responses));
    }, [events, responses]);

    /**
     * CSV エクスポート機能
     */
    const exportToCSV = () => {
        const data = events.map((event) => {
            const eventResponses = responses.filter((r) => r.eventId === event.id);
            const { attended, absent, late, unanswered, rate } = calculateAttendanceRate(
                eventResponses,
                members.length
            );

            return {
                "予定名": event.title,
                "日時": new Date(event.dateTime).toLocaleDateString("ja-JP"),
                "種類": event.type,
                "参加": attended,
                "不参加": absent,
                "遅れる": late,
                "未回答": unanswered,
                "参加率": `${rate}%`,
            };
        });

        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute("download", `attendance-report-${new Date().toISOString().split("T")[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* ヘッダー */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 section-title">
                        <TrendingUp className="w-6 h-6 text-primary" />
                        統計・レポート
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">出欠状況の分析と可視化</p>
                </div>
                <Button onClick={exportToCSV} className="gap-2 rounded-xl shadow-sm">
                    <Download className="w-4 h-4" />
                    CSV エクスポート
                </Button>
            </div>

            {/* 全体統計 */}
            {events.length > 0 && (() => {
                const lastEvent = events[events.length - 1];
                const lastEventResponses = responses.filter((r) => r.eventId === lastEvent.id);
                const { rate, attended, absent, late, unanswered } = calculateAttendanceRate(
                    lastEventResponses,
                    members.length
                );

                return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="border-0 shadow-sm card-hover bg-primary/5">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold label-caps text-muted-foreground">参加率</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-primary">{rate}%</div>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    {attended}/{members.length} 人
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm card-hover bg-emerald-50/50 dark:bg-emerald-950/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold label-caps text-muted-foreground">参加</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{attended}</div>
                                <p className="text-[10px] text-muted-foreground mt-1 text-emerald-600/70">参加予定</p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm card-hover bg-rose-50/50 dark:bg-rose-950/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold label-caps text-muted-foreground">不参加</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-rose-600 dark:text-rose-400">{absent}</div>
                                <p className="text-[10px] text-muted-foreground mt-1 text-rose-600/70">不参加</p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm card-hover bg-amber-50/50 dark:bg-amber-950/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold label-caps text-muted-foreground">遅れる</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{late}</div>
                                <p className="text-[10px] text-muted-foreground mt-1 text-amber-600/70">遅刻予定</p>
                            </CardContent>
                        </Card>
                    </div>
                );
            })()}

            {/* 棒グラフ */}
            {chartData.length > 0 && (
                <Card className="border-0 shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/30">
                        <CardTitle className="section-title">出欠人数の推移</CardTitle>
                        <CardDescription>最新10件の予定の出欠状況</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                <XAxis dataKey="title" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend iconType="circle" />
                                <Bar dataKey="attended" fill="#10b981" name="参加" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="absent" fill="#f43f5e" name="不参加" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="late" fill="#f59e0b" name="遅れる" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="unanswered" fill="#94a3b8" name="未回答" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* 円グラフ */}
            {events.slice(-1).map((lastEvent) => {
                const lastEventResponses = responses.filter((r) => r.eventId === lastEvent.id);
                const { attended, absent, late, unanswered } = calculateAttendanceRate(
                    lastEventResponses,
                    members.length
                );

                const pieData = [
                    { name: "参加", value: attended },
                    { name: "不参加", value: absent },
                    { name: "遅れる", value: late },
                    { name: "未回答", value: unanswered },
                ].filter((d) => d.value > 0);

                return (
                    <Card key={lastEvent.id}>
                        <CardHeader>
                            <CardTitle>最新予定の出欠状況</CardTitle>
                            <CardDescription>{lastEvent.title}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, value }) => `${name}: ${value}`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                );
            })}

            {/* 欠席理由の分析 */}
            {Object.keys(absenceReasons).length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>欠席理由の分析</CardTitle>
                        <CardDescription>よくある欠席の理由</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {Object.entries(absenceReasons)
                                .sort((a, b) => b[1] - a[1])
                                .map(([reason, count]) => (
                                    <div key={reason} className="flex items-center justify-between">
                                        <span className="text-sm">{reason}</span>
                                        <Badge variant="secondary">{count}件</Badge>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
