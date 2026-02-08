"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoadingScreen } from "@/components/Loading";
import { TodayEventsList } from "@/components/TodayEventsList";
import { members } from "@/lib/members";
import { UserCircle, LogIn, Settings, GraduationCap } from "lucide-react";

const LAST_USER_KEY = "last_login_member_id";

interface Event {
    id: string;
    title: string;
    type: string;
    dateTime?: string;
    startTime?: string;
    [key: string]: unknown;
}

interface MemberSelectionPageProps {
    title?: string;
    description?: string;
    buttonLabel?: string;
    showAdminButton?: boolean;
    events?: Event[];
    isEventsLoading?: boolean;
}

export function MemberSelectionPage({
    title = "生徒会出欠管理",
    description = "メンバー選択してログイン",
    buttonLabel = "ログイン",
    showAdminButton = true,
    events = [],
    isEventsLoading = false,
}: MemberSelectionPageProps) {
    const router = useRouter();
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lastMemberId, setLastMemberId] = useState<string | null>(null);
    const [showContinueDialog, setShowContinueDialog] = useState(false);

    useEffect(() => {
        // ページ読み込み後、前回のユーザーを確認
        const init = () => {
            const stored = localStorage.getItem(LAST_USER_KEY);
            if (stored && members.some((m) => m.id === stored)) {
                setLastMemberId(stored);
                setShowContinueDialog(true);
            }
            setIsLoading(false);
        };

        // 微小な遅延を入れることで同期的更新の警告を回避しつつ、初期ロードのチラつきを抑える
        const timer = setTimeout(init, 0);
        return () => clearTimeout(timer);
    }, []);

    const handleSelect = (id: string) => {
        setSelectedMemberId(id);
    };

    const handleStart = () => {
        if (selectedMemberId) {
            localStorage.setItem(LAST_USER_KEY, selectedMemberId);
            router.push(`/member/${selectedMemberId}`);
        }
    };

    const handleContinueWithLast = () => {
        if (lastMemberId) {
            setSelectedMemberId(lastMemberId);
            localStorage.setItem(LAST_USER_KEY, lastMemberId);
            setShowContinueDialog(false);
            router.push(`/member/${lastMemberId}`);
        }
    };

    const handleSelectNew = () => {
        setShowContinueDialog(false);
        setLastMemberId(null);
    };

    const handleTeacherAccess = () => {
        sessionStorage.setItem(
            "teacherInfo",
            JSON.stringify({
                id: `teacher_${Date.now()}`,
                name: "先生",
                department: "生徒会顧問",
            })
        );
        router.push("/teacher");
    };

    const handleAdminAccess = () => {
        router.push("/admin");
    };

    if (isLoading) {
        return <LoadingScreen />;
    }

    const lastMember = lastMemberId ? members.find((m) => m.id === lastMemberId) : null;

    return (
        <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-6 sm:p-8">
            {/* 前回ユーザー確認ダイアログ */}
            <Dialog open={showContinueDialog} onOpenChange={setShowContinueDialog}>
                <DialogContent className="w-[92vw] sm:max-w-md p-8 rounded-[2.5rem] border-none shadow-premium">
                    <DialogHeader className="space-y-3">
                        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                            <UserCircle className="w-8 h-8 text-primary" />
                        </div>
                        <DialogTitle className="text-xl sm:text-2xl text-center font-bold">おかえりなさい！</DialogTitle>
                        <DialogDescription className="text-center text-balance">
                            前回使用したアカウントでログインを継続しますか？
                        </DialogDescription>
                    </DialogHeader>
                    {lastMember && (
                        <div className="py-6">
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-primary/10 shadow-inner">
                                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-md flex-shrink-0 font-bold text-lg">
                                    {lastMember.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-lg truncate">{lastMember.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {lastMember.committee}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="flex flex-col gap-3 sm:flex-row pt-2">
                        <Button 
                            onClick={handleSelectNew} 
                            variant="ghost" 
                            className="w-full sm:flex-1 order-2 sm:order-1 text-muted-foreground hover:text-foreground"
                        >
                            別のユーザーを選択
                        </Button>
                        <Button 
                            onClick={handleContinueWithLast} 
                            className="w-full sm:flex-1 order-1 sm:order-2 shadow-lg shadow-primary/20 h-11"
                        >
                            <LogIn className="w-4 h-4 mr-2" />
                            続ける
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {showAdminButton && (
                <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-background/50 backdrop-blur-md p-1.5 rounded-full border border-white/20 shadow-sm">
                    <Button
                        onClick={handleTeacherAccess}
                        variant="ghost"
                        size="sm"
                        className="hidden sm:flex items-center gap-2 rounded-full h-8 px-3 text-muted-foreground hover:text-foreground"
                    >
                        <GraduationCap className="w-4 h-4" />
                        先生
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleTeacherAccess}
                        className="sm:hidden text-muted-foreground hover:text-foreground w-8 h-8 rounded-full"
                        title="先生ログイン"
                    >
                        <GraduationCap className="w-5 h-5" />
                    </Button>
                    <div className="w-px h-4 bg-border/50 mx-1 hidden sm:block" />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleAdminAccess}
                        className="text-muted-foreground hover:text-foreground w-8 h-8 rounded-full"
                        title="設定"
                    >
                        <Settings className="w-5 h-5" />
                    </Button>
                    <ThemeToggle />
                </div>
            )}

            <div className="w-full max-w-md space-y-8 animate-fade-in">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary shadow-xl shadow-primary/20 mb-2 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                        <UserCircle className="w-12 h-12 text-primary-foreground" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                            {title}
                        </h1>
                        <p className="text-base text-muted-foreground font-medium">{description}</p>
                    </div>
                </div>

                {/* 今日の予定表示 */}
                {(isEventsLoading || events.length > 0) && (
                    <div className="w-full animate-fade-in [animation-delay:200ms]">
                        <TodayEventsList
                            events={events}
                            isLoading={isEventsLoading}
                        />
                    </div>
                )}

                {/* クイックアクセス（前回ログイン時） */}
                {lastMember && (
                    <Card className="border-none shadow-xl bg-primary/5 dark:bg-primary/10 overflow-hidden group hover:shadow-2xl transition-all duration-500 animate-fade-in [animation-delay:400ms] rounded-[2rem]">
                        <CardHeader className="pb-2 px-8 pt-8">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary/70 flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-primary" />
                                おかえりなさい
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-8 px-8">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-lg flex-shrink-0 font-bold text-xl group-hover:scale-105 transition-transform">
                                        {lastMember.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-black text-xl truncate">{lastMember.name}</p>
                                        <p className="text-sm text-muted-foreground font-medium truncate">{lastMember.committee}</p>
                                    </div>
                                </div>
                                <Button 
                                    onClick={handleContinueWithLast} 
                                    size="lg" 
                                    className="w-full sm:w-auto shrink-0 rounded-2xl px-8 shadow-xl shadow-primary/20 group-hover:scale-105 transition-all"
                                >
                                    入室する
                                    <LogIn className="w-5 h-5 ml-2" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card className="border-none shadow-2xl bg-card/60 backdrop-blur-2xl animate-fade-in [animation-delay:600ms] rounded-[2.5rem]">
                    <CardHeader className="space-y-1 pb-6 px-8 pt-8">
                        <CardTitle className="text-2xl font-black tracking-tight">新規ログイン</CardTitle>
                        <CardDescription className="text-base font-medium opacity-70">
                            あなたの名前を選択してください
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8 px-8 pb-10">
                        <div className="space-y-4">
                            <Select onValueChange={handleSelect} value={selectedMemberId || ""}>
                                <SelectTrigger className="h-16 text-lg rounded-2xl border-border bg-background/50 focus:ring-primary/20 transition-all px-6">
                                    <SelectValue placeholder="名前を選択..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px] rounded-xl border-none shadow-2xl">
                                    {members.map((member) => (
                                        <SelectItem key={member.id} value={member.id} className="rounded-lg m-1 py-3 focus:bg-primary/10">
                                            <div className="flex flex-col items-start gap-0.5">
                                                <span className="font-bold text-base">{member.name}</span>
                                                <span className="text-xs text-muted-foreground font-medium">
                                                    {member.committee}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            className="w-full h-16 text-xl font-black rounded-2xl shadow-2xl shadow-primary/20 active-scale"
                            onClick={handleStart}
                            disabled={!selectedMemberId}
                        >
                            <LogIn className="w-5 h-5 mr-2" />
                            {buttonLabel}
                        </Button>
                    </CardContent>
                </Card>

                <div className="flex flex-col items-center gap-4 text-muted-foreground animate-fade-in [animation-delay:800ms]">
                    <div className="w-8 h-1 rounded-full bg-muted/30" />
                    <p className="text-xs sm:text-sm font-bold tracking-widest uppercase opacity-50">
                        Student Council Management System
                    </p>
                </div>
            </div>
        </div>
    );
}
