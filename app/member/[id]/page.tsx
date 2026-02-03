"use client";

import { useState, useEffect, JSX } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, isPast, isFuture } from "date-fns";
import { ja } from "date-fns/locale";
import { clearAllSession, getErrorMessage } from "@/lib/utils";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  LogOut,
  User,
  TrendingUp,
  Activity,
  Bell,
  Megaphone,
  Share2,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoadingScreen } from "@/components/Loading";
import { EventCalendar } from "@/components/EventCalendar";
import { members } from "@/lib/members";
import { successToast, errorToast } from "@/components/ui/toast-simple";
import {
  getAllEvents,
  getAllResponses,
  saveResponse,
  getResponse,
  getAllAnnouncements,
  subscribeToAllEvents,
  subscribeToAllResponses,
  subscribeToAllAnnouncements,
} from "@/lib/db";
import type { Event, Response, ResponseStatus, Announcement } from "@/lib/types";
import { REASON_PRESETS } from "@/lib/types";

export default function MemberDashboard() {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;

  const [member, setMember] = useState(members.find((m) => m.id === memberId));
  const [events, setEvents] = useState<Event[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ResponseStatus>("参加");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

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
    if (!member) {
      router.push("/");
      return;
    }
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
  }, [member, router]);

  const handleEventClick = async (event: Event) => {
    if (isDeadlinePassed(event)) {
      return;
    }

    setSelectedEvent(event);

    // 既存の回答を取得
    const existingResponse = await getResponse(event.id, memberId);
    if (existingResponse) {
      setSelectedStatus(existingResponse.status);
      setReason(existingResponse.reason || "");
    } else {
      setSelectedStatus("参加");
      setReason("");
    }

    setDialogOpen(true);
  };

  const handleSaveResponse = async () => {
    if (!selectedEvent) return;

    // 参加以外で理由が空の場合はエラー
    if ((selectedStatus === "遅れる" || selectedStatus === "不参加") && !reason.trim()) {
      errorToast("入力エラー", "理由を入力してください");
      return;
    }

    setSaving(true);
    try {
      const responseData: Response = {
        eventId: selectedEvent.id,
        memberId: memberId,
        status: selectedStatus,
        updatedAt: new Date().toISOString(),
        updatedBy: memberId,
      };

      // reason が空でない場合のみ追加
      if (reason.trim()) {
        responseData.reason = reason.trim();
      }

      console.log("📝 回答を保存中:", responseData);
      await saveResponse(responseData);
      console.log("✓ 回答保存成功");
      // リアルタイムリスナーが自動的に更新する
      setDialogOpen(false);
      setSelectedEvent(null);
      setReason("");
      successToast("回答完了", "回答を保存しました");
    } catch (error) {
      console.error("✗ 回答保存エラー:", error);
      const errorMessage =
        error instanceof Error ? error.message : "回答の保存に失敗しました";
      errorToast("保存失敗", errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const isDeadlinePassed = (event: Event) => {
    return isPast(new Date(event.deadline));
  };

  const getMyResponse = (eventId: string) => {
    return responses.find((r) => r.eventId === eventId && r.memberId === memberId);
  };

  const getStatusBadge = (status: ResponseStatus, isOverdue: boolean = false) => {
    if (isOverdue && status === "未回答") {
      return (
        <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-0">
          <AlertTriangle className="w-3 h-3 mr-1" />
          期限切れ
        </Badge>
      );
    }

    const badges: Record<ResponseStatus, JSX.Element> = {
      参加: (
        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-0">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          参加
        </Badge>
      ),
      遅れる: (
        <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0">
          <Clock className="w-3 h-3 mr-1" />
          遅れる
        </Badge>
      ),
      不参加: (
        <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-0">
          <XCircle className="w-3 h-3 mr-1" />
          不参加
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

  const getPriorityBadge = (priority: Announcement["priority"]) => {
    const badges = {
      通常: <Badge variant="outline">通常</Badge>,
      重要: <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0">重要</Badge>,
      緊急: <Badge className="bg-red-500 hover:bg-red-600 text-white border-0">緊急</Badge>,
    };
    return badges[priority];
  };

  const getUpcomingEvents = () => {
    return events
      .filter((e) => isFuture(new Date(e.dateTime)))
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
      .slice(0, 3);
  };

  const getMyStats = () => {
    const myResponses = responses.filter((r) => r.memberId === memberId);
    return {
      participated: myResponses.filter((r) => r.status === "参加").length,
      late: myResponses.filter((r) => r.status === "遅れる").length,
      absent: myResponses.filter((r) => r.status === "不参加").length,
      unanswered: events.filter((e) => {
        const response = getMyResponse(e.id);
        return !response;
      }).length,
      overdueUnanswered: events.filter((e) => {
        const response = getMyResponse(e.id);
        return !response && isDeadlinePassed(e);
      }).length,
    };
  };

  const handleLogout = () => {
    // セッション情報を完全に削除
    clearAllSession();
    // ログイン画面に戻る
    router.push("/");
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!member) {
    return null;
  }

  const upcomingEvents = getUpcomingEvents();
  const stats = getMyStats();

  // 未回答かつ期限が近い、または開催が近い予定
  const urgentEvents = events
    .filter((e) => !getMyResponse(e.id) && !isDeadlinePassed(e))
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 2);

  // 最近の活動（最新5件の回答）
  const recentActivities = responses
    .filter((r) => r.memberId === memberId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)
    .map(r => ({
        ...r,
        event: events.find(e => e.id === r.eventId)
    }))
    .filter(a => a.event);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold">{member.name}</h1>
              <p className="text-xs text-muted-foreground">{member.committee}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">ログアウト</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-3 sm:p-4 space-y-4 sm:space-y-6 max-w-4xl">
        {/* 緊急のアクションが必要な予定 */}
        {urgentEvents.length > 0 && (
          <Card className="border-2 border-amber-500 shadow-lg animate-pulse-subtle bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5" />
                回答が必要です
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {urgentEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-800 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm sm:text-base truncate">{event.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      締切: {format(new Date(event.deadline), "M/d HH:mm")}
                    </p>
                  </div>
                  <Button size="sm" className="ml-4 shrink-0 bg-amber-600 hover:bg-amber-700 text-white">
                    回答する
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* お知らせセクション */}
        {announcements.length > 0 && (
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                お知らせ
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                最新のお知らせを確認してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              {announcements.slice(0, 3).map((announcement) => (
                <div
                  key={announcement.id}
                  onClick={() => {
                    setSelectedAnnouncement(announcement);
                    setAnnouncementDialogOpen(true);
                  }}
                  className={`p-3 sm:p-4 rounded-lg border transition-all cursor-pointer active:shadow-lg ${announcement.priority === "緊急"
                    ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/50"
                    : announcement.priority === "重要"
                      ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50"
                      : "bg-card hover:shadow-md"
                    }`}
                >
                  <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      {announcement.priority !== "通常" && (
                        <Megaphone className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      )}
                      <h3 className="font-semibold text-sm sm:text-base truncate">
                        {announcement.title}
                      </h3>
                    </div>
                    <div className="shrink-0">{getPriorityBadge(announcement.priority)}</div>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap">
                    {announcement.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(announcement.createdAt), "M月d日 HH:mm", { locale: ja })}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 統計カード */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">参加</CardTitle>
              <div className="p-1.5 sm:p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold">{stats.participated}</div>
              <p className="text-xs text-muted-foreground mt-1">回答済み</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">遅れる</CardTitle>
              <div className="p-1.5 sm:p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold">{stats.late}</div>
              <p className="text-xs text-muted-foreground mt-1">遅刻予定</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">不参加</CardTitle>
              <div className="p-1.5 sm:p-2 bg-rose-100 dark:bg-rose-900 rounded-lg">
                <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-rose-600 dark:text-rose-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold">{stats.absent}</div>
              <p className="text-xs text-muted-foreground mt-1">欠席</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">未回答</CardTitle>
              <div className="p-1.5 sm:p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 dark:text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold">{stats.unanswered}</div>
              {stats.overdueUnanswered > 0 && (
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-medium">
                  期限切れ {stats.overdueUnanswered}件
                </p>
              )}
              {stats.overdueUnanswered === 0 && (
                <p className="text-xs text-muted-foreground mt-1">残り回答</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* カレンダー */}
        <EventCalendar
          events={events}
          onEventClick={handleEventClick}
          highlightDates={events.filter(e => !getMyResponse(e.id)).map(e => format(new Date(e.dateTime), "yyyy-MM-dd"))}
          includeGoogleCalendar={true}
          googleCalendarId={process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID}
        />

        {/* 直近の予定 */}
        {upcomingEvents.length > 0 && (
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    直近の予定
                  </CardTitle>
                  <CardDescription className="mt-1 text-xs sm:text-sm">
                    回答が必要な予定を確認してください
                  </CardDescription>
                </div>
              </div>
              {stats.unanswered > 0 && (
                <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-900 dark:text-amber-100 text-sm sm:text-base">
                        {stats.unanswered}件の回答が必要です
                      </p>
                      <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200 mt-1">
                        下記の予定をタップして、出欠を回答してください。
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              {upcomingEvents.map((event) => {
                const response = getMyResponse(event.id);
                const status: ResponseStatus = response?.status || "未回答";
                const deadlinePassed = isDeadlinePassed(event);
                const isUrgent = !response && !deadlinePassed;

                return (
                  <div
                    key={event.id}
                    className={`p-3 sm:p-4 rounded-lg border transition-all ${isUrgent
                      ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50"
                      : "bg-card hover:shadow-md"
                      } ${!deadlinePassed ? "cursor-pointer active:shadow-lg" : "opacity-60"}`}
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap gap-y-1">
                          <h3 className="font-semibold text-sm sm:text-base truncate">
                            {event.title}
                          </h3>
                          <Badge variant="outline" className="shrink-0 text-xs">
                            {event.type}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-xs sm:text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                            <span>
                              {format(new Date(event.dateTime), "M月d日(E) HH:mm", {
                                locale: ja,
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                            <span>
                              締切: {format(new Date(event.deadline), "M月d日 HH:mm")}
                            </span>
                          </div>
                        </div>
                        {response?.reason && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-2 line-clamp-2">
                            理由: {response.reason}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 sm:gap-2 shrink-0">
                        {getStatusBadge(status, deadlinePassed && status === "未回答")}
                        {!deadlinePassed && (
                          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* 最近の活動 */}
        {recentActivities.length > 0 && (
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                あなたの最近の回答
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, idx) => (
                  <div key={`${activity.eventId}-${idx}`} className="flex items-start gap-3">
                    <div className="mt-1">
                        {getStatusBadge(activity.status)}
                    </div>
                    <div className="flex-1 min-w-0 text-sm">
                      <p className="font-medium truncate">{activity.event?.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(activity.updatedAt), "M/d HH:mm")} に回答
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 全予定一覧 */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              予定一覧
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              予定をタップして出欠を回答してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3">
            {events.length === 0 ? (
              <div className="py-8 sm:py-12 text-center">
                <Calendar className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                <p className="text-xs sm:text-sm text-muted-foreground">予定がありません</p>
              </div>
            ) : (
              events.map((event) => {
                const response = getMyResponse(event.id);
                const status: ResponseStatus = response?.status || "未回答";
                const deadlinePassed = isDeadlinePassed(event);
                const isOverdue = deadlinePassed && !response;

                return (
                  <div
                    key={event.id}
                    className={`p-3 sm:p-4 rounded-lg border transition-all ${isOverdue
                      ? "border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/50"
                      : "bg-card hover:shadow-md"
                      } ${!deadlinePassed ? "cursor-pointer active:shadow-lg" : "opacity-60"}`}
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap gap-y-1">
                          <h3 className="font-semibold text-sm sm:text-base truncate">
                            {event.title}
                          </h3>
                          <Badge variant="outline" className="shrink-0 text-xs">
                            {event.type}
                          </Badge>
                          {isOverdue && (
                            <Badge className="bg-orange-500 text-white border-0 shrink-0 text-xs">
                              期限切れ
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1 text-xs sm:text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                            <span>
                              {format(new Date(event.dateTime), "M月d日(E) HH:mm", {
                                locale: ja,
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                            <span>
                              締切: {format(new Date(event.deadline), "M月d日 HH:mm")}
                              {deadlinePassed && " (終了)"}
                            </span>
                          </div>
                        </div>
                        {response?.reason && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-2 line-clamp-2">
                            理由: {response.reason}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 sm:gap-2 shrink-0">
                        {getStatusBadge(status, isOverdue)}
                        {!deadlinePassed && (
                          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* 回答ダイアログ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-lg p-4 sm:p-6 max-h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-lg sm:text-xl line-clamp-2">
              {selectedEvent?.title}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {selectedEvent &&
                format(new Date(selectedEvent.dateTime), "M月d日(E) HH:mm", {
                  locale: ja,
                })}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 py-4">
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-sm sm:text-base">出欠状況</Label>
              <RadioGroup value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as ResponseStatus)}>
                <div className="flex items-center space-x-2 p-2.5 sm:p-3 rounded-lg border hover:bg-accent cursor-pointer active:shadow-md transition-all">
                  <RadioGroupItem value="参加" id="participate" />
                  <Label htmlFor="participate" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="font-medium text-sm sm:text-base">参加</span>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-2.5 sm:p-3 rounded-lg border hover:bg-accent cursor-pointer active:shadow-md transition-all">
                  <RadioGroupItem value="遅れる" id="late" />
                  <Label htmlFor="late" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span className="font-medium text-sm sm:text-base">遅れる</span>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-2.5 sm:p-3 rounded-lg border hover:bg-accent cursor-pointer active:shadow-md transition-all">
                  <RadioGroupItem value="不参加" id="absent" />
                  <Label htmlFor="absent" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-rose-500" />
                      <span className="font-medium text-sm sm:text-base">不参加</span>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {(selectedStatus === "遅れる" || selectedStatus === "不参加") && (
              <div className="space-y-2 sm:space-y-3">
                <Label htmlFor="reason" className="text-sm sm:text-base">
                  理由 <span className="text-red-500">*</span>
                </Label>

                {/* プリセットボタン */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {REASON_PRESETS[selectedStatus].map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setReason(preset)}
                      className={`text-xs sm:text-sm h-8 sm:h-9 ${reason === preset ? "bg-primary text-primary-foreground" : ""}`}
                    >
                      {preset}
                    </Button>
                  ))}
                </div>

                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="理由を入力してください"
                  rows={3}
                  className="text-xs sm:text-sm"
                />
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0 pt-4 border-t flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="w-full sm:w-auto h-10 sm:h-9 text-sm"
              size="sm"
              disabled={saving}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleSaveResponse}
              className="w-full sm:w-auto h-10 sm:h-9 text-sm"
              size="sm"
              disabled={saving}
            >
              {saving ? "保存中..." : "回答を保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* お知らせ詳細ダイアログ */}
      <Dialog open={announcementDialogOpen} onOpenChange={setAnnouncementDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[85vh] p-4 sm:p-6 flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-lg sm:text-xl line-clamp-2">
              {selectedAnnouncement?.title}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {selectedAnnouncement && (
                format(new Date(selectedAnnouncement.createdAt), "M月d日 HH:mm", { locale: ja })
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedAnnouncement && (
            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              <div className="flex items-center gap-2">
                {getPriorityBadge(selectedAnnouncement.priority)}
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-wrap">
                  {selectedAnnouncement.content}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t flex-shrink-0">
            <Button
              onClick={() => setAnnouncementDialogOpen(false)}
              className="w-full sm:w-auto h-10 sm:h-9 text-sm"
              size="sm"
            >
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}