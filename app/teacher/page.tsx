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
import { Label } from "@/components/ui/label";
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

    const loadAllData = async () => {
        try {
            const [eventsData, responsesData, announcementsResponse, googleEventsResponse] = await Promise.all([
                getAllEvents(),
                getAllResponses(),
                fetch("/api/announcements").then((res) => res.json()).catch(() => ({ success: false })),
                fetch("/api/google-calendar/events").then((res) => res.json()).catch(() => ({ success: false, data: [] })),
            ]);
            setEvents(eventsData.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()));
            setResponses(responsesData);
            if (announcementsResponse?.success) {
                setAnnouncements((announcementsResponse.data as Announcement[]).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            }
            if (googleEventsResponse?.data && Array.isArray(googleEventsResponse.data)) {
                setGoogleCalendarEvents(googleEventsResponse.data);
            }
        } catch (error) {
            console.error("Failed to load data:", error);
            errorToast("読込失敗", getErrorMessage(error));
        }
    };

    const handleLogout = () => {
        clearAllSession();
        router.push("/");
    };

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
            if (!response.ok) throw new Error("投稿失敗");
            loadAllData();
            setAnnouncementTitle("");
            setAnnouncementContent("");
            setAnnouncementPriority("通常");
            setShowAnnouncementDialog(false);
            successToast("投稿成功", "お知らせを投稿しました");
        } catch (error) {
            errorToast("投稿失敗", getErrorMessage(error));
        }
    };

    const eventStats = events
        .filter(e => e.isAttendanceRequired !== false)
        .map((event) => {
            const res = responses.filter((r) => r.eventId === event.id);
            const total = members.length;
            const attended = res.filter((r) => r.status === "参加").length;
            const delayed = res.filter((r) => r.status === "遅れる").length;
            const absent = res.filter((r) => r.status === "不参加").length;
            return {
                eventId: event.id,
                eventTitle: event.title,
                eventType: event.type,
                eventDateTime: event.dateTime,
                attended, delayed, absent, unanswered: total - res.length,
                total,
                responseRate: total > 0 ? (res.length / total) * 100 : 0,
            };
        });

    const memberDetails = members.map((member) => {
        const attendanceEvents = events.filter(e => e.isAttendanceRequired !== false);
        const res = responses.filter((r) => r.memberId === member.id && attendanceEvents.some(e => e.id === r.eventId));
        const attended = res.filter((r) => r.status === "参加" || r.status === "遅れる").length;
        return {
            id: member.id,
            name: member.name,
            committee: member.committee,
            attendanceCount: attended,
            absentCount: res.filter(r => r.status === "不参加").length,
            delayedCount: res.filter(r => r.status === "遅れる").length,
            unansweredCount: attendanceEvents.length - res.length,
            attendanceRate: attendanceEvents.length > 0 ? (attended / attendanceEvents.length) * 100 : 0,
        };
    });

    const filteredEvents = events
        .filter(e => e.isAttendanceRequired !== false)
        .filter((e) => (eventFilter === "all" || e.type === eventFilter) && e.title.toLowerCase().includes(searchQuery.toLowerCase()));

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedEvents = filteredEvents.slice(startIndex, startIndex + itemsPerPage);

    const renderOverview = () => (
        <div className="space-y-8">
            <div className="rounded-lg border shadow-sm overflow-hidden">
                <EventCalendar events={events} includeGoogleCalendar={true} googleCalendarId={process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "予定数", val: events.filter(e => e.isAttendanceRequired !== false).length, icon: Calendar },
                    { label: "平均回答率", val: `${(eventStats.reduce((a, s) => a + s.responseRate, 0) / (eventStats.length || 1)).toFixed(1)}%`, icon: TrendingUp },
                    { label: "メンバー数", val: members.length, icon: Users },
                    { label: "お知らせ", val: announcements.length, icon: Bell },
                ].map((s, i) => (
                    <Card key={i} className="shadow-sm border">
                        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">{s.label}</CardTitle>
                            <s.icon className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold">{s.val}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="shadow-sm border">
                <CardHeader><CardTitle className="text-base font-bold">最近のイベント</CardTitle></CardHeader>
                <CardContent className="p-0 sm:p-6 overflow-x-auto">
                    <Table>
                        <TableHeader><TableRow><TableHead>予定名</TableHead><TableHead>日時</TableHead><TableHead className="text-center">参加</TableHead><TableHead className="text-center">遅れ</TableHead><TableHead className="text-center">不参加</TableHead><TableHead>回答率</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {eventStats.slice(0, 10).map((s) => (
                                <TableRow key={s.eventId}>
                                    <TableCell className="font-medium max-w-[200px] truncate">{s.eventTitle}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{safeFormat(s.eventDateTime, "M/d HH:mm")}</TableCell>
                                    <TableCell className="text-center text-emerald-600 font-bold">{s.attended}</TableCell>
                                    <TableCell className="text-center text-amber-600 font-bold">{s.delayed}</TableCell>
                                    <TableCell className="text-center text-rose-600 font-bold">{s.absent}</TableCell>
                                    <TableCell><div className="flex items-center gap-2"><div className="w-12 bg-muted rounded-full h-1.5 overflow-hidden"><div className="bg-primary h-full" style={{width:`${s.responseRate}%`}} /></div><span className="text-[10px] font-bold">{s.responseRate.toFixed(1)}%</span></div></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );

    if (loading) return <LoadingScreen />;

    return (
        <div className="min-h-screen bg-background">
            <nav className="border-b bg-background sticky top-0 z-40">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</Button>
                        <div className="flex items-center gap-2">
                            <Users className="w-6 h-6 text-primary" />
                            <div><h1 className="font-bold text-base">先生管理画面</h1><p className="text-[10px] text-muted-foreground">{teacherInfo?.name}</p></div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2"><ThemeToggle /><Button variant="ghost" size="icon" onClick={handleLogout}><LogOut className="w-5 h-5" /></Button></div>
                </div>
            </nav>

            <div className="container mx-auto px-4 py-6 flex gap-6">
                <div className={cn("fixed inset-0 top-16 z-30 bg-background border-r md:relative md:translate-x-0 md:w-64 md:flex-shrink-0 transition-transform", sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
                    <nav className="p-4 space-y-1">
                        {[
                            { id: "overview", label: "ダッシュボード", icon: Home },
                            { id: "events", label: "予定一覧", icon: Calendar },
                            { id: "members", label: "メンバー分析", icon: Users },
                            { id: "statistics", label: "統計情報", icon: BarChart3 },
                            { id: "chat", label: "日程チャット", icon: MessageSquare },
                            { id: "announcements", label: "お知らせ", icon: Bell },
                        ].map((item) => (
                            <Button key={item.id} variant={activeTab === item.id ? "default" : "ghost"} className="w-full justify-start gap-3 rounded-lg" onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}>
                                <item.icon className="w-4 h-4" /><span className="text-sm font-medium">{item.label}</span>
                            </Button>
                        ))}
                    </nav>
                </div>
                <div className="flex-1 min-w-0">
                    {activeTab === "overview" && renderOverview()}
                    {activeTab === "events" && (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row gap-4"><Input placeholder="予定検索..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1" /><Select value={eventFilter} onValueChange={v => setEventFilter(v as any)}><SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全て</SelectItem>{EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                            <Card className="border shadow-sm"><CardContent className="p-0 overflow-x-auto"><Table><TableHeader><TableRow><TableHead>予定名</TableHead><TableHead>日時</TableHead><TableHead>状況</TableHead></TableRow></TableHeader><TableBody>{paginatedEvents.map(e => <TableRow key={e.id}><TableCell className="font-medium truncate max-w-xs">{e.title}</TableCell><TableCell className="text-xs text-muted-foreground">{safeFormat(e.dateTime, "M/d HH:mm")}</TableCell><TableCell><Badge variant="outline">{responses.filter(r => r.eventId === e.id).length}/{members.length}</Badge></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
                        </div>
                    )}
                    {activeTab === "members" && (
                        <Card className="border shadow-sm"><CardContent className="p-0 overflow-x-auto"><Table><TableHeader><TableRow><TableHead>メンバー名</TableHead><TableHead className="text-center">参加</TableHead><TableHead className="text-center">出欠率</TableHead></TableRow></TableHeader><TableBody>{memberDetails.sort((a,b)=>b.attendanceRate-a.attendanceRate).map(m => <TableRow key={m.id}><TableCell><div className="font-bold">{m.name}</div><div className="text-[10px] text-muted-foreground">{m.committee}</div></TableCell><TableCell className="text-center font-bold text-emerald-600">{m.attendanceCount}</TableCell><TableCell className="text-center font-bold">{m.attendanceRate.toFixed(1)}%</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
                    )}
                    {activeTab === "statistics" && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[{l:"平均出欠率",v:`${(memberDetails.reduce((a,m)=>a+m.attendanceRate,0)/(memberDetails.length||1)).toFixed(1)}%`},{l:"最高",v:`${Math.max(...memberDetails.map(m=>m.attendanceRate)).toFixed(1)}%`},{l:"最低",v:`${Math.min(...memberDetails.map(m=>m.attendanceRate)).toFixed(1)}%`}].map((s,i)=><Card key={i}><CardHeader className="p-4 pb-2"><CardTitle className="text-xs text-muted-foreground uppercase">{s.l}</CardTitle></CardHeader><CardContent className="p-4 pt-0 font-bold text-2xl">{s.v}</CardContent></Card>)}</div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><AttendanceChart data={{attended:eventStats.reduce((a,s)=>a+s.attended,0),delayed:eventStats.reduce((a,s)=>a+s.delayed,0),absent:eventStats.reduce((a,s)=>a+s.absent,0),unanswered:eventStats.reduce((a,s)=>a+s.unanswered,0)}} title="全体状況" /><AttendanceRateChart data={memberDetails.map(m=>({name:m.name,rate:m.attendanceRate}))} title="個人別比較" /></div>
                        </div>
                    )}
                    {activeTab === "chat" && <div className="max-w-4xl mx-auto"><TeacherChatPanel events={googleCalendarEvents} /></div>}
                    {activeTab === "announcements" && (
                        <div className="space-y-6">
                            <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}><DialogContent className="w-[95vw] sm:max-w-xl"><DialogHeader><DialogTitle>新しいお知らせ</DialogTitle></DialogHeader><div className="space-y-4 py-2"><div className="space-y-1"><Label className="text-xs">タイトル</Label><Input value={announcementTitle} onChange={e=>setAnnouncementTitle(e.target.value)} /></div><div className="space-y-1"><Label className="text-xs">内容</Label><Textarea value={announcementContent} onChange={e=>setAnnouncementContent(e.target.value)} rows={5} /></div></div><DialogFooter><Button variant="outline" onClick={()=>setShowAnnouncementDialog(false)}>キャンセル</Button><Button onClick={handlePostAnnouncement}>投稿</Button></DialogFooter></DialogContent></Dialog>
                            <Button className="w-full sm:w-auto" onClick={()=>setShowAnnouncementDialog(true)}>お知らせを投稿</Button>
                            <div className="space-y-4">{announcements.map(a => <Card key={a.id} className={cn("border", a.isTeacher ? "border-primary/50 bg-primary/5" : "")}><CardHeader className="p-4 pb-2"><div className="flex justify-between items-start"><CardTitle className="text-base">{a.title}</CardTitle><Badge variant={a.priority === "緊急" ? "destructive" : "outline"}>{a.priority}</Badge></div><CardDescription className="text-[10px]">{safeFormat(a.createdAt, "yyyy/MM/dd HH:mm")} by {a.createdBy}</CardDescription></CardHeader><CardContent className="p-4 pt-0 text-sm whitespace-pre-wrap">{a.content}</CardContent></Card>)}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
