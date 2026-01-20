"use client";

import React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  addDoc,
} from "firebase/firestore";
import { db, getEventsRealtime, getResponsesRealtime, deleteEventAndResponses } from "@/lib/firebase";
import { Event, Response, MEMBERS, EventType } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Calendar, Users, Download, Filter, Clock, Menu, X, Trash2 } from "lucide-react";
import { DarkModeToggle } from "@/components/dark-mode-toggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


export default function AdminPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEventName, setNewEventName] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventType, setNewEventType] = useState<EventType>("定例会");
  const [newEventDeadline, setNewEventDeadline] = useState("");
  const [adding, setAdding] = useState(false);
  const [showOnlyUnanswered, setShowOnlyUnanswered] = useState(false);
  const [filterEventType, setFilterEventType] = useState<EventType | "all">("all");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<{
    memberId: string;
    memberName: string;
    eventId: string;
    eventName: string;
    eventDate: string;
  } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);


  useEffect(() => {
    setLoading(true);
    const unsubscribeEvents = getEventsRealtime((events) => {
      // 日付の降順でソート
      const sortedEvents = events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEvents(sortedEvents);
      setLoading(false);
    });

    const unsubscribeResponses = getResponsesRealtime((responses) => {
      setResponses(responses);
    });

    // クリーンアップ関数
    return () => {
      unsubscribeEvents();
      unsubscribeResponses();
    };
  }, []);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName || !newEventDate) return;

    setAdding(true);
    try {
      const eventData: any = {
        name: newEventName,
        date: newEventDate,
        type: newEventType,
        createdAt: new Date(),
      };

      if (newEventDeadline) {
        eventData.deadline = newEventDeadline;
      }

      await addDoc(collection(db, "events"), eventData);

      setNewEventName("");
      setNewEventDate("");
      setNewEventType("定例会");
      setNewEventDeadline("");
      // fetchDataは不要
    } catch (error) {
      console.error("[v0] Error adding event:", error);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;
    try {
      await deleteEventAndResponses(eventToDelete.id);
    } catch (error) {
      console.error("Failed to delete event and responses:", error);
    } finally {
      setEventToDelete(null);
    }
  };

  const getResponseForMemberAndEvent = (
    memberId: string,
    eventId: string
  ): Response | undefined => {
    return responses.find(
      (r) => r.memberId === memberId && r.eventId === eventId
    );
  };

  const isDeadlinePassed = (deadline?: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const getUnansweredMembers = (eventId: string) => {
    return MEMBERS.filter(
      (member) => !getResponseForMemberAndEvent(member.id, eventId)
    );
  };

  const getDeadlineStats = (eventId: string, deadline?: string) => {
    if (!deadline) return null;
    const unansweredCount = getUnansweredMembers(eventId).length;
    const isPassed = isDeadlinePassed(deadline);
    return { unansweredCount, isPassed };
  };

  const exportToCSV = () => {
    if (events.length === 0) return;

    const headers = ["メンバー", "委員会", ...events.map((e) => `${e.name} (${e.date})`)];
    const rows = MEMBERS.map((member) => [
      member.name,
      member.committee,
      ...events.map((event) => {
        const response = getResponseForMemberAndEvent(member.id, event.id);
        if (!response) return "未回答";
        return `${response.status}${response.reason ? ` (${response.reason})` : ""}`;
      }),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `出欠表_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredEvents = filterEventType === "all"
    ? events
    : events.filter((e) => e.type === filterEventType);

  const displayedMembers = showOnlyUnanswered && selectedEventId
    ? getUnansweredMembers(selectedEventId)
    : MEMBERS;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-900">
        <div className="text-center">
          <div className="inline-block mb-4">
            <div className="animate-spin w-12 h-12 border-4 border-slate-300 dark:border-slate-700 border-t-blue-500 rounded-full"></div>
          </div>
          <div className="text-lg font-semibold text-slate-600 dark:text-slate-400">読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen" suppressHydrationWarning>
      {/* ナビゲーションバー */}
      <div className="border-b-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 backdrop-blur-sm flex-shrink-0 shadow-sm sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-4 md:py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              variant="ghost"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 h-auto"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
            <h1 className="hidden sm:block text-xl md:text-2xl font-bold text-slate-900 dark:text-white">管理者ページ</h1>
          </div>
          <div className="hidden md:flex items-center gap-2 md:gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="gap-2 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-semibold h-10"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>ホームに戻る</span>
            </Button>
            <Button
              variant="outline"
              onClick={exportToCSV}
              className="gap-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold h-10"
            >
              <Download className="h-5 w-5" />
              <span>CSV</span>
            </Button>
            <DarkModeToggle />
          </div>
          <div className="md:hidden flex items-center gap-2">
            <DarkModeToggle />
          </div>
        </div>
      </div>

      {/* モバイルハンバーガーメニュー */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64">
          <SheetHeader>
            <SheetTitle className="text-slate-900 dark:text-white">メニュー</SheetTitle>
          </SheetHeader>
          <div className="space-y-2 mt-4">
            <Button
              onClick={() => {
                router.push("/");
                setMobileMenuOpen(false);
              }}
              className="w-full justify-start gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 font-semibold"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>ホームに戻る</span>
            </Button>
            <Button
              onClick={() => {
                exportToCSV();
                setMobileMenuOpen(false);
              }}
              className="w-full justify-start gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold"
            >
              <Download className="h-5 w-5" />
              <span>CSV出力</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-y-auto mx-auto max-w-6xl w-full px-4 md:px-6 lg:px-8 py-12">
        {/* ページタイトル */}
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
            管理者ページ
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            日程管理と出欠状況の確認
          </p>
        </div>

        {/* 新しい日程を追加 */}
        <Card className="overflow-hidden shadow-sm mb-10">
          <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-6">
            <CardTitle className="flex items-center gap-2 text-xl text-slate-900 dark:text-white">
              <Plus className="h-5 w-5" />
              新しい日程を追加
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <form onSubmit={handleAddEvent} className="space-y-4 md:space-y-6">
              <div className="grid gap-4 md:gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="eventName" className="text-sm font-semibold text-slate-900 dark:text-white">日程名</Label>
                  <Input
                    id="eventName"
                    placeholder="例：第1回定例会議"
                    value={newEventName}
                    onChange={(e) => setNewEventName(e.target.value)}
                    required
                    className="border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventDate" className="text-sm font-semibold text-slate-900 dark:text-white">日付</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    required
                    className="border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventType" className="text-sm font-semibold text-slate-900 dark:text-white">イベント種別</Label>
                  <Select
                    value={newEventType}
                    onValueChange={(value) => setNewEventType(value as EventType)}
                  >
                    <SelectTrigger id="eventType" className="border border-slate-200 dark:border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="定例会">定例会</SelectItem>
                      <SelectItem value="行事準備">行事準備</SelectItem>
                      <SelectItem value="本番">本番</SelectItem>
                      <SelectItem value="臨時集会">臨時集会</SelectItem>
                      <SelectItem value="その他">その他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventDeadline" className="text-sm font-semibold text-slate-900 dark:text-white">回答締切（任意）</Label>
                  <Input
                    id="eventDeadline"
                    type="datetime-local"
                    value={newEventDeadline}
                    onChange={(e) => setNewEventDeadline(e.target.value)}
                    className="border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={adding}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold h-10"
              >
                {adding ? "追加中..." : "日程を追加"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 登録済み日程一覧 */}
        <div className="mt-8 md:mt-10">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-3 md:mb-4">登録済み日程</h2>
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <Calendar className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="text-slate-600 dark:text-slate-400">
                {filterEventType === "all"
                  ? "まだ日程が登録されていません"
                  : `${filterEventType}の日程がありません`}
              </p>
            </div>
          ) : (
            <div className="space-y-3 mb-8">
              {filteredEvents.map((event) => {
                const deadlineStats = getDeadlineStats(event.id, event.deadline);
                const unansweredMembers = getUnansweredMembers(event.id);

                return (
                  <div
                    key={event.id}
                    className="border border-border rounded-lg p-4 bg-card hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-slate-900 dark:text-white">{event.name}</h3>
                          <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium text-xs">
                            {event.type}
                          </Badge>
                          {deadlineStats?.isPassed && deadlineStats.unansweredCount > 0 && (
                            <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium">
                              締切超過：{deadlineStats.unansweredCount}人
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                          <div>{event.date}</div>
                          {event.deadline && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              締切：{event.deadline}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right text-sm text-slate-600 dark:text-slate-400">
                          未回答：<span className="font-semibold text-slate-900 dark:text-white">{unansweredMembers.length}</span>人
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEventToDelete(event)}
                          className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          削除
                        </Button>
                      </div>
                    </div>
                    {unansweredMembers.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">未回答者：</div>
                        <div className="flex flex-wrap gap-1">
                          {unansweredMembers.map((member) => (
                            <Badge key={member.id} className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs">
                              {member.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* フィルター */}
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <Select
            value={filterEventType}
            onValueChange={(value) => setFilterEventType(value as EventType | "all")}
          >
            <SelectTrigger className="w-[150px] border border-slate-200 dark:border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="定例会">定例会</SelectItem>
              <SelectItem value="行事準備">行事準備</SelectItem>
              <SelectItem value="本番">本番</SelectItem>
              <SelectItem value="臨時集会">臨時集会</SelectItem>
              <SelectItem value="その他">その他</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 出欠状況一覧 */}
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-3 md:mb-4">出欠状況一覧</h2>

        {events.length === 0 ? (
          <div className="py-8 text-center text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            日程が登録されていないため、出欠状況を表示できません
          </div>
        ) : displayedMembers.length === 0 ? (
          <div className="py-8 text-center text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            すべてのメンバーが回答済みです
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
            <Table className="text-sm md:text-base">
              <TableHeader>
                <TableRow className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <TableHead className="w-[120px] md:w-[180px] font-semibold text-slate-900 dark:text-white text-xs md:text-sm">メンバー</TableHead>
                  {events.map((event) => (
                    <TableHead key={event.id} className="text-center font-semibold text-slate-900 dark:text-white text-xs md:text-sm whitespace-nowrap px-2">
                      <div className="mb-0.5 md:mb-1">{event.name}</div>
                      <div className="text-xs font-normal text-slate-600 dark:text-slate-400">{event.type}</div>
                      <div className="text-xs font-normal text-slate-600 dark:text-slate-400 hidden md:block">{event.date}</div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedMembers.map((member) => (
                  <TableRow key={member.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <TableCell className="font-medium text-slate-900 dark:text-white text-xs md:text-sm">
                      <div className="line-clamp-1">{member.name}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 hidden md:block">{member.committee}</div>
                    </TableCell>
                    {events.map((event) => {
                      const response = getResponseForMemberAndEvent(member.id, event.id);
                      return (
                        <TableCell
                          key={event.id}
                          className="text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors px-1 md:px-3"
                          onClick={() => setSelectedDetail({ memberId: member.id, memberName: member.name, eventId: event.id, eventName: event.name, eventDate: event.date })}
                        >
                          {response ? (
                            <div className="flex flex-col items-center gap-0.5 md:gap-1">
                              <span
                                className={`inline-flex items-center rounded-full px-1.5 md:px-2 py-0.5 md:py-1 text-xs font-semibold whitespace-nowrap ${response.status === "参加"
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                  : response.status === "遅れる"
                                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                                    : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                  }`}
                              >
                                {response.status}
                              </span>
                              {response.reason && (
                                <span className="max-w-[80px] md:max-w-[120px] truncate text-xs text-slate-600 dark:text-slate-400 hidden md:inline" title={response.reason}>
                                  {response.reason}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-slate-200 dark:bg-slate-700 px-1.5 md:px-2 py-0.5 md:py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              未回答
                            </span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* 詳細ダイアログ */}
      {selectedDetail && (
        <Dialog open={!!selectedDetail} onOpenChange={() => setSelectedDetail(null)}>
          <DialogContent className="w-[95vw] md:max-w-md max-h-[90vh] overflow-y-auto rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-white">
                出欠詳細
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 md:space-y-4">
              <div>
                <div className="text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">メンバー</div>
                <div className="text-sm md:text-base font-medium text-slate-900 dark:text-white">
                  {selectedDetail.memberName}
                </div>
              </div>
              <div>
                <div className="text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">日程</div>
                <div className="text-sm md:text-base font-medium text-slate-900 dark:text-white">
                  {selectedDetail.eventName}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">{selectedDetail.eventDate}</div>
              </div>
              {(() => {
                const response = getResponseForMemberAndEvent(selectedDetail.memberId, selectedDetail.eventId);
                if (!response) {
                  return (
                    <div>
                      <div className="text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">出欠状況</div>
                      <div className="inline-flex items-center rounded-full bg-slate-200 dark:bg-slate-700 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                        未回答
                      </div>
                    </div>
                  );
                }
                return (
                  <>
                    <div>
                      <div className="text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">出欠状況</div>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${response.status === "参加"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : response.status === "遅れる"
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                          }`}
                      >
                        {response.status}
                      </span>
                    </div>
                    {response.reason && (
                      <div>
                        <div className="text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">理由</div>
                        <div className="text-xs md:text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2 md:p-3 rounded border border-slate-200 dark:border-slate-700">
                          {response.reason}
                        </div>
                      </div>
                    )}
                    {response.updatedAt && (
                      <div>
                        <div className="text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">回答日時</div>
                        <div className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
                          {new Date(response.updatedAt).toLocaleString("ja-JP")}
                        </div>
                      </div>
                    )}
                    {response.history && response.history.length > 0 && (
                      <div>
                        <div className="text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">変更履歴</div>
                        <div className="space-y-1 md:space-y-2">
                          {response.history.map((entry: any, idx: number) => (
                            <div key={idx} className="text-xs bg-slate-50 dark:bg-slate-800/50 p-1.5 md:p-2 rounded border border-slate-200 dark:border-slate-700">
                              <div className="font-semibold text-slate-900 dark:text-white text-xs">{entry.status}</div>
                              <div className="text-slate-600 dark:text-slate-400 text-xs">
                                {new Date(entry.changedAt).toLocaleString("ja-JP")}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 削除確認ダイアログ */}
      <AlertDialog open={!!eventToDelete} onOpenChange={() => setEventToDelete(null)}>
        <AlertDialogContent className="bg-white dark:bg-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle>本当にこの日程を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{eventToDelete?.name}」を削除すると、関連するすべての出欠情報も失われます。この操作は元に戻せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent}>削除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
