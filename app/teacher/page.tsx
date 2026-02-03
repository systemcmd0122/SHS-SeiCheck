"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
    Calendar,
    AlertTriangle,
    CheckCircle2,
    Users,
    Menu,
    X,
    Bell,
    Home,
    BarChart3,
    LogOut,
    MessageSquare,
    ClipboardCheck,
    TrendingUp,
    FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/Loading";
import { ThemeToggle } from "@/components/theme-toggle";
import {
    getAllEvents,
    getAllResponses,
    getAllAnnouncements,
} from "@/lib/db";
import type { Event, Response, EventType, Announcement, AnnouncementPriority } from "@/lib/types";
import { EVENT_TYPES, ANNOUNCEMENT_PRIORITIES } from "@/lib/types";
import { members } from "@/lib/members";
import { successToast, errorToast } from "@/components/ui/toast-simple";
import { clearAllSession, getErrorMessage, cn } from "@/lib/utils";
import {
    AttendanceChart,
    AttendanceRateChart,
} from "@/components/TeacherCharts";
import { TeacherChatPanel } from "@/components/TeacherChatPanel";
import { EventCalendar } from "@/components/EventCalendar";
import type { GoogleCalendarEvent } from "@/lib/google-calendar";

interface TeacherInfo {
    id: string;
    name: string;
    department: string;
}

interface EventStatistics {
    eventId: string;
    eventTitle: string;
    eventType: EventType;
    eventDateTime: string;
    attended: number;
    delayed: number;
    absent: number;
    unanswered: number;
    total: number;
    attendanceRate: number;
    responseRate: number;
}

interface MemberDetail {
    id: string;
    name: string;
    committee: string;
    attendanceCount: number;
    absentCount: number;
    delayedCount: number;
    unansweredCount: number;
    attendanceRate: number;
}

export default function TeacherPage() {
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

    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [events, setEvents] = useState<Event[]>([]);
    const [responses, setResponses] = useState<Response[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [eventFilter, setEventFilter] = useState<EventType | "all">("all");
    const [announcementTitle, setAnnouncementTitle] = useState("");
    const [announcementContent, setAnnouncementContent] = useState("");
    const [announcementPriority, setAnnouncementPriority] = useState<AnnouncementPriority>("通常");
    const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
    const [googleCalendarEvents, setGoogleCalendarEvents] = useState<GoogleCalendarEvent[]>([]);
    const itemsPerPage = 10;

    // 初期化
    useEffect(() => {
        const initializeTeacher = () => {
            const storedTeacher = sessionStorage.getItem("teacherInfo");
            if (storedTeacher) {
                try {
                    const teacher = JSON.parse(storedTeacher);
                    setTeacherInfo(teacher);
                } catch {
                    router.push("/");
                    return;
                }
            } else {
                router.push("/");
                return;
            }

            loadAllData();
            setLoading(false);
        };

        initializeTeacher();
    }, [router]);

    // すべてのデータを読み込む
    const loadAllData = async () => {
        try {
            const [eventsData, responsesData, announcementsResponse, googleEventsResponse] = await Promise.all([
                getAllEvents(),
                getAllResponses(),
                fetch("/api/announcements").then((res) => res.json()).catch(() => ({ success: false })),
                fetch("/api/google-calendar/events").then((res) => res.json()).catch((err) => {
                    console.error("Failed to fetch Google Calendar events:", err);
                    return { success: false, data: [] };
                }),
            ]);

            setEvents(eventsData.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()));
            setResponses(responsesData);
            
            if (announcementsResponse && announcementsResponse.success) {
                setAnnouncements((announcementsResponse.data as Announcement[]).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            }

            // Googleカレンダーイベントの処理
            if (googleEventsResponse && googleEventsResponse.success && Array.isArray(googleEventsResponse.data)) {
                setGoogleCalendarEvents(googleEventsResponse.data);
                console.log("Google Calendar events loaded:", googleEventsResponse.data);
            } else if (googleEventsResponse && googleEventsResponse.data && Array.isArray(googleEventsResponse.data)) {
                // successフラグがなくてもdataが配列なら使用
                setGoogleCalendarEvents(googleEventsResponse.data);
                console.log("Google Calendar events loaded:", googleEventsResponse.data);
            } else {
                console.warn("Google Calendar events not found or invalid format");
                setGoogleCalendarEvents([]);
            }
        } catch (error) {
            console.error("Failed to load data:", error);
            const errorMessage = getErrorMessage(error);
            errorToast("読込失敗", errorMessage);
            setGoogleCalendarEvents([]);
        }
    };

    // ログアウト処理
    const handleLogout = () => {
        // セッション情報を完全に削除
        clearAllSession();
        router.push("/");
    };

    // お知らせ投稿処理
    const handlePostAnnouncement = async () => {
        if (!announcementTitle.trim() || !announcementContent.trim() || !teacherInfo) {
            errorToast("入力エラー", "タイトルと内容を入力してください");
            return;
        }

        try {
            const response = await fetch("/api/announcements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: announcementTitle.trim(),
                    content: announcementContent.trim(),
                    priority: announcementPriority,
                    createdBy: teacherInfo.name,
                    isTeacher: true,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "お知らせの投稿に失敗しました");
            }

            // 投稿成功時に最新のお知らせ一覧を再読み込み（APIを使用）
            const refreshResponse = await fetch("/api/announcements");
            const refreshData = await refreshResponse.json();
            if (refreshData && refreshData.success) {
                setAnnouncements((refreshData.data as Announcement[]).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            }

            setAnnouncementTitle("");
            setAnnouncementContent("");
            setAnnouncementPriority("通常");
            setShowAnnouncementDialog(false);
            successToast("投稿成功", "お知らせを投稿しました");
        } catch (error) {
            console.error("Error posting announcement:", error);
            const errorMessage = getErrorMessage(error);
            errorToast("投稿失敗", errorMessage);
        }
    };

    // イベント統計の計算
    const calculateEventStatistics = (): EventStatistics[] => {
        return events
            .filter(e => e.isAttendanceRequired !== false)
            .map((event) => {
            const eventResponses = responses.filter((r) => r.eventId === event.id);
            const attended = eventResponses.filter((r) => r.status === "参加").length;
            const delayed = eventResponses.filter((r) => r.status === "遅れる").length;
            const absent = eventResponses.filter((r) => r.status === "不参加").length;
            const unanswered = members.length - eventResponses.length;
            const total = members.length;
            const responseRate = total > 0 ? ((eventResponses.length / total) * 100).toFixed(1) : "0";
            const attendanceRate = eventResponses.length > 0 ? (((attended + delayed) / eventResponses.length) * 100).toFixed(1) : "0";

            return {
                eventId: event.id,
                eventTitle: event.title,
                eventType: event.type,
                eventDateTime: event.dateTime,
                attended,
                delayed,
                absent,
                unanswered,
                total,
                attendanceRate: parseFloat(attendanceRate),
                responseRate: parseFloat(responseRate),
            };
        });
    };

    // メンバー詳細情報の計算
    const calculateMemberDetails = (): MemberDetail[] => {
        const attendanceEvents = events.filter(e => e.isAttendanceRequired !== false);
        return members.map((member) => {
            const memberResponses = responses.filter((r) => r.memberId === member.id);
            // 出欠が必要な予定に対する回答のみをカウント
            const validResponses = memberResponses.filter(r => attendanceEvents.some(e => e.id === r.eventId));
            
            const attendanceCount = validResponses.filter((r) => r.status === "参加" || r.status === "遅れる").length;
            const absentCount = validResponses.filter((r) => r.status === "不参加").length;
            const delayedCount = validResponses.filter((r) => r.status === "遅れる").length;
            const unansweredCount = attendanceEvents.length - validResponses.length;
            const attendanceRate = attendanceEvents.length > 0 ? ((attendanceCount / attendanceEvents.length) * 100).toFixed(1) : "0";

            return {
                id: member.id,
                name: member.name,
                committee: member.committee,
                attendanceCount,
                absentCount,
                delayedCount,
                unansweredCount,
                attendanceRate: parseFloat(attendanceRate),
            };
        });
    };

    // 統計情報の取得
    const eventStats = calculateEventStatistics();
    const memberDetails = calculateMemberDetails();

    // フィルタリングと検索
    const filteredEvents = events
        .filter(e => e.isAttendanceRequired !== false)
        .filter((event) => {
            const matchesFilter = eventFilter === "all" || event.type === eventFilter;
            const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesFilter && matchesSearch;
        });

    // ページネーション
    const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedEvents = filteredEvents.slice(startIndex, startIndex + itemsPerPage);

    // ダッシュボードのレンダリング
    const renderOverview = () => (
        <div className="space-y-8 animate-fade-in">
            {/* カレンダー */}
            <div className="rounded-xl overflow-hidden shadow-sm border border-border">
                <EventCalendar
                    events={events}
                    includeGoogleCalendar={true}
                    googleCalendarId={process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID}
                    highlightDates={events
                        .filter((e) => {
                            if (!e.dateTime) return false;
                            const eventDate = new Date(e.dateTime);
                            return !isNaN(eventDate.getTime()) && eventDate >= new Date();
                        })
                        .map((e) => {
                            const d = new Date(e.dateTime);
                            return format(d, "yyyy-MM-dd");
                        })}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="card-hover border-0 shadow-sm bg-blue-50/50 dark:bg-blue-950/20">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium label-caps">出欠確認予定数</CardTitle>
                            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{events.filter(e => e.isAttendanceRequired !== false).length}</div>
                        <p className="text-xs text-muted-foreground mt-2">
                            今月: {events.filter((e) => {
                                if (e.isAttendanceRequired === false) return false;
                                const eventDate = new Date(e.dateTime);
                                const now = new Date();
                                return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
                            }).length} 件
                        </p>
                    </CardContent>
                </Card>

                <Card className="card-hover border-0 shadow-sm bg-emerald-50/50 dark:bg-emerald-950/20">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium label-caps">平均回答率</CardTitle>
                            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {eventStats.length > 0 ? (eventStats.reduce((acc, stat) => acc + stat.responseRate, 0) / eventStats.length).toFixed(1) : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">全予定での平均</p>
                    </CardContent>
                </Card>

                <Card className="card-hover border-0 shadow-sm bg-purple-50/50 dark:bg-purple-950/20">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium label-caps">総メンバー数</CardTitle>
                            <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{members.length}</div>
                        <p className="text-xs text-muted-foreground mt-2">生徒会メンバー</p>
                    </CardContent>
                </Card>

                <Card className="card-hover border-0 shadow-sm bg-orange-50/50 dark:bg-orange-950/20">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium label-caps">お知らせ</CardTitle>
                            <Bell className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{announcements.length}</div>
                        <p className="text-xs text-muted-foreground mt-2">全件表示</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm border-0">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <ClipboardCheck className="w-5 h-5 text-primary" />
                        <div>
                            <CardTitle className="section-title">最近のイベント</CardTitle>
                            <CardDescription>最新10件の予定と回答状況</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                    <div className="overflow-x-auto scrollbar-hide">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30">
                                    <TableHead className="w-[200px] font-bold">予定名</TableHead>
                                    <TableHead className="font-bold text-center">種類</TableHead>
                                    <TableHead className="font-bold">日時</TableHead>
                                    <TableHead className="text-center font-bold">参加</TableHead>
                                    <TableHead className="text-center font-bold">遅れ</TableHead>
                                    <TableHead className="text-center font-bold">不参加</TableHead>
                                    <TableHead className="text-center font-bold">未回答</TableHead>
                                    <TableHead className="font-bold">回答率</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {eventStats.slice(0, 10).map((stat) => (
                                    <TableRow key={stat.eventId} className="hover:bg-muted/50 transition-colors">
                                        <TableCell className="font-medium max-w-[200px] truncate">{stat.eventTitle}</TableCell>
                                        <TableCell className="text-center"><Badge variant="secondary" className="font-normal">{stat.eventType}</Badge></TableCell>
                                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                                            {safeFormat(stat.eventDateTime, "yyyy/MM/dd HH:mm")}
                                        </TableCell>
                                        <TableCell className="text-center"><span className="font-semibold text-emerald-600">{stat.attended}</span></TableCell>
                                        <TableCell className="text-center"><span className="font-semibold text-amber-600">{stat.delayed}</span></TableCell>
                                        <TableCell className="text-center"><span className="font-semibold text-rose-600">{stat.absent}</span></TableCell>
                                        <TableCell className="text-center"><span className="font-semibold text-slate-400">{stat.unanswered}</span></TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                                                    <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${stat.responseRate}%` }} />
                                                </div>
                                                <span className="text-xs font-bold w-9">{stat.responseRate.toFixed(1)}%</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    // イベント一覧のレンダリング
    const renderEvents = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Input
                        placeholder="予定名で検索..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full pl-4 rounded-xl border-border bg-card shadow-sm"
                    />
                </div>
                <Select value={eventFilter} onValueChange={(value) => {
                    setEventFilter(value as EventType | "all");
                    setCurrentPage(1);
                }}>
                    <SelectTrigger className="w-full md:w-48 rounded-xl border-border bg-card shadow-sm">
                        <SelectValue placeholder="種類でフィルター" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">すべての種類</SelectItem>
                        {EVENT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Card className="shadow-sm border-0">
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <div>
                            <CardTitle className="section-title">予定一覧</CardTitle>
                            <CardDescription>全{filteredEvents.length}件中 {startIndex + 1}～{Math.min(startIndex + itemsPerPage, filteredEvents.length)}件表示</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                    <div className="overflow-x-auto scrollbar-hide">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30">
                                    <TableHead className="font-bold">予定名</TableHead>
                                    <TableHead className="font-bold">種類</TableHead>
                                    <TableHead className="font-bold">日時</TableHead>
                                    <TableHead className="font-bold">回答期限</TableHead>
                                    <TableHead className="font-bold">作成者</TableHead>
                                    <TableHead className="font-bold">回答状況</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedEvents.map((event) => {
                                    const responseCount = responses.filter((r) => r.eventId === event.id).length;
                                    const isOverdue = new Date() > new Date(event.deadline);

                                    return (
                                        <TableRow key={event.id} className="hover:bg-muted/50 transition-colors">
                                            <TableCell className="font-medium max-w-xs truncate">{event.title}</TableCell>
                                            <TableCell><Badge variant="outline" className="font-normal">{event.type}</Badge></TableCell>
                                            <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                                                {safeFormat(event.dateTime, "MM/dd HH:mm")}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap text-sm">
                                                <span className={isOverdue ? "text-rose-600 font-bold" : "text-muted-foreground"}>
                                                    {safeFormat(event.deadline, "MM/dd HH:mm")}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm">{event.createdBy}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                                    </div>
                                                    <span className="text-sm font-bold">{responseCount}/{members.length}</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    {totalPages > 1 && (
                        <div className="mt-6 flex justify-center">
                            <Pagination>
                                <PaginationContent>
                                    {currentPage > 1 && (
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setCurrentPage(currentPage - 1);
                                                }}
                                            />
                                        </PaginationItem>
                                    )}

                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <PaginationItem key={page}>
                                            <PaginationLink
                                                href="#"
                                                isActive={page === currentPage}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setCurrentPage(page);
                                                }}
                                            >
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>
                                    ))}

                                    {currentPage < totalPages && (
                                        <PaginationItem>
                                            <PaginationNext
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setCurrentPage(currentPage + 1);
                                                }}
                                            />
                                        </PaginationItem>
                                    )}
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );

    // メンバー詳細のレンダリング
    const renderMembers = () => (
        <Card className="shadow-sm border-0 animate-fade-in">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <div>
                        <CardTitle className="section-title">メンバー出欠状況</CardTitle>
                        <CardDescription>各メンバーの出欠データ分析</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
                <div className="overflow-x-auto scrollbar-hide">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead className="font-bold">メンバー名</TableHead>
                                <TableHead className="font-bold text-center">委員会</TableHead>
                                <TableHead className="text-center font-bold">参加</TableHead>
                                <TableHead className="text-center font-bold">遅刻</TableHead>
                                <TableHead className="text-center font-bold">不参加</TableHead>
                                <TableHead className="text-center font-bold">未回答</TableHead>
                                <TableHead className="font-bold">出欠率</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {memberDetails.sort((a, b) => b.attendanceRate - a.attendanceRate).map((member) => (
                                <TableRow key={member.id} className="hover:bg-muted/50 transition-colors">
                                    <TableCell className="font-medium">{member.name}</TableCell>
                                    <TableCell className="text-center text-sm text-muted-foreground">{member.committee}</TableCell>
                                    <TableCell className="text-center"><span className="font-semibold text-emerald-600">{member.attendanceCount}</span></TableCell>
                                    <TableCell className="text-center"><span className="font-semibold text-amber-600">{member.delayedCount}</span></TableCell>
                                    <TableCell className="text-center"><span className="font-semibold text-rose-600">{member.absentCount}</span></TableCell>
                                    <TableCell className="text-center"><span className="font-semibold text-slate-400">{member.unansweredCount}</span></TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                                                <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${member.attendanceRate}%` }} />
                                            </div>
                                            <span className="text-xs font-bold w-9">{member.attendanceRate.toFixed(1)}%</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );

    // 統計情報のレンダリング
    const renderStatistics = () => {
        const attendanceChartData = {
            attended: eventStats.reduce((acc, stat) => acc + stat.attended, 0),
            delayed: eventStats.reduce((acc, stat) => acc + stat.delayed, 0),
            absent: eventStats.reduce((acc, stat) => acc + stat.absent, 0),
            unanswered: eventStats.reduce((acc, stat) => acc + stat.unanswered, 0),
        };

        const attendanceRateData = memberDetails.map((member) => ({
            name: member.name,
            rate: member.attendanceRate,
        }));

        return (
            <div className="space-y-8 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="card-hover border-0 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium label-caps">全体平均出欠率</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-primary">
                                {memberDetails.length > 0 ? (memberDetails.reduce((acc, m) => acc + m.attendanceRate, 0) / memberDetails.length).toFixed(1) : 0}%
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">全メンバーの平均</p>
                        </CardContent>
                    </Card>

                    <Card className="card-hover border-0 shadow-sm bg-emerald-50/30 dark:bg-emerald-950/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium label-caps">最高出欠率</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                                {memberDetails.length > 0 ? Math.max(...memberDetails.map((m) => m.attendanceRate)).toFixed(1) : 0}%
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {memberDetails.length > 0 ? memberDetails.find((m) => m.attendanceRate === Math.max(...memberDetails.map((m) => m.attendanceRate)))?.name : ""}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="card-hover border-0 shadow-sm bg-rose-50/30 dark:bg-rose-950/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium label-caps">最低出欠率</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-rose-600 dark:text-rose-400">
                                {memberDetails.length > 0 ? Math.min(...memberDetails.map((m) => m.attendanceRate)).toFixed(1) : 0}%
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {memberDetails.length > 0 ? memberDetails.find((m) => m.attendanceRate === Math.min(...memberDetails.map((m) => m.attendanceRate)))?.name : ""}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <AttendanceChart data={attendanceChartData} title="全体出欠状況" />
                    <AttendanceRateChart data={attendanceRateData} title="メンバー出欠率比較" />
                </div>

                {renderMembers()}
            </div>
        );
    };

    // 日程チャットのレンダリング
    const renderChat = () => (
        <div className="max-w-4xl mx-auto">
            <TeacherChatPanel events={googleCalendarEvents} />
        </div>
    );

    // お知らせのレンダリング
    const renderAnnouncements = () => (
        <div className="space-y-6">
            {/* ダイアログ */}
            <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
                <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>新しいお知らせを投稿</DialogTitle>
                        <DialogDescription>先生用のお知らせを投稿します</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">タイトル</label>
                            <Input
                                placeholder="お知らせのタイトル"
                                value={announcementTitle}
                                onChange={(e) => setAnnouncementTitle(e.target.value)}
                                maxLength={100}
                            />
                            <p className="text-xs text-muted-foreground">{announcementTitle.length}/100</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">内容</label>
                            <Textarea
                                placeholder="お知らせの内容を入力してください"
                                value={announcementContent}
                                onChange={(e) => setAnnouncementContent(e.target.value)}
                                maxLength={2000}
                                rows={6}
                            />
                            <p className="text-xs text-muted-foreground">{announcementContent.length}/2000</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">優先度</label>
                            <Select value={announcementPriority} onValueChange={(value) => setAnnouncementPriority(value as AnnouncementPriority)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="優先度を選択" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ANNOUNCEMENT_PRIORITIES.map((priority) => (
                                        <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 pt-4 border-t">
                        <Button
                            onClick={() => {
                                setShowAnnouncementDialog(false);
                                setAnnouncementTitle("");
                                setAnnouncementContent("");
                                setAnnouncementPriority("通常");
                            }}
                            variant="outline"
                        >
                            キャンセル
                        </Button>
                        <Button
                            onClick={handlePostAnnouncement}
                            disabled={!announcementTitle.trim() || !announcementContent.trim()}
                        >
                            <Bell className="w-4 h-4 mr-2" />
                            投稿する
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 投稿ボタン */}
            <Button
                onClick={() => setShowAnnouncementDialog(true)}
                className="w-full sm:w-auto"
                size="lg"
            >
                <Bell className="w-4 h-4 mr-2" />
                新しいお知らせを投稿
            </Button>

            {/* 投稿されたお知らせ一覧 */}
            <div className="space-y-4">
                {announcements.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-4">
                            {announcements.filter((a) => a.isTeacher).length > 0 && (
                                <span className="text-primary">先生からのお知らせ ({announcements.filter((a) => a.isTeacher).length}件)</span>
                            )}
                        </h3>
                    </div>
                )}

                {announcements.map((announcement) => {
                    const priorityColors: Record<AnnouncementPriority, string> = {
                        緊急: "bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-100 border-red-300 dark:border-red-800",
                        重要: "bg-orange-50 dark:bg-orange-950/30 text-orange-900 dark:text-orange-100 border-orange-300 dark:border-orange-800",
                        通常: "bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 border-blue-300 dark:border-blue-800",
                    };

                    // 先生のお知らせの場合は特別なスタイル
                    const cardClassName = announcement.isTeacher
                        ? `border-2 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30 ${priorityColors[announcement.priority]}`
                        : `border ${priorityColors[announcement.priority]}`;

                    return (
                        <Card key={announcement.id} className={cardClassName}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="outline">{announcement.priority}</Badge>
                                            {announcement.isTeacher && (
                                                <Badge className="bg-green-600 hover:bg-green-700">先生より</Badge>
                                            )}
                                            {announcement.priority === "緊急" && <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />}
                                        </div>
                                        <CardTitle>{announcement.title}</CardTitle>
                                        <CardDescription>
                                            {safeFormat(announcement.createdAt, "yyyy年MM月dd日 HH:mm")} by {announcement.createdBy}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="prose prose-sm max-w-none whitespace-pre-wrap break-words">
                                    {announcement.content}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {announcements.length === 0 && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center text-muted-foreground py-8">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>お知らせはまだありません</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div className="min-h-screen bg-background">
            {/* ナビゲーションバー */}
            <nav className="border-b bg-card sticky top-0 z-40">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </Button>
                        <div className="flex items-center gap-2">
                            <Users className="w-6 h-6 text-primary" />
                            <div>
                                <h1 className="font-bold text-lg">先生管理画面</h1>
                                <p className="text-xs text-muted-foreground">{teacherInfo?.name}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <Button variant="ghost" size="icon" onClick={handleLogout} title="ログアウト">
                            <LogOut className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-4 py-6 flex gap-6">
                {/* サイドバー */}
                <div className={`fixed inset-0 top-16 z-30 bg-background border-r border-border transition-transform md:relative md:translate-x-0 md:w-72 md:flex-shrink-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}>
                    <nav className="space-y-1 p-4 md:p-6 md:flex md:flex-col md:gap-1.5 h-full overflow-y-auto">
                        {[
                            { id: "overview", label: "ダッシュボード", icon: Home },
                            { id: "events", label: "予定一覧", icon: Calendar },
                            { id: "members", label: "メンバー分析", icon: Users },
                            { id: "statistics", label: "統計情報", icon: BarChart3 },
                            { id: "chat", label: "日程チャット", icon: MessageSquare },
                            { id: "announcements", label: "お知らせ", icon: Bell },
                        ].map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <Button
                                    key={item.id}
                                    variant={isActive ? "default" : "ghost"}
                                    className={cn(
                                        "w-full justify-start gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                                        isActive 
                                            ? "shadow-md shadow-primary/20" 
                                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                    )}
                                    onClick={() => {
                                        setActiveTab(item.id);
                                        setSidebarOpen(false);
                                    }}
                                >
                                    <Icon className={cn("w-5 h-5", isActive ? "animate-pulse" : "")} />
                                    <span className="font-medium">{item.label}</span>
                                </Button>
                            );
                        })}
                    </nav>
                </div>

                {/* メインコンテンツ */}
                <div className="flex-1 min-w-0">
                    {activeTab === "overview" && renderOverview()}
                    {activeTab === "events" && renderEvents()}
                    {activeTab === "members" && renderMembers()}
                    {activeTab === "statistics" && renderStatistics()}
                    {activeTab === "chat" && renderChat()}
                    {activeTab === "announcements" && renderAnnouncements()}
                </div>
            </div>
        </div>
    );
}
