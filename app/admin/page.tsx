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
} from "@/lib/db";
import type { Event, Response, EventType, ResponseStatus, Announcement, AnnouncementPriority } from "@/lib/types";
import { EVENT_TYPES, ANNOUNCEMENT_PRIORITIES } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { AnnouncementDialog, ShareLinkDialog, AddEventDialog } from "@/components/CommonDialogs";

import { useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/Loading";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AdminPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventType, setSelectedEventType] = useState<EventType | "全て">("全て");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false);
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("events");
  const [selectedEventForShare, setSelectedEventForShare] = useState<Event | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // 1ページに10メンバー表示
  const [eventCurrentPage, setEventCurrentPage] = useState(1);
  const eventItemsPerPage = 10; // 1ページに10イベント表示
  const matrixListRef = useRef<HTMLDivElement>(null);
  const eventListRef = useRef<HTMLDivElement>(null);
  const announcementListRef = useRef<HTMLDivElement>(null);
  const [announcementCurrentPage, setAnnouncementCurrentPage] = useState(1);
  const announcementItemsPerPage = 10; // 1ページに10お知らせ表示

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

    // 次のフレームでスクロール（状態更新後に実行）
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
      const [eventsData, responsesData, announcementsData] = await Promise.all([
        getAllEvents(),
        getAllResponses(),
        getAllAnnouncements(),
      ]);
      setEvents(eventsData);
      setResponses(responsesData);
      setAnnouncements(announcementsData);
    } catch (error) {
      console.error("データ読み込みエラー:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // リアルタイムリスナーの設定
    const unsubscribeEvents = subscribeToAllEvents((updatedEvents) => {
      setEvents(updatedEvents);
    });

    const unsubscribeResponses = subscribeToAllResponses((updatedResponses) => {
      setResponses(updatedResponses);
    });

    const unsubscribeAnnouncements = subscribeToAllAnnouncements((updatedAnnouncements) => {
      setAnnouncements(updatedAnnouncements);
    });

    // クリーンアップ: コンポーネントアンマウント時にリスナーを解除
    return () => {
      unsubscribeEvents();
      unsubscribeResponses();
      unsubscribeAnnouncements();
    };
  }, []);

  // タブ変更時にページをリセット
  useEffect(() => {
    setCurrentPage(1);
    setEventCurrentPage(1);
    setAnnouncementCurrentPage(1);
  }, [activeTab]);

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.date || !newEvent.deadlineDate) {
      alert("タイトル、開催日、締切日を入力してください");
      return;
    }

    try {
      // 開催日時を構築（時間が指定されていない場合は00:00）
      const dateTime = newEvent.time
        ? `${newEvent.date}T${newEvent.time}:00`
        : `${newEvent.date}T00:00:00`;

      // 締め切りは指定日の23:59
      const deadline = `${newEvent.deadlineDate}T23:59:00`;

      await createEvent({
        title: newEvent.title,
        type: newEvent.type,
        dateTime: dateTime,
        deadline: deadline,
        createdBy: "admin",
      });

      setIsCreateDialogOpen(false);
      setNewEvent({
        title: "",
        type: "定例会",
        date: "",
        time: "",
        deadlineDate: "",
      });
      // リアルタイムリスナーが自動的に更新する
    } catch (error) {
      console.error("予定作成エラー:", error);
      alert("予定の作成に失敗しました");
    }
  };

  const handleCreateCalendarEvent = async () => {
    if (!newCalendarEvent.title || !newCalendarEvent.date) {
      alert("タイトルと開催日を入力してください");
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
      });

      setIsAddEventDialogOpen(false);
      setNewCalendarEvent({
        title: "",
        description: "",
        date: "",
      });
    } catch (error) {
      console.error("カレンダーからの予定作成エラー:", error);
      alert("予定の作成に失敗しました");
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      alert("タイトルと内容を入力してください");
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
      // リアルタイムリスナーが自動的に更新する
    } catch (error) {
      console.error("お知らせ作成エラー:", error);
      alert("お知らせの作成に失敗しました");
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
      // リアルタイムリスナーが自動的に更新する
    } catch (error) {
      console.error("お知らせ削除エラー:", error);
      alert("お知らせの削除に失敗しました");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("この予定を削除してもよろしいですか?")) {
      return;
    }

    try {
      await deleteEvent(eventId);
      // リアルタイムリスナーが自動的に更新する
    } catch (error) {
      console.error("予定削除エラー:", error);
      alert("予定の削除に失敗しました");
    }
  };

  const filteredEvents =
    selectedEventType === "全て"
      ? events
      : events.filter((e) => e.type === selectedEventType);

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
    const data = events.map((event) => {
      const summary = getAttendanceSummary(event.id);
      const row: any = {
        予定名: event.title,
        種類: event.type,
        日時: format(new Date(event.dateTime), "yyyy/MM/dd HH:mm", { locale: ja }),
        締切: format(new Date(event.deadline), "yyyy/MM/dd HH:mm", { locale: ja }),
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
        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-0">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          参加
        </Badge>
      ),
      不参加: (
        <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-0">
          <XCircle className="w-3 h-3 mr-1" />
          不参加
        </Badge>
      ),
      遅れる: (
        <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0">
          <Clock className="w-3 h-3 mr-1" />
          遅れる
        </Badge>
      ),
      未回答: (
        <Badge variant="outline" className="bg-gray-50 dark:bg-gray-900">
          未回答
        </Badge>
      ),
    };
    return badges[status];
  };

  const getPriorityBadge = (priority: AnnouncementPriority) => {
    const badges = {
      通常: <Badge variant="outline">通常</Badge>,
      重要: <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0">重要</Badge>,
      緊急: <Badge className="bg-red-500 hover:bg-red-600 text-white border-0">緊急</Badge>,
    };
    return badges[priority];
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold">管理者ダッシュボード</h1>
                <p className="text-xs text-muted-foreground">出欠状況管理</p>
              </div>
              <h1 className="text-lg font-bold sm:hidden">管理画面</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/")}
              className="text-muted-foreground hover:text-foreground"
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
        {/* お知らせ管理セクション (上部クイック表示) */}
        {announcements.length > 0 && (
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    お知らせ管理
                  </CardTitle>
                  <CardDescription className="mt-1">
                    作成したお知らせの管理
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className={`p-4 rounded-lg border transition-all ${announcement.priority === "緊急"
                    ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/50"
                    : announcement.priority === "重要"
                      ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50"
                      : "bg-card"
                    }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {announcement.priority !== "通常" && (
                          <Megaphone className="w-4 h-4 text-primary shrink-0" />
                        )}
                        <h3 className="font-semibold text-base truncate">
                          {announcement.title}
                        </h3>
                        {getPriorityBadge(announcement.priority)}
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-2">
                        {announcement.content}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(announcement.createdAt), "M月d日 HH:mm", { locale: ja })}
                        {announcement.updatedAt && " (編集済み)"}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                        onClick={() => handleEditAnnouncement(announcement)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 統計カード */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総予定数</CardTitle>
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{events.length}</div>
              <p className="text-xs text-muted-foreground mt-1">登録済み予定</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">メンバー数</CardTitle>
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{members.length}</div>
              <p className="text-xs text-muted-foreground mt-1">生徒会メンバー</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">締切超過</CardTitle>
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {events.filter((e) => isOverdue(e) && getUnansweredMembers(e.id).length > 0).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">未回答あり</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総回答数</CardTitle>
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{responses.length}</div>
              <p className="text-xs text-muted-foreground mt-1">提出済み</p>
            </CardContent>
          </Card>
        </div>

        {/* メインコンテンツ */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center justify-center overflow-x-auto flex-1">
              <TabsList className="inline-flex h-11 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
                <TabsTrigger
                  value="announcements"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">お知らせ</span>
                </TabsTrigger>
                <TabsTrigger
                  value="calendar"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">カレンダー</span>
                </TabsTrigger>
                <TabsTrigger
                  value="events"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">予定一覧</span>
                </TabsTrigger>
                <TabsTrigger
                  value="matrix"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  <Users className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">マトリクス</span>
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  <History className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">履歴</span>
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="flex gap-2 ml-4">
              {activeTab === "announcements" && (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingAnnouncement(null);
                    setNewAnnouncement({ title: "", content: "", priority: "通常" });
                    setIsAnnouncementDialogOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  お知らせ作成
                </Button>
              )}
              {activeTab === "events" && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      予定を追加
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] sm:max-w-md p-4 sm:p-6">
                    <DialogHeader className="space-y-2">
                      <DialogTitle className="text-lg sm:text-xl">予定を作成</DialogTitle>
                      <DialogDescription className="text-sm sm:text-base">
                        新しい予定を追加してください
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="event-title" className="text-sm sm:text-base">タイトル</Label>
                        <Input
                          id="event-title"
                          value={newEvent.title}
                          onChange={(e) =>
                            setNewEvent({ ...newEvent, title: e.target.value })
                          }
                          placeholder="例: 定例会"
                          className="text-sm sm:text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="event-type" className="text-sm sm:text-base">種類</Label>
                        <Select
                          value={newEvent.type}
                          onValueChange={(value: EventType) =>
                            setNewEvent({ ...newEvent, type: value })
                          }
                        >
                          <SelectTrigger className="text-sm sm:text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {EVENT_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="event-date" className="text-sm sm:text-base">開催日</Label>
                        <Input
                          id="event-date"
                          type="date"
                          value={newEvent.date}
                          onChange={(e) =>
                            setNewEvent({ ...newEvent, date: e.target.value })
                          }
                          className="text-sm sm:text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="event-time" className="text-sm sm:text-base">開催時刻（オプション）</Label>
                        <Input
                          id="event-time"
                          type="time"
                          value={newEvent.time}
                          onChange={(e) =>
                            setNewEvent({ ...newEvent, time: e.target.value })
                          }
                          className="text-sm sm:text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="event-deadline" className="text-sm sm:text-base">締切日</Label>
                        <Input
                          id="event-deadline"
                          type="date"
                          value={newEvent.deadlineDate}
                          onChange={(e) =>
                            setNewEvent({ ...newEvent, deadlineDate: e.target.value })
                          }
                          className="text-sm sm:text-base"
                        />
                      </div>
                    </div>

                    <DialogFooter className="flex gap-2 justify-end pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsCreateDialogOpen(false);
                          setNewEvent({
                            title: "",
                            type: "定例会",
                            date: "",
                            time: "",
                            deadlineDate: "",
                          });
                        }}
                        size="sm"
                      >
                        キャンセル
                      </Button>
                      <Button onClick={handleCreateEvent} size="sm">
                        作成
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          <TabsContent value="announcements" id="tab-content-announcements" className="space-y-4">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>お知らせ一覧</CardTitle>
                    <CardDescription className="mt-1">
                      メンバーに表示されるお知らせを管理
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {announcements.length === 0 ? (
                  <div className="py-12 text-center">
                    <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">お知らせがありません</p>
                    <Button
                      onClick={() => {
                        setEditingAnnouncement(null);
                        setNewAnnouncement({ title: "", content: "", priority: "通常" });
                        setIsAnnouncementDialogOpen(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      最初のお知らせを作成
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* ページネーション計算 */}
                    {(() => {
                      const startIndex = (announcementCurrentPage - 1) * announcementItemsPerPage;
                      const endIndex = startIndex + announcementItemsPerPage;
                      const paginatedAnnouncements = announcements.slice(startIndex, endIndex);
                      const totalPages = Math.ceil(announcements.length / announcementItemsPerPage);

                      return (
                        <Fragment>
                          <div className="space-y-3" ref={announcementListRef}>
                            {paginatedAnnouncements.map((announcement) => (
                              <div
                                key={announcement.id}
                                className={`p-4 rounded-lg border transition-all ${announcement.priority === "緊急"
                                  ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/50"
                                  : announcement.priority === "重要"
                                    ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50"
                                    : "bg-card hover:shadow-md"
                                  }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      {announcement.priority !== "通常" && (
                                        <Megaphone className="w-4 h-4 text-primary shrink-0" />
                                      )}
                                      <h3 className="font-semibold text-base truncate">
                                        {announcement.title}
                                      </h3>
                                      {getPriorityBadge(announcement.priority)}
                                    </div>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-2">
                                      {announcement.content}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {format(new Date(announcement.createdAt), "M月d日 HH:mm", { locale: ja })}
                                      {announcement.updatedAt && " (編集済み)"}
                                    </p>
                                  </div>
                                  <div className="flex gap-2 shrink-0">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                                      onClick={() => handleEditAnnouncement(announcement)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                      onClick={() => handleDeleteAnnouncement(announcement.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* ページネーション */}
                          {totalPages > 1 && (
                            <div className="mt-6">
                              <Pagination>
                                <PaginationContent>
                                  <PaginationItem>
                                    <PaginationPrevious
                                      onClick={() => handleAnnouncementPageChange(Math.max(1, announcementCurrentPage - 1))}
                                      className={announcementCurrentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                  </PaginationItem>
                                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <PaginationItem key={page}>
                                      <PaginationLink
                                        onClick={() => handleAnnouncementPageChange(page)}
                                        isActive={announcementCurrentPage === page}
                                        className="cursor-pointer"
                                      >
                                        {page}
                                      </PaginationLink>
                                    </PaginationItem>
                                  ))}
                                  <PaginationItem>
                                    <PaginationNext
                                      onClick={() => handleAnnouncementPageChange(Math.min(totalPages, announcementCurrentPage + 1))}
                                      className={announcementCurrentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                  </PaginationItem>
                                </PaginationContent>
                              </Pagination>
                            </div>
                          )}
                        </Fragment>
                      );
                    })()}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" id="tab-content-calendar" className="space-y-4">
            <EventCalendar
              events={events}
              highlightDates={events
                .filter((e) => getUnansweredMembers(e.id).length > 0)
                .map((e) => format(new Date(e.dateTime), "yyyy-MM-dd", { locale: ja }))}
              includeGoogleCalendar={true}
              googleCalendarId={process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID}
              onAddEvent={() => setIsAddEventDialogOpen(true)}
            />
          </TabsContent>

          <TabsContent value="events" id="tab-content-events" className="space-y-4" ref={eventListRef}>
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <Label className="text-sm font-medium">絞り込み:</Label>
                  <Select
                    value={selectedEventType}
                    onValueChange={(value) => setSelectedEventType(value as EventType | "全て")}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="全て">全て</SelectItem>
                      {EVENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
            </Card>

            <div className="space-y-4">
              {filteredEvents.length === 0 ? (
                <Card className="border-0 shadow-md">
                  <CardContent className="py-12 text-center">
                    <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">予定がありません</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* ページネーション計算 */}
                  {(() => {
                    const startIndex = (eventCurrentPage - 1) * eventItemsPerPage;
                    const endIndex = startIndex + eventItemsPerPage;
                    const paginatedEvents = filteredEvents.slice(startIndex, endIndex);
                    const totalPages = Math.ceil(filteredEvents.length / eventItemsPerPage);

                    return (
                      <>
                        {paginatedEvents.map((event) => {
                          const unanswered = getUnansweredMembers(event.id);
                          const overdue = isOverdue(event);
                          const hasWarning = overdue && unanswered.length > 0;
                          const summary = getAttendanceSummary(event.id);

                          return (
                            <Card
                              key={event.id}
                              className={`border-0 shadow-md transition-all ${hasWarning ? "ring-2 ring-red-500" : ""
                                }`}
                            >
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-2 flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <CardTitle className="text-lg sm:text-xl truncate">
                                        {event.title}
                                      </CardTitle>
                                      <Badge variant="outline" className="shrink-0">
                                        {event.type}
                                      </Badge>
                                      {hasWarning && (
                                        <Badge className="bg-red-500 hover:bg-red-600 text-white border-0 shrink-0">
                                          <AlertTriangle className="w-3 h-3 mr-1" />
                                          <span className="hidden sm:inline">締切超過</span>
                                          <span className="sm:hidden">警告</span>
                                        </Badge>
                                      )}
                                    </div>
                                    <CardDescription className="text-xs sm:text-sm">
                                      <div className="flex flex-col gap-1">
                                        <span>
                                          開催: {format(new Date(event.dateTime), "M/d HH:mm", { locale: ja })}
                                        </span>
                                        <span>
                                          締切: {format(new Date(event.deadline), "M/d HH:mm", { locale: ja })}
                                        </span>
                                      </div>
                                    </CardDescription>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setSelectedEventForShare(event)}
                                      className="gap-2"
                                    >
                                      <Share2 className="h-4 w-4" />
                                      <span className="hidden sm:inline">共有</span>
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                      onClick={() => handleDeleteEvent(event.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>

                              <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                  <div className="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950">
                                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                      {summary.attended}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">参加</div>
                                  </div>
                                  <div className="text-center p-3 rounded-lg bg-rose-50 dark:bg-rose-950">
                                    <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                                      {summary.absent}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">不参加</div>
                                  </div>
                                  <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-950">
                                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                      {summary.undecided}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">遅れる</div>
                                  </div>
                                  <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                                    <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                                      {summary.unanswered}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">未回答</div>
                                  </div>
                                </div>

                                {unanswered.length > 0 && (
                                  <div className="p-3 rounded-lg bg-muted/50">
                                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                                      未回答者 ({unanswered.length}名)
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                      {unanswered.map((member) => (
                                        <Badge key={member.id} variant="secondary" className="text-xs">
                                          {member.name}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* 未回答者促促パネル */}
                                <UnansweredPanel event={event} responses={responses.filter((r) => r.eventId === event.id)} />

                                <div>
                                  <h4 className="text-sm font-semibold mb-3">回答詳細</h4>
                                  <div className="space-y-2">
                                    {members.map((member) => {
                                      const response = responses.find(
                                        (r) => r.eventId === event.id && r.memberId === member.id
                                      );
                                      const status: ResponseStatus = response?.status || "未回答";
                                      return (
                                        <div
                                          key={member.id}
                                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-muted/30"
                                        >
                                          <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm truncate">
                                              {member.name}
                                              <span className="text-xs text-muted-foreground ml-2">
                                                ({member.committee})
                                              </span>
                                            </div>
                                            {response?.reason && (
                                              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                理由: {response.reason}
                                              </div>
                                            )}
                                          </div>
                                          <div className="shrink-0">
                                            {getStatusBadge(status)}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}

                        {/* ページネーション */}
                        {totalPages > 1 && (
                          <div className="mt-6">
                            <Pagination>
                              <PaginationContent>
                                <PaginationItem>
                                  <PaginationPrevious
                                    onClick={() => handleEventPageChange(Math.max(1, eventCurrentPage - 1))}
                                    className={eventCurrentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                  />
                                </PaginationItem>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                  <PaginationItem key={page}>
                                    <PaginationLink
                                      onClick={() => handleEventPageChange(page)}
                                      isActive={eventCurrentPage === page}
                                      className="cursor-pointer"
                                    >
                                      {page}
                                    </PaginationLink>
                                  </PaginationItem>
                                ))}
                                <PaginationItem>
                                  <PaginationNext
                                    onClick={() => handleEventPageChange(Math.min(totalPages, eventCurrentPage + 1))}
                                    className={eventCurrentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                  />
                                </PaginationItem>
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
            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle>出欠マトリクス</CardTitle>
                    <CardDescription className="mt-1">
                      全メンバーと全予定の出欠状況一覧
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">絞り込み:</Label>
                    <Select
                      value={selectedEventType}
                      onValueChange={(value) => setSelectedEventType(value as EventType | "全て")}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="全て">全て</SelectItem>
                        {EVENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredEvents.length === 0 ? (
                  <div className="py-12 text-center">
                    <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">予定がありません</p>
                  </div>
                ) : (
                  <div className="space-y-6" ref={matrixListRef}>
                    {/* ページネーション計算 */}
                    {(() => {
                      const startIndex = (currentPage - 1) * itemsPerPage;
                      const endIndex = startIndex + itemsPerPage;
                      const paginatedMembers = members.slice(startIndex, endIndex);
                      const totalPages = Math.ceil(members.length / itemsPerPage);

                      return (
                        <>
                          {/* メンバーごとのビュー */}
                          {paginatedMembers.map((member) => (
                            <div key={member.id} className="border rounded-lg overflow-hidden">
                              <div className="bg-muted/50 px-4 py-3 border-b">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3 className="font-semibold text-base">{member.name}</h3>
                                    <p className="text-sm text-muted-foreground">{member.committee}</p>
                                  </div>
                                  <div className="flex gap-2 text-xs">
                                    {(() => {
                                      const memberResponses = responses.filter(r => r.memberId === member.id);
                                      const attended = memberResponses.filter(r => r.status === "参加").length;
                                      const absent = memberResponses.filter(r => r.status === "不参加").length;
                                      const undecided = memberResponses.filter(r => r.status === "遅れる").length;
                                      const unanswered = filteredEvents.length - memberResponses.filter(r =>
                                        filteredEvents.some(e => e.id === r.eventId)
                                      ).length;

                                      return (
                                        <>
                                          {attended > 0 && (
                                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0">
                                              参加 {attended}
                                            </Badge>
                                          )}
                                          {absent > 0 && (
                                            <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border-0">
                                              不参加 {absent}
                                            </Badge>
                                          )}
                                          {undecided > 0 && (
                                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0">
                                              遅れる {undecided}
                                            </Badge>
                                          )}
                                          {unanswered > 0 && (
                                            <Badge variant="outline" className="bg-gray-50 dark:bg-gray-900">
                                              未回答 {unanswered}
                                            </Badge>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                              <div className="p-4">
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                  {filteredEvents.map((event) => {
                                    const response = responses.find(
                                      (r) => r.eventId === event.id && r.memberId === member.id
                                    );
                                    const status: ResponseStatus = response?.status || "未回答";

                                    return (
                                      <div
                                        key={event.id}
                                        className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:shadow-md transition-shadow"
                                      >
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-medium text-sm truncate">{event.title}</h4>
                                            <Badge variant="outline" className="text-xs shrink-0">
                                              {event.type}
                                            </Badge>
                                          </div>
                                          <p className="text-xs text-muted-foreground mb-2">
                                            {format(new Date(event.dateTime), "M/d HH:mm")}
                                          </p>
                                          <div className="flex items-center justify-between">
                                            {getStatusBadge(status)}
                                          </div>
                                          {response?.reason && (
                                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                              {response.reason}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* ページネーション */}
                          {totalPages > 1 && (
                            <div className="mt-6">
                              <Pagination>
                                <PaginationContent>
                                  <PaginationItem>
                                    <PaginationPrevious
                                      onClick={() => handleMatrixPageChange(Math.max(1, currentPage - 1))}
                                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                  </PaginationItem>
                                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <PaginationItem key={page}>
                                      <PaginationLink
                                        onClick={() => handleMatrixPageChange(page)}
                                        isActive={currentPage === page}
                                        className="cursor-pointer"
                                      >
                                        {page}
                                      </PaginationLink>
                                    </PaginationItem>
                                  ))}
                                  <PaginationItem>
                                    <PaginationNext
                                      onClick={() => handleMatrixPageChange(Math.min(totalPages, currentPage + 1))}
                                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                  </PaginationItem>
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

          {/* 履歴タブ */}
          <TabsContent value="history" id="tab-content-history" className="space-y-4">
            <HistoryPanel events={events} responses={responses} members={members} />
          </TabsContent>
        </Tabs>

        {/* アナウンスメント作成・編集ダイアログ */}
        <AnnouncementDialog
          isOpen={isAnnouncementDialogOpen}
          onOpenChange={(open) => {
            setIsAnnouncementDialogOpen(open);
            if (!open) {
              setEditingAnnouncement(null);
              setNewAnnouncement({ title: "", content: "", priority: "通常" });
            }
          }}
          isEditing={!!editingAnnouncement}
          onSubmit={handleCreateAnnouncement}
          onCancel={() => {
            setEditingAnnouncement(null);
            setNewAnnouncement({ title: "", content: "", priority: "通常" });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="announcement-title">タイトル</Label>
            <Input
              id="announcement-title"
              value={newAnnouncement.title}
              onChange={(e) =>
                setNewAnnouncement({ ...newAnnouncement, title: e.target.value })
              }
              placeholder="例: 文化祭準備のお知らせ"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="announcement-priority">優先度</Label>
            <Select
              value={newAnnouncement.priority}
              onValueChange={(value: AnnouncementPriority) =>
                setNewAnnouncement({ ...newAnnouncement, priority: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ANNOUNCEMENT_PRIORITIES.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {priority}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="announcement-content">内容</Label>
            <Textarea
              id="announcement-content"
              value={newAnnouncement.content}
              onChange={(e) =>
                setNewAnnouncement({ ...newAnnouncement, content: e.target.value })
              }
              placeholder="お知らせの内容を入力してください"
              rows={5}
            />
          </div>
        </AnnouncementDialog>

        {/* 予定追加ダイアログ (カレンダー用) */}
        <AddEventDialog
          isOpen={isAddEventDialogOpen}
          onOpenChange={setIsAddEventDialogOpen}
          onSubmit={handleCreateCalendarEvent}
          onCancel={() => {
            setNewCalendarEvent({
              title: "",
              description: "",
              date: "",
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="calendar-event-title">タイトル</Label>
            <Input
              id="calendar-event-title"
              value={newCalendarEvent.title}
              onChange={(e) =>
                setNewCalendarEvent({ ...newCalendarEvent, title: e.target.value })
              }
              placeholder="例: 臨時集会"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="calendar-event-date">開催日</Label>
            <Input
              id="calendar-event-date"
              type="date"
              value={newCalendarEvent.date}
              onChange={(e) =>
                setNewCalendarEvent({ ...newCalendarEvent, date: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="calendar-event-description">説明（オプション）</Label>
            <Textarea
              id="calendar-event-description"
              value={newCalendarEvent.description}
              onChange={(e) =>
                setNewCalendarEvent({ ...newCalendarEvent, description: e.target.value })
              }
              placeholder="予定の詳細などを入力"
              rows={3}
            />
          </div>
        </AddEventDialog>

        {/* 共有ダイアログ */}
        <Dialog open={!!selectedEventForShare} onOpenChange={(open) => {
          if (!open) setSelectedEventForShare(null);
        }}>
          <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[85vh] p-4 sm:p-6 flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Share2 className="w-5 h-5 flex-shrink-0" />
                <span className="line-clamp-1">{selectedEventForShare?.title || ""}の共有</span>
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                このイベントへの回答フォームを共有できます
              </DialogDescription>
            </DialogHeader>
            {selectedEventForShare && (
              <div className="flex-1 overflow-y-auto">
                <SharePanel
                  event={selectedEventForShare}
                  onShareCreated={() => {
                    // 必要に応じて更新処理
                  }}
                  onShareDeleted={() => {
                    // 必要に応じて更新処理
                  }}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}