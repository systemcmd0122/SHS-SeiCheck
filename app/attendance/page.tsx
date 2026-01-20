"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Event, Member, Response } from "@/lib/types";
import { REASON_TEMPLATES } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Calendar, User, Clock, CheckCircle2, XCircle, AlertCircle, Menu, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DarkModeToggle } from "@/components/dark-mode-toggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export default function AttendancePage() {
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [responses, setResponses] = useState<Record<string, Response>>({});
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const storedMember = localStorage.getItem("selectedMember");
    if (!storedMember) {
      router.push("/");
      return;
    }
    setMember(JSON.parse(storedMember));
  }, [router]);

  useEffect(() => {
    if (!member) return;

    const fetchData = async () => {
      try {
        const eventsSnapshot = await getDocs(
          query(collection(db, "events"), orderBy("date", "asc"))
        );
        const eventsData = eventsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Event[];
        setEvents(eventsData);

        const responsesSnapshot = await getDocs(
          query(collection(db, "responses"), where("memberId", "==", member.id))
        );
        const responsesData: Record<string, Response> = {};
        responsesSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          responsesData[data.eventId] = {
            id: doc.id,
            ...data,
            updatedAt: data.updatedAt?.toDate() || new Date(),
            history: data.history?.map((h: { changedAt: { toDate: () => Date } }) => ({
              ...h,
              changedAt: h.changedAt.toDate(),
            })) || [],
          } as Response;
        });
        setResponses(responsesData);
      } catch (error) {
        console.error("[v0] Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [member]);

  const isDeadlinePassed = (deadline?: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const handleResponseChange = async (
    eventId: string,
    status: "参加" | "遅れる" | "不参加",
    reason?: string
  ) => {
    if (!member) return;

    try {
      const responseId = `${member.id}_${eventId}`;
      const previousResponse = responses[eventId];

      const history = previousResponse?.history || [];
      if (previousResponse?.status !== status) {
        history.push({
          previousStatus: previousResponse?.status || null,
          newStatus: status,
          changedAt: new Date(),
        });
      }

      const responseData: Omit<Response, "id"> = {
        memberId: member.id,
        memberName: member.name,
        eventId,
        status,
        reason: reason || "",
        updatedAt: new Date(),
        history,
      };

      await setDoc(doc(db, "responses", responseId), responseData);

      setResponses((prev) => ({
        ...prev,
        [eventId]: { id: responseId, ...responseData },
      }));
    } catch (error) {
      console.error("[v0] Error saving response:", error);
    }
  };

  const handleReasonTemplateClick = (eventId: string, template: string) => {
    const response = responses[eventId];
    if (response?.status) {
      handleResponseChange(eventId, response.status, template);
    }
  };

  const getResponseStats = () => {
    const attended = Object.values(responses).filter((r) => r.status === "参加").length;
    const late = Object.values(responses).filter((r) => r.status === "遅れる").length;
    const absent = Object.values(responses).filter((r) => r.status === "不参加").length;
    const unanswered = events.length - Object.keys(responses).length;
    return { attended, late, absent, unanswered };
  };

  const stats = getResponseStats();

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
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900">
      {/* ナビゲーション */}
      <div className="border-b-2 border-slate-200 dark:border-slate-800 bg-gradient-to-r from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 flex-shrink-0 shadow-sm">
        <div className="mx-auto max-w-4xl px-4 md:px-6 lg:px-8 py-4 md:py-5 flex items-center justify-between gap-4">
          {/* モバイルハンバーガーメニュー */}
          <div className="md:hidden flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            {member && (
              <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 px-3 py-2 border border-blue-200 dark:border-blue-800 font-semibold text-blue-700 dark:text-blue-400 text-sm">
                <span className="text-base">{member.name.charAt(0)}</span>
                <span className="hidden sm:inline">{member.name}</span>
              </div>
            )}
          </div>

          {/* デスクトップナビゲーション */}
          <div className="hidden md:flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="gap-2 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-semibold h-10"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>戻る</span>
            </Button>
            {member && (
              <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 px-4 py-2 border border-blue-200 dark:border-blue-800 font-semibold text-blue-700 dark:text-blue-400">
                <span className="text-lg">{member.name.charAt(0)}</span>
                <span>{member.name}</span>
              </div>
            )}
          </div>

          <DarkModeToggle />
        </div>
      </div>

      {/* モバイルメニュー */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-left text-lg font-bold text-slate-900 dark:text-white">
              メニュー
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => {
                router.push("/");
                setMobileMenuOpen(false);
              }}
              className="justify-start gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>ホームに戻る</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-y-auto mx-auto max-w-4xl w-full px-4 md:px-6 lg:px-8 py-8 md:py-12">
        {/* ページタイトル */}
        <div className="mb-8 md:mb-10">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-2">
            出欠回答
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400">
            各日程の参加状況を選択してください
          </p>
        </div>

        {/* 回答状況ダッシュボード */}
        <Card className="mb-8 md:mb-10 overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 md:p-6">
            <CardTitle className="text-lg md:text-xl text-slate-900 dark:text-white">
              あなたの回答状況
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
              <div className="flex flex-col items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-green-50 dark:bg-green-900/20 p-3 md:p-4">
                <CheckCircle2 className="mb-2 md:mb-3 h-6 md:h-7 w-6 md:w-7 text-green-600 dark:text-green-400" />
                <div className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{stats.attended}</div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1 md:mt-2">参加</div>
              </div>
              <div className="flex flex-col items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-900/20 p-3 md:p-4">
                <Clock className="mb-2 md:mb-3 h-6 md:h-7 w-6 md:w-7 text-blue-600 dark:text-blue-400" />
                <div className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{stats.late}</div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1 md:mt-2">遅れる</div>
              </div>
              <div className="flex flex-col items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-red-50 dark:bg-red-900/20 p-3 md:p-4">
                <XCircle className="mb-2 md:mb-3 h-6 md:h-7 w-6 md:w-7 text-red-600 dark:text-red-400" />
                <div className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{stats.absent}</div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1 md:mt-2">不参加</div>
              </div>
              <div className="flex flex-col items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-amber-50 dark:bg-amber-900/20 p-3 md:p-4">
                <AlertCircle className="mb-2 md:mb-3 h-6 md:h-7 w-6 md:w-7 text-amber-600 dark:text-amber-400" />
                <div className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{stats.unanswered}</div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1 md:mt-2">未回答</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {events.length === 0 ? (
          <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <CardContent className="py-12 text-center">
              <Calendar className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="text-sm md:text-base font-medium text-slate-600 dark:text-slate-400">現在、登録されている日程はありません</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {events.map((event) => {
              const response = responses[event.id];
              const deadlinePassed = isDeadlinePassed(event.deadline);
              const isEditable = !deadlinePassed;

              return (
                <Card
                  key={event.id}
                  className={`overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-200 ${deadlinePassed && !response
                    ? 'opacity-60'
                    : 'hover:shadow-md'
                    }`}
                >
                  <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 md:p-6">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base md:text-lg text-slate-900 dark:text-white">{event.name}</CardTitle>
                        <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold">{event.type}</Badge>
                        {deadlinePassed && (
                          <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold">締切済み</Badge>
                        )}
                        {response && (
                          <Badge
                            className={`text-xs font-semibold ${response.status === "参加"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                              : response.status === "遅れる"
                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                                : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                              }`}
                          >
                            {response.status}
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600 dark:text-slate-400">
                          <Calendar className="h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                          <span className="font-medium">{event.date}</span>
                        </div>
                        {event.deadline && (
                          <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600 dark:text-slate-400">
                            <Clock className="h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                            <span className="font-medium">締切: {event.deadline}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
                    {deadlinePassed && !response && (
                      <div className="flex items-center gap-2 md:gap-3 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 md:p-4 text-xs md:text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                        <AlertCircle className="h-4 md:h-5 w-4 md:w-5 flex-shrink-0" />
                        <span className="font-medium">回答締切が過ぎています</span>
                      </div>
                    )}

                    <div className="space-y-4">
                      <p className="text-sm font-semibold text-foreground">ステータス選択</p>
                      <RadioGroup
                        value={response?.status || ""}
                        onValueChange={(value) =>
                          isEditable &&
                          handleResponseChange(
                            event.id,
                            value as "参加" | "遅れる" | "不参加",
                            response?.reason
                          )
                        }
                        disabled={!isEditable}
                      >
                        <div className="space-y-2 md:space-y-3">
                          <div className="flex items-center space-x-3 md:space-x-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 md:p-4 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-all duration-200">
                            <RadioGroupItem
                              value="参加"
                              id={`${event.id}-attend`}
                              disabled={!isEditable}
                            />
                            <Label
                              htmlFor={`${event.id}-attend`}
                              className={`flex-1 font-medium text-slate-900 dark:text-white text-sm md:text-base ${isEditable ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
                            >
                              参加
                            </Label>
                          </div>
                          <div className="flex items-center space-x-3 md:space-x-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 md:p-4 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-all duration-200">
                            <RadioGroupItem
                              value="遅れる"
                              id={`${event.id}-late`}
                              disabled={!isEditable}
                            />
                            <Label
                              htmlFor={`${event.id}-late`}
                              className={`flex-1 font-medium text-slate-900 dark:text-white text-sm md:text-base ${isEditable ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
                            >
                              遅れる
                            </Label>
                          </div>
                          <div className="flex items-center space-x-3 md:space-x-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 md:p-4 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-all duration-200">
                            <RadioGroupItem
                              value="不参加"
                              id={`${event.id}-absent`}
                              disabled={!isEditable}
                            />
                            <Label
                              htmlFor={`${event.id}-absent`}
                              className={`flex-1 font-medium text-slate-900 dark:text-white text-sm md:text-base ${isEditable ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
                            >
                              不参加
                            </Label>
                          </div>
                        </div>
                      </RadioGroup>

                      {response?.status && response.status !== "参加" && (
                        <>
                          <div className="space-y-2 border-t border-slate-200 dark:border-slate-700 pt-3 md:pt-4">
                            <Label htmlFor={`${event.id}-reason`} className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">
                              理由（任意）
                            </Label>
                            <div className="mb-2 md:mb-3 flex flex-wrap gap-1 md:gap-2">
                              {REASON_TEMPLATES.map((template) => (
                                <Button
                                  key={template}
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReasonTemplateClick(event.id, template)}
                                  disabled={!isEditable}
                                  className="text-xs md:text-sm h-8 md:h-9"
                                >
                                  {template}
                                </Button>
                              ))}
                            </div>
                            <Textarea
                              id={`${event.id}-reason`}
                              placeholder="理由を入力してください"
                              value={response.reason || ""}
                              onChange={(e) =>
                                isEditable &&
                                handleResponseChange(
                                  event.id,
                                  response.status!,
                                  e.target.value
                                )
                              }
                              disabled={!isEditable}
                              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm min-h-20"
                            />
                          </div>

                          <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 p-2 md:p-3 text-xs md:text-sm font-medium text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                            <CheckCircle2 className="h-4 md:h-5 w-4 md:w-5 flex-shrink-0" />
                            <span>
                              回答済み：<span className="font-bold">{response.status}</span>
                            </span>
                            {!isEditable && <span className="text-xs">（締切後のため編集不可）</span>}
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
        }
      </div>
    </div>
  );
}
