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
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={100}
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
                <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">参加率</p>
                        <p className="text-2xl font-bold">
                            {total > 0 ? (((data.attended + data.delayed) / total) * 100).toFixed(1) : 0}%
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">回答率</p>
                        <p className="text-2xl font-bold">
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
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>各メンバーの出欠率を比較</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="name"
                            angle={-45}
                            textAnchor="end"
                            height={100}
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="rate" fill={COLORS.attended} name="出欠率" />
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
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.map((stat, index) => (
                        <div key={index} className="p-4 rounded-lg bg-muted">
                            <div className="flex items-center gap-2 mb-2">
                                {stat.icon && <div className="text-muted-foreground">{stat.icon}</div>}
                                <p className="text-sm text-muted-foreground">{stat.label}</p>
                            </div>
                            <p className="text-2xl font-bold" style={{ color: stat.color }}>
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
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-xl">{event.title}</CardTitle>
                        <CardDescription className="mt-2">
                            {format(new Date(event.dateTime), "yyyy年MM月dd日 HH:mm", { locale: ja })}
                        </CardDescription>
                    </div>
                    <Badge variant="outline">{event.type}</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">詳細情報</h4>
                        <div className="space-y-2 text-sm">
                            <p>
                                <span className="font-medium">回答期限:</span>{" "}
                                {format(new Date(event.deadline), "yyyy年MM月dd日 HH:mm", { locale: ja })}
                            </p>
                            <p>
                                <span className="font-medium">作成者:</span> {event.createdBy}
                            </p>
                            {event.description && (
                                <p>
                                    <span className="font-medium">説明:</span> {event.description}
                                </p>
                            )}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">回答状況</h4>
                        <div className="space-y-2 text-sm">
                            <p>
                                <span className="inline-block w-20">参加:</span>
                                <Badge variant="secondary">{statistics.attended}人</Badge>
                            </p>
                            <p>
                                <span className="inline-block w-20">遅刻:</span>
                                <Badge variant="secondary">{statistics.delayed}人</Badge>
                            </p>
                            <p>
                                <span className="inline-block w-20">不参加:</span>
                                <Badge variant="secondary">{statistics.absent}人</Badge>
                            </p>
                            <p>
                                <span className="inline-block w-20">未回答:</span>
                                <Badge variant="secondary">{statistics.unanswered}人</Badge>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">回答率</p>
                            <p className="text-2xl font-bold">
                                {total > 0 ? ((responseCount / total) * 100).toFixed(1) : 0}%
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">参加率</p>
                            <p className="text-2xl font-bold">
                                {responseCount > 0 ? (((statistics.attended + statistics.delayed) / responseCount) * 100).toFixed(1) : 0}%
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">不参加率</p>
                            <p className="text-2xl font-bold">
                                {responseCount > 0 ? ((statistics.absent / responseCount) * 100).toFixed(1) : 0}%
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}