"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MEMBERS, type Event } from "@/lib/types";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { Calendar, Clock, LogOut, ChevronRight, Menu, X, Settings } from "lucide-react";
import { DarkModeToggle } from "@/components/dark-mode-toggle";
import { usePWAUpdate } from "@/hooks/use-pwa-update";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export default function MemberSelectionPage() {
  const router = useRouter();
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [confirmingMember, setConfirmingMember] = useState<{ id: string; name: string; committee: string } | null>(null);
  const [nextEvent, setNextEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // PWA更新チェック
  usePWAUpdate();

  // キャッシュされたメンバーをチェック
  useEffect(() => {
    const storedMember = localStorage.getItem("selectedMember");
    if (storedMember) {
      try {
        const member = JSON.parse(storedMember);
        setConfirmingMember({ id: member.id, name: member.name, committee: member.committee });
      } catch (error) {
        console.error("Failed to parse cached member:", error);
        localStorage.removeItem("selectedMember");
      }
    }
  }, []);

  useEffect(() => {
    const fetchNextEvent = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const eventsRef = collection(db, "events");
        const q = query(
          eventsRef,
          where("date", ">=", today),
          orderBy("date", "asc"),
          limit(1)
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          setNextEvent({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
          } as Event);
        }
      } catch (error) {
        console.error("[v0] Error fetching next event:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNextEvent();
  }, []);

  const handleSelectMember = (memberId: string) => {
    const member = MEMBERS.find((m) => m.id === memberId);
    if (member) {
      setConfirmingMember({ id: member.id, name: member.name, committee: member.committee });
    }
  };

  const handleConfirmMember = (memberId: string) => {
    const member = MEMBERS.find((m) => m.id === memberId);
    if (member) {
      localStorage.setItem("selectedMember", JSON.stringify(member));
      setConfirmingMember(null);
      router.push("/attendance");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    }).format(date);
  };

  return (
    <div className="flex flex-col min-h-screen" suppressHydrationWarning>
      {/* ナビゲーションバー */}
      <div className="border-b-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 backdrop-blur-sm flex-shrink-0 shadow-sm sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-4 md:py-5 flex items-center justify-between gap-4">
          {/* モバイルハンバーガーとロゴ */}
          <div className="md:hidden flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
              <span className="text-white font-bold text-base">S</span>
            </div>
          </div>

          {/* デスクトップロゴ */}
          <div className="hidden md:flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">SHS SeiCheck</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">生徒会出欠管理</p>
            </div>
          </div>

          {/* デスクトップナビゲーション */}
          <div className="hidden md:flex items-center gap-2 md:gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/settings")}
              className="gap-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold h-10"
            >
              <Settings className="h-5 w-5" />
              <span className="hidden lg:inline">設定</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                localStorage.removeItem("admin_authenticated");
                router.push("/admin");
              }}
              className="gap-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold h-10"
            >
              <LogOut className="h-5 w-5" />
              <span className="hidden lg:inline">管理者</span>
            </Button>
            <DarkModeToggle />
          </div>

          {/* モバイルダークモードトグル */}
          <div className="md:hidden">
            <DarkModeToggle />
          </div>
        </div>
      </div>

      {/* モバイルメニュー */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 bg-white dark:bg-slate-800">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-left text-lg font-bold text-slate-900 dark:text-white">
              メニュー
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => {
                router.push("/settings");
                setMobileMenuOpen(false);
              }}
              className="justify-start gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold"
            >
              <Settings className="h-5 w-5" />
              <span>設定</span>
            </Button>
            <Button
              onClick={() => {
                localStorage.removeItem("admin_authenticated");
                router.push("/admin");
                setMobileMenuOpen(false);
              }}
              className="justify-start gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold"
            >
              <LogOut className="h-5 w-5" />
              <span>管理者ページ</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-y-auto mx-auto max-w-4xl w-full px-4 md:px-6 lg:px-8 py-8 md:py-12">
        {/* 次の予定セクション */}
        {!loading && nextEvent && (
          <div className="mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 mb-3 md:mb-4 px-3 md:px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Calendar className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs md:text-sm font-bold text-blue-700 dark:text-blue-400">次の予定</span>
            </div>
            <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-800/60 dark:to-slate-800/40">
              <CardContent className="p-5 md:p-6 lg:p-8">
                <div className="flex items-start justify-between gap-3 md:gap-4 mb-4 md:mb-6">
                  <div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-1 md:mb-2 line-clamp-2">
                      {nextEvent.name}
                    </h2>
                    <p className="text-xs md:text-sm text-slate-600 dark:text-slate-500 font-medium">
                      {nextEvent.type}
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 md:gap-4 sm:grid-cols-2">
                  <div className="flex gap-2 md:gap-3 bg-white dark:bg-slate-900/30 rounded-lg p-3 md:p-4">
                    <Calendar className="h-5 w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-0.5">開催日時</p>
                      <p className="text-xs md:text-sm font-bold text-slate-900 dark:text-white">
                        {formatDate(nextEvent.date)}
                      </p>
                    </div>
                  </div>
                  {nextEvent.deadline && (
                    <div className="flex gap-2 md:gap-3 bg-white dark:bg-slate-900/30 rounded-lg p-3 md:p-4">
                      <Clock className="h-5 w-5 md:h-6 md:w-6 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-0.5">回答期限</p>
                        <p className="text-xs md:text-sm font-bold text-slate-900 dark:text-white">
                          {formatDate(nextEvent.deadline)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* メンバー選択セクション */}
        {!confirmingMember && (
          <div>
            <div className="mb-4 md:mb-6">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                出欠を回答
              </h2>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
                あなたの名前をタップして、出欠状況を入力してください
              </p>
            </div>
            <div className="grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MEMBERS.map((member) => (
                <button
                  key={member.id}
                  onClick={() => {
                    setSelectedMember(member.id);
                    handleSelectMember(member.id);
                  }}
                  className="group relative p-4 md:p-5 text-left transition-all duration-200 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <div className="flex items-start justify-between mb-3 md:mb-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                      <span className="text-sm md:text-base font-bold text-white">{member.name.charAt(0)}</span>
                    </div>
                    <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-all group-hover:translate-x-1" />
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white text-sm md:text-base mb-1">
                    {member.name}
                  </div>
                  <div className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mb-3">
                    {member.committee}
                  </div>
                  <div className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 md:px-3 py-1 md:py-1.5 rounded-md text-xs font-semibold">
                    <span>タップして回答</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* メンバー確認セクション */}
        {confirmingMember && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                出欠者確認
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                この情報でよろしいですか？
              </p>
            </div>
            <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg">
              <CardContent className="p-6 md:p-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                      <span className="text-4xl font-bold text-white">{confirmingMember.name.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        {confirmingMember.name}
                      </div>
                      <div className="text-base text-slate-600 dark:text-slate-400">
                        {confirmingMember.committee}
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-700 dark:text-blue-400 font-semibold">
                      この名前で出欠情報を入力します
                    </p>
                  </div>
                  <div className="space-y-3 pt-6">
                    <Button
                      onClick={() => confirmingMember && handleConfirmMember(confirmingMember.id)}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold h-12 text-base"
                    >
                      このメンバーで続行
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setConfirmingMember(null)}
                      className="w-full border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold h-12 text-base"
                    >
                      別のメンバーを選択
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
