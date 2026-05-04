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
  Activity,
  Bell,
  Megaphone,
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
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
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
    setSelectedEvent(event);

    // 出欠確認が不要な場合は詳細ダイアログを表示
    if (event.isAttendanceRequired === false) {
        setInfoDialogOpen(true);
        return;
    }

    if (isDeadlinePassed(event)) {
      setInfoDialogOpen(true);
      return;
    }

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

      await saveResponse(responseData);
      setDialogOpen(false);
      setSelectedEvent(null);
      setReason("");
      successToast("回答完了", "回答を保存しました");
    } catch (error) {
      console.error("回答保存エラー:", error);
      const errorMessage =
        error instanceof Error ? error.message : "回答の保存に失敗しました";
      errorToast("保存失敗", errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const isDeadlinePassed = (event: Event | null) => {
    if (!event || !event.deadline) return false;
    try {
      const date = new Date(event.deadline);
      return !isNaN(date.getTime()) && isPast(date);
    } catch (e) {
      return false;
    }
  };

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

  const getMyResponse = (eventId: string) => {
    return responses.find((r) => r.eventId === eventId && r.memberId === memberId);
  };

  const getStatusBadge = (status: ResponseStatus, isOverdue: boolean = false) => {
    if (isOverdue && status === "未回答") {
      return (
        <Badge variant="destructive" className="font-bold">
          期限切れ
        </Badge>
      );
    }

    const badges: Record<ResponseStatus, JSX.Element> = {
      参加: (
        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-0">
          参加
        </Badge>
      ),
      遅れる: (
        <Badge className="bg-amber-600 hover:bg-amber-700 text-white border-0">
          遅れる
        </Badge>
      ),
      不参加: (
        <Badge className="bg-rose-600 hover:bg-rose-700 text-white border-0">
          不参加
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

  const getPriorityBadge = (priority: Announcement["priority"]) => {
    const badges = {
      通常: <Badge variant="outline">通常</Badge>,
      重要: <Badge className="bg-amber-600 text-white border-0">重要</Badge>,
      緊急: <Badge variant="destructive">緊急</Badge>,
    };
    return badges[priority];
  };

  const getMyStats = () => {
    const myResponses = responses.filter((r) => r.memberId === memberId);
    const attendanceEvents = events.filter(e => e.isAttendanceRequired !== false);
    
    return {
      participated: myResponses.filter((r) => {
          const ev = attendanceEvents.find(e => e.id === r.eventId);
          return ev && r.status === "参加";
      }).length,
      late: myResponses.filter((r) => {
          const ev = attendanceEvents.find(e => e.id === r.eventId);
          return ev && r.status === "遅れる";
      }).length,
      absent: myResponses.filter((r) => {
          const ev = attendanceEvents.find(e => e.id === r.eventId);
          return ev && r.status === "不参加";
      }).length,
      unanswered: attendanceEvents.filter((e) => !getMyResponse(e.id)).length,
      overdueUnanswered: attendanceEvents.filter((e) => !getMyResponse(e.id) && isDeadlinePassed(e)).length,
    };
  };

  const handleLogout = () => {
    clearAllSession();
    router.push("/");
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!member) {
    return null;
  }

  const stats = getMyStats();

  // 未回答かつ期限内の予定
  const urgentEvents = events
    .filter((e) => e.isAttendanceRequired !== false && !getMyResponse(e.id) && !isDeadlinePassed(e))
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  // 最近の活動（最新5件の回答）
  const recentActivities = responses
    .filter((r) => r.memberId === memberId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)
    .map(r => ({
      ...r,
      event: events.find(e => e.id === r.eventId)
    }))
    .filter(a => a.event && a.event.isAttendanceRequired !== false);

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground shadow-sm">
              <User className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold truncate">{member.name}</h1>
              <p className="text-[10px] text-muted-foreground font-medium truncate uppercase">{member.committee}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout} className="rounded-lg">
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline font-bold">ログアウト</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4 space-y-6 max-w-4xl">
        {/* 緊急のアクションが必要な予定 */}
        {urgentEvents.length > 0 && (
          <Card className="border-2 border-amber-500 shadow-md">
            <CardHeader className="pb-2 bg-amber-50 dark:bg-amber-950/20">
              <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold">
                <AlertTriangle className="w-5 h-5" />
                回答が必要な予定
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {urgentEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted cursor-pointer transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm sm:text-base truncate">{event.title}</h4>
                    <p className="text-xs text-muted-foreground font-medium">
                      締切: <span className="text-amber-600 dark:text-amber-400 font-bold">{safeFormat(event.deadline, "M/d HH:mm")}</span>
                    </p>
                  </div>
                  <Button size="sm" className="ml-4 shrink-0 rounded-lg">
                    回答
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 統計カード */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase">参加</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex items-baseline gap-1">
              <div className="text-2xl font-bold">{stats.participated}</div>
              <span className="text-[10px] text-muted-foreground">件</span>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase">遅刻</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex items-baseline gap-1">
              <div className="text-2xl font-bold">{stats.late}</div>
              <span className="text-[10px] text-muted-foreground">件</span>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase">欠席</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex items-baseline gap-1">
              <div className="text-2xl font-bold">{stats.absent}</div>
              <span className="text-[10px] text-muted-foreground">件</span>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase">未回答</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-baseline gap-1">
                <div className="text-2xl font-bold">{stats.unanswered}</div>
                <span className="text-[10px] text-muted-foreground">件</span>
              </div>
              {stats.overdueUnanswered > 0 && (
                <p className="text-[10px] font-bold text-destructive uppercase mt-1">
                  {stats.overdueUnanswered} 件期限切れ
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* お知らせセクション */}
        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b bg-muted/30">
            <CardTitle className="text-base flex items-center gap-2 font-bold">
              <Bell className="w-5 h-5 text-primary" />
              お知らせ
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {announcements.length > 0 ? (
              <div className="divide-y">
                {announcements.slice(0, 3).map((announcement) => (
                  <div
                    key={announcement.id}
                    onClick={() => {
                      setSelectedAnnouncement(announcement);
                      setAnnouncementDialogOpen(true);
                    }}
                    className="p-4 hover:bg-muted/50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h3 className="font-bold text-sm sm:text-base truncate group-hover:text-primary transition-colors">
                        {announcement.title}
                      </h3>
                      <div className="shrink-0">{getPriorityBadge(announcement.priority)}</div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {announcement.content}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-2 font-medium">
                      {safeFormat(announcement.createdAt, "yyyy.MM.dd")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Megaphone className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-xs font-bold text-muted-foreground/60 uppercase">現在お知らせはありません</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* カレンダー */}
        <div className="rounded-lg border shadow-sm overflow-hidden">
          <EventCalendar
            events={events}
            onEventClick={handleEventClick}
            highlightDates={events
              .filter(e => !getMyResponse(e.id) && e.dateTime)
              .map(e => {
                  const d = new Date(e.dateTime);
                  return !isNaN(d.getTime()) ? format(d, "yyyy-MM-dd") : "";
              })
              .filter(Boolean)
            }
            includeGoogleCalendar={true}
            googleCalendarId={process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID}
          />
        </div>

        {/* 全予定一覧 */}
        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b bg-muted/30">
            <CardTitle className="text-base flex items-center gap-2 font-bold">
              <Calendar className="w-5 h-5 text-primary" />
              出欠確認一覧
            </CardTitle>
            <CardDescription className="text-xs">
              予定をタップして出欠を回答してください
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {events.filter(e => e.isAttendanceRequired !== false).length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                  <p className="text-sm">予定はありません</p>
              </div>
            ) : (
              <div className="divide-y">
                {events.filter(e => e.isAttendanceRequired !== false).map((event) => {
                  const response = getMyResponse(event.id);
                  const status: ResponseStatus = response?.status || "未回答";
                  const deadlinePassed = isDeadlinePassed(event);
                  const isOverdue = deadlinePassed && !response;

                  return (
                    <div
                      key={event.id}
                      className={`p-4 hover:bg-muted cursor-pointer transition-colors ${!deadlinePassed ? "" : "opacity-70"}`}
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-sm sm:text-base truncate group-hover:text-primary">
                              {event.title}
                            </h3>
                            <Badge variant="outline" className="text-[10px] h-5">
                              {event.type}
                            </Badge>
                            {isOverdue && (
                              <Badge variant="destructive" className="text-[10px] h-5 font-bold">
                                期限切れ
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{safeFormat(event.dateTime, "M/d HH:mm")}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>締切: {safeFormat(event.deadline, "M/d HH:mm")}</span>
                            </div>
                          </div>
                          {response?.reason && (
                            <p className="text-[11px] text-muted-foreground italic border-l-2 pl-2">
                              理由: {response.reason}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 self-center">
                          {getStatusBadge(status, isOverdue)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 回答ダイアログ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-lg p-6 rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {selectedEvent?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedEvent && safeFormat(selectedEvent.dateTime, "M月d日(E) HH:mm")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="font-bold">出欠状況</Label>
              <RadioGroup value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as ResponseStatus)}>
                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted cursor-pointer transition-colors">
                  <RadioGroupItem value="参加" id="participate" />
                  <Label htmlFor="participate" className="flex-1 cursor-pointer flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>参加</span>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted cursor-pointer transition-colors">
                  <RadioGroupItem value="遅れる" id="late" />
                  <Label htmlFor="late" className="flex-1 cursor-pointer flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>遅れる</span>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted cursor-pointer transition-colors">
                  <RadioGroupItem value="不参加" id="absent" />
                  <Label htmlFor="absent" className="flex-1 cursor-pointer flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-500" />
                    <span>不参加</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {(selectedStatus === "遅れる" || selectedStatus === "不参加") && (
              <div className="space-y-3">
                <Label htmlFor="reason" className="font-bold">
                  理由 <span className="text-destructive">*</span>
                </Label>

                <div className="flex flex-wrap gap-2">
                  {REASON_PRESETS[selectedStatus].map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setReason(preset)}
                      className={`text-xs h-8 ${reason === preset ? "bg-primary text-primary-foreground" : ""}`}
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
                  className="text-sm"
                />
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="w-full sm:w-auto"
              disabled={saving}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleSaveResponse}
              className="w-full sm:w-auto"
              disabled={saving}
            >
              {saving ? "保存中..." : "回答を保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 予定詳細ダイアログ */}
      <Dialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-lg p-6 rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {selectedEvent?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedEvent && safeFormat(selectedEvent.dateTime, "M月d日(E) HH:mm")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{selectedEvent?.type}</Badge>
                {selectedEvent?.isAttendanceRequired === false && (
                    <Badge variant="secondary">出欠確認不要</Badge>
                )}
                {selectedEvent && isDeadlinePassed(selectedEvent) && (
                    <Badge variant="destructive">期限終了</Badge>
                )}
            </div>
            
            {selectedEvent?.description && (
                <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedEvent.description}
                    </p>
                </div>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={() => setInfoDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* お知らせ詳細ダイアログ */}
      <Dialog open={announcementDialogOpen} onOpenChange={setAnnouncementDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-2xl p-6 rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {selectedAnnouncement?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedAnnouncement && safeFormat(selectedAnnouncement.createdAt, "M月d日 HH:mm")}
            </DialogDescription>
          </DialogHeader>

          {selectedAnnouncement && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                {getPriorityBadge(selectedAnnouncement.priority)}
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedAnnouncement.content}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setAnnouncementDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}