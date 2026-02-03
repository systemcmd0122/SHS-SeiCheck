"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
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
import { Calendar, FileText, ClipboardCheck } from "lucide-react";

interface ChartData {
    name: string;
    value: number;
    percentage?: number;
}

interface AttendanceChartProps {
    data: {
        attended: number;
        delayed: number;
        absent: number;
        unanswered: number;
    };
    title?: string;
}

interface AttendanceRateChartProps {
    data: Array<{
        name: string;
        rate: number;
    }>;
    title?: string;
}

interface TrendChartProps {
    data: Array<{
        date: string;
        responseRate: number;
        attendanceRate: number;
    }>;
    title?: string;
}

const COLORS = {
    attended: "#10b981",
    delayed: "#f59e0b",
    absent: "#ef4444",
    unanswered: "#6b7280",
};

/**
 * カスタムツールチップコンポーネント（ダークモード対応）
 */
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-slate-900 p-2 rounded border border-gray-200 dark:border-slate-700 shadow-lg">
                <p className="text-gray-900 dark:text-gray-100 text-sm font-medium">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={`item-${index}`} style={{ color: entry.color }} className="text-sm">
                        {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

/**
 * 出欠状況の円グラフ
 */
export function AttendanceChart({ data, title = "出欠状況" }: AttendanceChartProps) {
    const chartData = [
        { name: "参加", value: data.attended, color: COLORS.attended },
        { name: "遅刻", value: data.delayed, color: COLORS.delayed },
        { name: "不参加", value: data.absent, color: COLORS.absent },
        { name: "未回答", value: data.unanswered, color: COLORS.unanswered },
    ];

    const total = data.attended + data.delayed + data.absent + data.unanswered;

    return (
        <Card className="shadow-sm border-0 overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="section-title">{title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={100}
                            innerRadius={60}
                            paddingAngle={2}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-6 mt-8 p-4 bg-muted/20 rounded-xl">
                    <div className="text-center border-r border-border/50">
                        <p className="text-xs label-caps text-muted-foreground mb-1">参加率</p>
                        <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                            {total > 0 ? (((data.attended + data.delayed) / total) * 100).toFixed(1) : 0}%
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs label-caps text-muted-foreground mb-1">回答率</p>
                        <p className="text-3xl font-bold text-primary">
                            {total > 0 ? (((total - data.unanswered) / total) * 100).toFixed(1) : 0}%
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * 出欠率の比較グラフ
 */
export function AttendanceRateChart({ data, title = "メンバー出欠率" }: AttendanceRateChartProps) {
    return (
        <Card className="shadow-sm border-0 overflow-hidden">
            <CardHeader className="bg-muted/30">
                <CardTitle className="section-title">{title}</CardTitle>
                <CardDescription>各メンバーの出欠率を比較</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis
                            dataKey="name"
                            angle={-45}
                            textAnchor="end"
                            height={100}
                            tick={{ fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                        <Bar 
                            dataKey="rate" 
                            fill={COLORS.attended} 
                            name="出欠率" 
                            radius={[4, 4, 0, 0]}
                            barSize={32}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

/**
 * トレンドグラフ（回答率と出席率の推移）
 */
export function TrendChart({ data, title = "トレンド分析" }: TrendChartProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>時間経過による出欠回答の推移</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="responseRate"
                            stroke={COLORS.attended}
                            name="回答率"
                            strokeWidth={2}
                        />
                        <Line
                            type="monotone"
                            dataKey="attendanceRate"
                            stroke={COLORS.delayed}
                            name="出欠率"
                            strokeWidth={2}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

/**
 * 詳細統計パネル
 */
interface DetailedStatsProps {
    title: string;
    stats: Array<{
        label: string;
        value: string | number;
        color?: string;
        icon?: React.ReactNode;
    }>;
}

export function DetailedStatistics({ title, stats }: DetailedStatsProps) {
    return (
        <Card className="shadow-sm border-0 overflow-hidden">
            <CardHeader className="bg-muted/30">
                <CardTitle className="section-title">{title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.map((stat, index) => (
                        <div key={index} className="p-5 rounded-2xl bg-muted/40 card-hover transition-all">
                            <div className="flex items-center gap-3 mb-3">
                                {stat.icon && <div className="text-primary">{stat.icon}</div>}
                                <p className="text-xs label-caps text-muted-foreground">{stat.label}</p>
                            </div>
                            <p className="text-3xl font-bold tracking-tight" style={{ color: stat.color }}>
                                {stat.value}
                            </p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * 予定詳細情報パネル
 */
interface EventDetailProps {
    event: {
        id: string;
        title: string;
        type: string;
        dateTime: string;
        deadline: string;
        description?: string;
        createdBy: string;
    };
    statistics: {
        attended: number;
        delayed: number;
        absent: number;
        unanswered: number;
    };
}

export function EventDetailPanel({ event, statistics }: EventDetailProps) {
    const total = statistics.attended + statistics.delayed + statistics.absent + statistics.unanswered;
    const responseCount = statistics.attended + statistics.delayed + statistics.absent;

    return (
        <Card className="w-full shadow-sm border-0 overflow-hidden">
            <CardHeader className="bg-muted/30">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <CardTitle className="section-title text-xl">{event.title}</CardTitle>
                        <CardDescription className="mt-1 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(event.dateTime), "yyyy年MM月dd日 HH:mm", { locale: ja })}
                        </CardDescription>
                    </div>
                    <Badge variant="secondary" className="font-normal shrink-0">{event.type}</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h4 className="text-xs label-caps text-muted-foreground flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5" />
                            詳細情報
                        </h4>
                        <div className="space-y-3 bg-muted/20 p-4 rounded-xl text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">回答期限</span>
                                <span className="font-medium">{format(new Date(event.deadline), "MM/dd HH:mm", { locale: ja })}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">作成者</span>
                                <span className="font-medium">{event.createdBy}</span>
                            </div>
                            {event.description && (
                                <div className="pt-2 mt-2 border-t border-border/50">
                                    <span className="text-muted-foreground block mb-1">説明</span>
                                    <p className="text-foreground leading-relaxed">{event.description}</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-xs label-caps text-muted-foreground flex items-center gap-2">
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            回答状況
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                                <span className="text-xs text-emerald-700 dark:text-emerald-400 block mb-1">参加</span>
                                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{statistics.attended}人</span>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-100 dark:border-amber-900/50">
                                <span className="text-xs text-amber-700 dark:text-amber-400 block mb-1">遅刻</span>
                                <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{statistics.delayed}人</span>
                            </div>
                            <div className="bg-rose-50 dark:bg-rose-950/30 p-3 rounded-xl border border-rose-100 dark:border-rose-900/50">
                                <span className="text-xs text-rose-700 dark:text-rose-400 block mb-1">不参加</span>
                                <span className="text-xl font-bold text-rose-600 dark:text-rose-400">{statistics.absent}人</span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                <span className="text-xs text-slate-500 block mb-1">未回答</span>
                                <span className="text-xl font-bold text-slate-500">{statistics.unanswered}人</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-border/50">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-primary/5 rounded-2xl">
                            <p className="text-xs label-caps text-muted-foreground mb-1">回答率</p>
                            <p className="text-2xl font-bold text-primary">
                                {total > 0 ? ((responseCount / total) * 100).toFixed(1) : 0}%
                            </p>
                        </div>
                        <div className="text-center p-4 bg-emerald-500/5 rounded-2xl">
                            <p className="text-xs label-caps text-muted-foreground mb-1">出席率</p>
                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {responseCount > 0 ? (((statistics.attended + statistics.delayed) / responseCount) * 100).toFixed(1) : 0}%
                            </p>
                        </div>
                        <div className="text-center p-4 bg-rose-500/5 rounded-2xl">
                            <p className="text-xs label-caps text-muted-foreground mb-1">不参加率</p>
                            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                                {responseCount > 0 ? ((statistics.absent / responseCount) * 100).toFixed(1) : 0}%
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}