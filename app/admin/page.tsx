"use client";

import { useState, useEffect, useRef, JSX, Fragment } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  Calendar,
  Download,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Menu,
  X,
  Trash2,
  Bell,
  Edit,
  Megaphone,
  Home,
  TrendingUp,
  History,
  Share2,
  LayoutDashboard,
  Filter,
  Search,
  Copy,
} from "lucide-react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { StatisticsPanel } from "@/components/StatisticsPanel";
import { HistoryPanel } from "@/components/HistoryPanel";
import { SharePanel } from "@/components/SharePanel";
import { SharedLinksList } from "@/components/SharedLinksList";
import { UnansweredPanel } from "@/components/UnansweredPanel";
import { EventCalendar } from "@/components/EventCalendar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { members } from "@/lib/members";
import {
  getAllEvents,
  createEvent,
  deleteEvent,
  getAllResponses,
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  subscribeToAllEvents,
  subscribeToAllResponses,
  subscribeToAllAnnouncements,
  subscribeToAllSharedResponses,
  getAllSharedResponses,
} from "@/lib/db";
import type { Event, Response, EventType, ResponseStatus, Announcement, AnnouncementPriority, SharedResponse } from "@/lib/types";
import { EVENT_TYPES, ANNOUNCEMENT_PRIORITIES } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { AnnouncementDialog, ShareLinkDialog, AddEventDialog } from "@/components/CommonDialogs";

import { useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/Loading";
import { ThemeToggle } from "@/components/theme-toggle";
import { successToast, errorToast } from "@/components/ui/toast-simple";
import { clearAllSession, getErrorMessage } from "@/lib/utils";

export default function AdminPage() {
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
  const [events, setEvents] = useState<Event[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [sharedResponses, setSharedResponses] = useState<SharedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventType, setSelectedEventType] = useState<EventType | "全て">("全て");
  const [eventSearchQuery, setEventSearchQuery] = useState("");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false);
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("events");
  const [selectedEventForShare, setSelectedEventForShare] = useState<Event | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [eventCurrentPage, setEventCurrentPage] = useState(1);
  const eventItemsPerPage = 10;
  const matrixListRef = useRef<HTMLDivElement>(null);
  const eventListRef = useRef<HTMLDivElement>(null);
  const announcementListRef = useRef<HTMLDivElement>(null);
  const [announcementCurrentPage, setAnnouncementCurrentPage] = useState(1);
  const announcementItemsPerPage = 10;

  const handleMatrixPageChange = (page: number) => {
    setCurrentPage(page);
    setTimeout(() => {
      matrixListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleEventPageChange = (page: number) => {
    setEventCurrentPage(page);
    setTimeout(() => {
      eventListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleAnnouncementPageChange = (page: number) => {
    setAnnouncementCurrentPage(page);
    setTimeout(() => {
      announcementListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleTabChangeWithScroll = (tabId: string) => {
    setActiveTab(tabId);
    setTimeout(() => {
      const element = document.getElementById(`tab-content-${tabId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 0);
  };

  const [newEvent, setNewEvent] = useState({
    title: "",
    type: "定例会" as EventType,
    date: "",
    time: "",
    deadlineDate: "",
  });

  const [newCalendarEvent, setNewCalendarEvent] = useState({
    title: "",
    description: "",
    date: "",
  });

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    priority: "通常" as AnnouncementPriority,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsData, responsesData, announcementsData, sharedData] = await Promise.all([
        getAllEvents(),
        getAllResponses(),
        getAllAnnouncements(),
        getAllSharedResponses(),
      ]);
      setEvents(eventsData);
      setResponses(responsesData);
      setAnnouncements(announcementsData);
      setSharedResponses(sharedData);
    } catch (error) {
      console.error("データ読み込みエラー:", error);
      const errorMessage = getErrorMessage(error);
      errorToast("読込失敗", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const unsubscribeEvents = subscribeToAllEvents((updatedEvents) => {
      setEvents(updatedEvents);
    });

    const unsubscribeResponses = subscribeToAllResponses((updatedResponses) => {
      setResponses(updatedResponses);
    });

    const unsubscribeAnnouncements = subscribeToAllAnnouncements((updatedAnnouncements) => {
      setAnnouncements(updatedAnnouncements);
    });

    const unsubscribeShared = subscribeToAllSharedResponses((updatedShared) => {
      setSharedResponses(updatedShared);
    });

    return () => {
      unsubscribeEvents();
      unsubscribeResponses();
      unsubscribeAnnouncements();
      unsubscribeShared();
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setEventCurrentPage(1);
    setAnnouncementCurrentPage(1);
  }, [activeTab]);

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.date || !newEvent.deadlineDate) {
      errorToast("入力エラー", "タイトル、開催日、締切日を入力してください");
      return;
    }

    if (newEvent.title.trim().length < 1 || newEvent.title.length > 100) {
      errorToast("入力エラー", "タイトルは1文字以上100文字以下で入力してください");
      return;
    }

    if (new Date(newEvent.date) > new Date(newEvent.deadlineDate)) {
      errorToast("入力エラー", "開催日は締切日以前の日付を選択してください");
      return;
    }

    try {
      const dateTime = newEvent.time
        ? `${newEvent.date}T${newEvent.time}:00`
        : `${newEvent.date}T00:00:00`;
      const deadline = `${newEvent.deadlineDate}T23:59:00`;

      await createEvent({
        title: newEvent.title,
        type: newEvent.type,
        dateTime: dateTime,
        deadline: deadline,
        createdBy: "admin",
        isAttendanceRequired: true,
      });

      setIsCreateDialogOpen(false);
      setNewEvent({
        title: "",
        type: "定例会",
        date: "",
        time: "",
        deadlineDate: "",
      });
      successToast("作成成功", "予定を作成しました");
    } catch (error) {
      console.error("予定作成エラー:", error);
      const errorMessage = getErrorMessage(error);
      errorToast("作成失敗", errorMessage);
    }
  };

  const handleCreateCalendarEvent = async () => {
    if (!newCalendarEvent.title || !newCalendarEvent.date) {
      errorToast("入力エラー", "タイトルと開催日を入力してください");
      return;
    }

    if (newCalendarEvent.title.trim().length < 1 || newCalendarEvent.title.length > 100) {
      errorToast("入力エラー", "タイトルは1文字以上100文字以下で入力してください");
      return;
    }

    try {
      const dateTime = `${newCalendarEvent.date}T00:00:00`;
      const deadline = `${newCalendarEvent.date}T23:59:00`;

      await createEvent({
        title: newCalendarEvent.title,
        type: "その他",
        dateTime: dateTime,
        deadline: deadline,
        createdBy: "admin",
        description: newCalendarEvent.description,
        isAttendanceRequired: false,
      });

      setIsAddEventDialogOpen(false);
      setNewCalendarEvent({
        title: "",
        description: "",
        date: "",
      });
      successToast("作成成功", "予定を追加しました");
    } catch (error) {
      console.error("カレンダーからの予定作成エラー:", error);
      const errorMessage = getErrorMessage(error);
      errorToast("作成失敗", errorMessage);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      errorToast("入力エラー", "タイトルと内容を入力してください");
      return;
    }

    if (newAnnouncement.title.trim().length < 1 || newAnnouncement.title.length > 100) {
      errorToast("入力エラー", "タイトルは1文字以上100文字以下で入力してください");
      return;
    }

    if (newAnnouncement.content.trim().length < 1 || newAnnouncement.content.length > 2000) {
      errorToast("入力エラー", "内容は1文字以上2000文字以下で入力してください");
      return;
    }

    try {
      if (editingAnnouncement) {
        await updateAnnouncement(editingAnnouncement.id, {
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          priority: newAnnouncement.priority,
        });
      } else {
        await createAnnouncement({
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          priority: newAnnouncement.priority,
          createdBy: "admin",
        });
      }

      setIsAnnouncementDialogOpen(false);
      setEditingAnnouncement(null);
      setNewAnnouncement({
        title: "",
        content: "",
        priority: "通常",
      });
      successToast("完了", editingAnnouncement ? "お知らせを更新しました" : "お知らせを作成しました");
    } catch (error) {
      console.error("お知らせ作成エラー:", error);
      const errorMessage = getErrorMessage(error);
      errorToast("エラー", errorMessage);
    }
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setNewAnnouncement({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
    });
    setIsAnnouncementDialogOpen(true);
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!confirm("このお知らせを削除してもよろしいですか?")) {
      return;
    }

    try {
      await deleteAnnouncement(announcementId);
      successToast("削除成功", "お知らせを削除しました");
    } catch (error) {
      console.error("お知らせ削除エラー:", error);
      const errorMessage = getErrorMessage(error);
      errorToast("削除失敗", errorMessage);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("この予定を削除してもよろしいですか?")) {
      return;
    }

    try {
      await deleteEvent(eventId);
      successToast("削除成功", "予定を削除しました");
    } catch (error) {
      console.error("予定削除エラー:", error);
      const errorMessage = getErrorMessage(error);
      errorToast("削除失敗", errorMessage);
    }
  };

  const handleCloneEvent = (event: Event) => {
    const date = event.dateTime ? event.dateTime.split("T")[0] : "";
    const time = event.dateTime && event.dateTime.includes("T") ? event.dateTime.split("T")[1].substring(0, 5) : "";
    const deadlineDate = event.deadline ? event.deadline.split("T")[0] : "";

    setNewEvent({
      title: `${event.title} (コピー)`,
      type: event.type,
      date: date,
      time: time,
      deadlineDate: deadlineDate,
    });
    setIsCreateDialogOpen(true);
    successToast("情報をコピーしました", "日時などを調整して保存してください");
  };

  const filteredEvents = events
    .filter((e) => e.isAttendanceRequired !== false)
    .filter((e) => selectedEventType === "全て" || e.type === selectedEventType)
    .filter((e) =>
      eventSearchQuery === "" ||
      e.title.toLowerCase().includes(eventSearchQuery.toLowerCase())
    );

  const getUnansweredMembers = (eventId: string) => {
    const eventResponses = responses.filter((r) => r.eventId === eventId);
    const respondedMemberIds = new Set(eventResponses.map((r) => r.memberId));
    return members.filter((m) => !respondedMemberIds.has(m.id));
  };

  const isOverdue = (event: Event) => {
    return new Date(event.deadline) < new Date();
  };

  const getAttendanceSummary = (eventId: string) => {
    const eventResponses = responses.filter((r) => r.eventId === eventId);
    return {
      attended: eventResponses.filter((r) => r.status === "参加").length,
      absent: eventResponses.filter((r) => r.status === "不参加").length,
      undecided: eventResponses.filter((r) => r.status === "遅れる").length,
      unanswered: members.length - eventResponses.length,
    };
  };

  const exportToCSV = () => {
    const data = events
      .filter(e => e.isAttendanceRequired !== false)
      .map((event) => {
        const summary = getAttendanceSummary(event.id);
        const row: any = {
          予定名: event.title,
          種類: event.type,
          日時: safeFormat(event.dateTime, "yyyy/MM/dd HH:mm"),
          締切: safeFormat(event.deadline, "yyyy/MM/dd HH:mm"),
          参加: summary.attended,
          不参加: summary.absent,
          遅れる: summary.undecided,
          未回答: summary.unanswered,
        };

        members.forEach((member) => {
          const response = responses.find(
            (r) => r.eventId === event.id && r.memberId === member.id
          );
          row[member.name] = response?.status || "未回答";
        });

        return row;
      });

    const csv = Papa.unparse(data, { header: true });
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `出欠データ_${format(new Date(), "yyyyMMdd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: ResponseStatus) => {
    const badges: Record<ResponseStatus, JSX.Element> = {
      参加: (
        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-0">
          参加
        </Badge>
      ),
      不参加: (
        <Badge className="bg-rose-600 hover:bg-rose-700 text-white border-0">
          不参加
        </Badge>
      ),
      遅れる: (
        <Badge className="bg-amber-600 hover:bg-amber-700 text-white border-0">
          遅れる
        </Badge>
      ),
      未回答: (
        <Badge variant="outline">
          未回答
        </Badge>
      ),
    };
    return badges[status];
  };

  const getPriorityBadge = (priority: AnnouncementPriority) => {
    const badges = {
      通常: <Badge variant="outline">通常</Badge>,
      重要: <Badge className="bg-amber-600 text-white border-0">重要</Badge>,
      緊急: <Badge variant="destructive">緊急</Badge>,
    };
    return badges[priority];
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">管理者ダッシュボード</h1>
              <p className="text-[10px] text-muted-foreground uppercase">Management Console</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/")}
              title="ホームに戻る"
            >
              <Home className="w-5 h-5" />
            </Button>
            <ThemeToggle />
            <AdminSidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onTabChangeWithScroll={handleTabChangeWithScroll}
              onExportCSV={exportToCSV}
              onCreateAnnouncement={() => setIsAnnouncementDialogOpen(true)}
              onCreateEvent={() => setIsCreateDialogOpen(true)}
            />
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4 space-y-6 max-w-7xl">
        {/* お知らせ管理セクション */}
        {announcements.length > 0 && (
          <Card className="border shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" />
                    お知らせ管理
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {announcements.slice(0, 3).map((announcement) => (
                <div
                  key={announcement.id}
                  className="p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-bold text-sm truncate">
                          {announcement.title}
                        </h3>
                        {getPriorityBadge(announcement.priority)}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                        {announcement.content}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {safeFormat(announcement.createdAt, "M/d HH:mm")}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditAnnouncement(announcement)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {announcements.length > 3 && (
                <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setActiveTab("announcements")}>
                  すべて表示 ({announcements.length}件)
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* 統計カード */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase text-muted-foreground">予定数</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{events.filter(e => e.isAttendanceRequired !== false).length}</div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase text-muted-foreground">メンバー</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{members.length}</div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase text-muted-foreground">締切超過</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {events.filter((e) => isOverdue(e) && getUnansweredMembers(e.id).length > 0).length}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase text-muted-foreground">回答数</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{responses.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* メインコンテンツ */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto pb-1">
            <TabsList className="h-10">
              <TabsTrigger value="announcements">お知らせ</TabsTrigger>
              <TabsTrigger value="calendar">カレンダー</TabsTrigger>
              <TabsTrigger value="events">予定一覧</TabsTrigger>
              <TabsTrigger value="matrix">マトリクス</TabsTrigger>
              <TabsTrigger value="shares">共有リンク</TabsTrigger>
              <TabsTrigger value="history">履歴</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="announcements" id="tab-content-announcements" className="space-y-4">
            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">お知らせ一覧</CardTitle>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingAnnouncement(null);
                      setNewAnnouncement({ title: "", content: "", priority: "通常" });
                      setIsAnnouncementDialogOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    追加
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {announcements.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <p>お知らせがありません</p>
                  </div>
                ) : (
                  <>
                    {(() => {
                      const startIndex = (announcementCurrentPage - 1) * announcementItemsPerPage;
                      const paginatedAnnouncements = announcements.slice(startIndex, startIndex + announcementItemsPerPage);
                      const totalPages = Math.ceil(announcements.length / announcementItemsPerPage);

                      return (
                        <div className="space-y-3" ref={announcementListRef}>
                          {paginatedAnnouncements.map((announcement) => (
                            <div key={announcement.id} className="p-4 rounded-lg border bg-card">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-bold text-base truncate">{announcement.title}</h3>
                                    {getPriorityBadge(announcement.priority)}
                                  </div>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-2">{announcement.content}</p>
                                  <p className="text-xs text-muted-foreground">{safeFormat(announcement.createdAt, "M/d HH:mm")}</p>
                                </div>
                                <div className="flex gap-2">
                                  <Button variant="ghost" size="icon" onClick={() => handleEditAnnouncement(announcement)}><Edit className="h-4 w-4" /></Button>
                                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteAnnouncement(announcement.id)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                              </div>
                            </div>
                          ))}
                          {totalPages > 1 && (
                            <div className="mt-6">
                              <Pagination>
                                <PaginationContent>
                                  <PaginationItem><PaginationPrevious onClick={() => handleAnnouncementPageChange(Math.max(1, announcementCurrentPage - 1))} /></PaginationItem>
                                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <PaginationItem key={page}><PaginationLink onClick={() => handleAnnouncementPageChange(page)} isActive={announcementCurrentPage === page}>{page}</PaginationLink></PaginationItem>
                                  ))}
                                  <PaginationItem><PaginationNext onClick={() => handleAnnouncementPageChange(Math.min(totalPages, announcementCurrentPage + 1))} /></PaginationItem>
                                </PaginationContent>
                              </Pagination>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" id="tab-content-calendar" className="space-y-4">
            <div className="rounded-lg border shadow-sm overflow-hidden">
              <EventCalendar
                events={events}
                highlightDates={events
                  .filter((e) => e.isAttendanceRequired !== false && getUnansweredMembers(e.id).length > 0 && e.dateTime)
                  .map((e) => format(new Date(e.dateTime), "yyyy-MM-dd"))
                }
                includeGoogleCalendar={true}
                googleCalendarId={process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID}
                onAddEvent={() => setIsAddEventDialogOpen(true)}
                onDeleteEvent={handleDeleteEvent}
              />
            </div>
          </TabsContent>

          <TabsContent value="events" id="tab-content-events" className="space-y-6" ref={eventListRef}>
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="予定を検索..."
                  value={eventSearchQuery}
                  onChange={(e) => setEventSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />作成</Button>
            </div>

            <div className="space-y-4">
              {filteredEvents.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground"><p>予定がありません</p></div>
              ) : (
                <>
                  {(() => {
                    const startIndex = (eventCurrentPage - 1) * eventItemsPerPage;
                    const paginatedEvents = filteredEvents.slice(startIndex, startIndex + eventItemsPerPage);
                    const totalPages = Math.ceil(filteredEvents.length / eventItemsPerPage);

                    return (
                      <>
                        {paginatedEvents.map((event) => {
                          const unanswered = getUnansweredMembers(event.id);
                          const overdue = isOverdue(event);
                          const summary = getAttendanceSummary(event.id);

                          return (
                            <Card key={event.id} className={`border shadow-sm overflow-hidden ${overdue && unanswered.length > 0 ? "border-destructive" : ""}`}>
                              <CardHeader className="bg-muted/20 pb-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="space-y-1 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <CardTitle className="text-base">{event.title}</CardTitle>
                                      <Badge variant="outline">{event.type}</Badge>
                                      {overdue && unanswered.length > 0 && <Badge variant="destructive">期限超過</Badge>}
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 text-[10px] text-muted-foreground">
                                      <span>開催: {safeFormat(event.dateTime, "yyyy/MM/dd HH:mm")}</span>
                                      <span className={overdue ? "text-destructive font-bold" : ""}>締切: {safeFormat(event.deadline, "yyyy/MM/dd HH:mm")}</span>
                                    </div>
                                  </div>
                                  <div className="flex gap-1 shrink-0">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCloneEvent(event)}><Copy className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => setSelectedEventForShare(event)}><Share2 className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteEvent(event.id)}><Trash2 className="h-4 w-4" /></Button>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-4 pt-4">
                                <div className="grid grid-cols-4 gap-2">
                                  {[
                                    { label: "参加", val: summary.attended, color: "text-emerald-600" },
                                    { label: "不参加", val: summary.absent, color: "text-rose-600" },
                                    { label: "遅れ", val: summary.undecided, color: "text-amber-600" },
                                    { label: "未回答", val: summary.unanswered, color: "text-muted-foreground" }
                                  ].map((s) => (
                                    <div key={s.label} className="text-center p-2 rounded-lg bg-muted/30">
                                      <div className={`text-lg font-bold ${s.color}`}>{s.val}</div>
                                      <div className="text-[10px] text-muted-foreground">{s.label}</div>
                                    </div>
                                  ))}
                                </div>
                                {unanswered.length > 0 && (
                                  <div className="text-xs p-3 rounded bg-muted/50">
                                    <span className="font-bold block mb-1">未回答者 ({unanswered.length}):</span>
                                    <div className="flex flex-wrap gap-1">
                                      {unanswered.map(m => <Badge key={m.id} variant="secondary" className="text-[10px]">{m.name}</Badge>)}
                                    </div>
                                  </div>
                                )}
                                <UnansweredPanel event={event} responses={responses.filter(r => r.eventId === event.id)} />
                              </CardContent>
                            </Card>
                          );
                        })}
                        {totalPages > 1 && (
                          <div className="mt-6">
                            <Pagination>
                              <PaginationContent>
                                <PaginationItem><PaginationPrevious onClick={() => handleEventPageChange(Math.max(1, eventCurrentPage - 1))} /></PaginationItem>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                  <PaginationItem key={page}><PaginationLink onClick={() => handleEventPageChange(page)} isActive={eventCurrentPage === page}>{page}</PaginationLink></PaginationItem>
                                ))}
                                <PaginationItem><PaginationNext onClick={() => handleEventPageChange(Math.min(totalPages, eventCurrentPage + 1))} /></PaginationItem>
                              </PaginationContent>
                            </Pagination>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="matrix" id="tab-content-matrix" className="space-y-4">
            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <CardTitle className="text-lg">出欠マトリクス</CardTitle>
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="メンバー検索..." value={memberSearchQuery} onChange={(e) => setMemberSearchQuery(e.target.value)} className="pl-9 h-8 text-xs" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {filteredEvents.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground"><p>予定がありません</p></div>
                ) : (
                  <div className="space-y-6" ref={matrixListRef}>
                    {(() => {
                      const filteredMembers = members.filter(m => m.name.includes(memberSearchQuery) || m.committee.includes(memberSearchQuery));
                      const startIndex = (currentPage - 1) * itemsPerPage;
                      const paginatedMembers = filteredMembers.slice(startIndex, startIndex + itemsPerPage);
                      const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);

                      return (
                        <>
                          {paginatedMembers.map((member) => (
                            <div key={member.id} className="border rounded-lg overflow-hidden">
                              <div className="bg-muted/50 px-4 py-2 border-b flex justify-between items-center">
                                <div><span className="font-bold">{member.name}</span><span className="text-xs ml-2 text-muted-foreground">{member.committee}</span></div>
                              </div>
                              <div className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {filteredEvents.map((event) => {
                                  const res = responses.find(r => r.eventId === event.id && r.memberId === member.id);
                                  return (
                                    <div key={event.id} className="p-3 rounded border text-xs bg-card">
                                      <div className="font-bold truncate mb-1">{event.title}</div>
                                      <div className="flex justify-between items-center">{getStatusBadge(res?.status || "未回答")}</div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                          {totalPages > 1 && (
                            <div className="mt-6">
                              <Pagination>
                                <PaginationContent>
                                  <PaginationItem><PaginationPrevious onClick={() => handleMatrixPageChange(Math.max(1, currentPage - 1))} /></PaginationItem>
                                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                    <PaginationItem key={p}><PaginationLink onClick={() => handleMatrixPageChange(p)} isActive={currentPage === p}>{p}</PaginationLink></PaginationItem>
                                  ))}
                                  <PaginationItem><PaginationNext onClick={() => handleMatrixPageChange(Math.min(totalPages, currentPage + 1))} /></PaginationItem>
                                </PaginationContent>
                              </Pagination>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shares" id="tab-content-shares" className="space-y-4">
            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30"><CardTitle className="text-lg">共有リンク管理</CardTitle></CardHeader>
              <CardContent className="pt-6"><SharedLinksList events={events} sharedResponses={sharedResponses} /></CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" id="tab-content-history" className="space-y-4">
            <HistoryPanel events={events} responses={responses} members={members} />
          </TabsContent>
        </Tabs>

        <AnnouncementDialog
          isOpen={isAnnouncementDialogOpen}
          onOpenChange={(open) => { setIsAnnouncementDialogOpen(open); if (!open) setEditingAnnouncement(null); }}
          isEditing={!!editingAnnouncement}
          onSubmit={handleCreateAnnouncement}
          onCancel={() => setEditingAnnouncement(null)}
        >
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>タイトル</Label><Input value={newAnnouncement.title} onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})} /></div>
            <div className="space-y-2">
              <Label>優先度</Label>
              <Select value={newAnnouncement.priority} onValueChange={(v: AnnouncementPriority) => setNewAnnouncement({...newAnnouncement, priority: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ANNOUNCEMENT_PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>内容</Label><Textarea value={newAnnouncement.content} onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})} rows={5} /></div>
          </div>
        </AnnouncementDialog>

        <AddEventDialog
          isOpen={isAddEventDialogOpen}
          onOpenChange={setIsAddEventDialogOpen}
          onSubmit={handleCreateCalendarEvent}
          onCancel={() => setNewCalendarEvent({ title: "", description: "", date: "" })}
        >
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>タイトル</Label><Input value={newCalendarEvent.title} onChange={e => setNewCalendarEvent({...newCalendarEvent, title: e.target.value})} /></div>
            <div className="space-y-2"><Label>開催日</Label><Input type="date" value={newCalendarEvent.date} onChange={e => setNewCalendarEvent({...newCalendarEvent, date: e.target.value})} /></div>
            <div className="space-y-2"><Label>説明（オプション）</Label><Textarea value={newCalendarEvent.description} onChange={e => setNewCalendarEvent({...newCalendarEvent, description: e.target.value})} rows={3} /></div>
          </div>
        </AddEventDialog>

        <Dialog open={!!selectedEventForShare} onOpenChange={open => { if (!open) setSelectedEventForShare(null); }}>
          <DialogContent className="w-[95vw] sm:max-w-2xl p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Share2 className="w-5 h-5" />{selectedEventForShare?.title}の共有</DialogTitle>
              <DialogDescription>このイベントへの回答フォームを共有できます</DialogDescription>
            </DialogHeader>
            {selectedEventForShare && <SharePanel event={selectedEventForShare} onShareCreated={()=>{}} onShareDeleted={()=>{}} />}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}