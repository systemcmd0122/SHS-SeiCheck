"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MEMBERS, type Event } from "@/lib/types";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { Calendar, Clock, LogOut, ChevronRight, Menu, X } from "lucide-react";
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
  const [nextEvent, setNextEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // PWA更新チェック
  usePWAUpdate();

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
      localStorage.setItem("selectedMember", JSON.stringify(member));
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
              onClick={() => router.push("/admin")}
              className="gap-2 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-semibold h-10"
            >
              <LogOut className="h-5 w-5" />
              <span>管理者</span>
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
        <SheetContent side="left" className="w-64">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-left text-lg font-bold text-slate-900 dark:text-white">
              メニュー
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => {
                router.push("/admin");
                setMobileMenuOpen(false);
              }}
              className="justify-start gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10"
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
            <div className="inline-flex items-center gap-2 mb-3 md:mb-4">
              <Calendar className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-400">次の予定</span>
            </div>
            <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-800 dark:to-slate-800/50">
              <CardContent className="p-4 md:p-6 lg:p-8">
                <div className="flex items-start justify-between gap-3 md:gap-4 mb-4 md:mb-6">
                  <div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-1 md:mb-2 line-clamp-2">
                      {nextEvent.name}
                    </h2>
                    <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
                      {nextEvent.type}
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 md:gap-4 sm:grid-cols-2">
                  <div className="flex gap-2 md:gap-3">
                    <Calendar className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-0.5">開催日時</p>
                      <p className="text-xs md:text-sm font-semibold text-slate-900 dark:text-white">
                        {formatDate(nextEvent.date)}
                      </p>
                    </div>
                  </div>
                  {nextEvent.deadline && (
                    <div className="flex gap-2 md:gap-3">
                      <Clock className="h-4 w-4 md:h-5 md:w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-0.5">回答期限</p>
                        <p className="text-xs md:text-sm font-semibold text-slate-900 dark:text-white">
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
        <div>
          <div className="mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
              出欠を回答
            </h2>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1">
              自分の名前をタップしてください
            </p>
          </div>
          <div className="grid gap-2 md:gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MEMBERS.map((member) => (
              <button
                key={member.id}
                onClick={() => {
                  setSelectedMember(member.id);
                  handleSelectMember(member.id);
                }}
                className="group relative p-3 md:p-4 text-left transition-all duration-200 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 active:scale-95"
              >
                <div className="flex items-start justify-between mb-2 md:mb-3">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white">{member.name.charAt(0)}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-all group-hover:translate-x-0.5" />
                </div>
                <div className="font-semibold text-slate-900 dark:text-white text-xs md:text-sm mb-0.5 md:mb-1 line-clamp-1">
                  {member.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                  {member.committee}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
