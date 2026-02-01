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
import { Input } from "@/components/ui/input";

const LAST_USER_KEY = "last_login_member_id";

interface MemberSelectionPageProps {
    title?: string;
    description?: string;
    buttonLabel?: string;
    showAdminButton?: boolean;
    events?: any[];
}

export function MemberSelectionPage({
    title = "生徒会出欠管理",
    description = "メンバー選択してログイン",
    buttonLabel = "ログイン",
    showAdminButton = true,
    events = [],
}: MemberSelectionPageProps) {
    const router = useRouter();
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lastMemberId, setLastMemberId] = useState<string | null>(null);
    const [showContinueDialog, setShowContinueDialog] = useState(false);

    useEffect(() => {
        // ページ読み込み後、前回のユーザーを確認
        const stored = localStorage.getItem(LAST_USER_KEY);
        if (stored && members.some((m) => m.id === stored)) {
            setLastMemberId(stored);
            setShowContinueDialog(true);
        }
        setIsLoading(false);
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
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-3 sm:p-4">
            {/* 前回ユーザー確認ダイアログ */}
            <Dialog open={showContinueDialog} onOpenChange={setShowContinueDialog}>
                <DialogContent className="w-[95vw] sm:max-w-md p-4 sm:p-6">
                    <DialogHeader className="space-y-2">
                        <DialogTitle className="text-lg sm:text-xl">前回のログイン情報</DialogTitle>
                        <DialogDescription className="text-sm sm:text-base">
                            前回このユーザーでログインしました
                        </DialogDescription>
                    </DialogHeader>
                    {lastMember && (
                        <div className="py-4">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 flex-shrink-0">
                                    <UserCircle className="w-6 h-6 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium text-sm sm:text-base truncate">{lastMember.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {lastMember.committee}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="flex flex-col gap-2 sm:flex-row justify-end pt-4 border-t">
                        <Button onClick={handleSelectNew} variant="outline" className="w-full sm:w-auto order-2 sm:order-1" size="sm">
                            別のユーザーを選択
                        </Button>
                        <Button onClick={handleContinueWithLast} className="w-full sm:w-auto order-1 sm:order-2" size="sm">
                            <LogIn className="w-4 h-4 mr-2" />
                            続ける
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {showAdminButton && (
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 flex items-center gap-2">
                    <Button
                        onClick={handleTeacherAccess}
                        variant="outline"
                        className="hidden sm:flex items-center gap-2"
                    >
                        <GraduationCap className="w-4 h-4" />
                        先生はこちら
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleTeacherAccess}
                        className="sm:hidden text-muted-foreground hover:text-foreground"
                        title="先生ログイン"
                    >
                        <GraduationCap className="w-5 h-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleAdminAccess}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <Settings className="w-5 h-5" />
                    </Button>
                    <ThemeToggle />
                </div>
            )}

            <div className="w-full max-w-md space-y-6">
                <div className="text-center mb-6 sm:mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                        <UserCircle className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">{title}</h1>
                    <p className="text-sm sm:text-base text-muted-foreground">{description}</p>
                </div>

                {/* 今日の予定表示 */}
                {events.length > 0 && (
                    <div className="w-full">
                        <TodayEventsList
                            events={events}
                        />
                    </div>
                )}

                <Card className="border-0 shadow-xl">
                    <CardHeader className="space-y-1 pb-3 sm:pb-4">
                        <CardTitle className="text-lg sm:text-xl">ようこそ</CardTitle>
                        <CardDescription className="text-sm">
                            あなたの名前を選択してください
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 px-4 sm:px-6">
                        <div className="space-y-2">
                            <Select onValueChange={handleSelect} value={selectedMemberId || ""}>
                                <SelectTrigger className="h-12 text-base">
                                    <SelectValue placeholder="名前を選択..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    {members.map((member) => (
                                        <SelectItem key={member.id} value={member.id}>
                                            <div className="flex flex-col items-start">
                                                <span className="font-medium">{member.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {member.committee}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            className="w-full h-12 sm:h-11 text-base"
                            onClick={handleStart}
                            disabled={!selectedMemberId}
                            size="lg"
                        >
                            <LogIn className="w-5 h-5 mr-2" />
                            {buttonLabel}
                        </Button>
                    </CardContent>
                </Card>

                <p className="text-center text-xs sm:text-sm text-muted-foreground">
                    生徒会専用システム
                </p>
            </div>
        </div>
    );
}
