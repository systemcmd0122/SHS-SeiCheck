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
import { UserCircle, LogIn, Settings } from "lucide-react";

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

    const handleAdminAccess = () => {
        router.push("/admin");
    };

    if (isLoading) {
        return <LoadingScreen />;
    }

    const lastMember = lastMemberId ? members.find((m) => m.id === lastMemberId) : null;

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
            {/* 前回ユーザー確認ダイアログ */}
            <Dialog open={showContinueDialog} onOpenChange={setShowContinueDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>前回のログイン情報</DialogTitle>
                        <DialogDescription>
                            前回このユーザーでログインしました
                        </DialogDescription>
                    </DialogHeader>
                    {lastMember && (
                        <div className="py-4">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                                    <UserCircle className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium">{lastMember.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {lastMember.committee}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="flex gap-2 flex-row-reverse">
                        <Button onClick={handleContinueWithLast}>
                            <LogIn className="w-4 h-4 mr-2" />
                            続ける
                        </Button>
                        <Button variant="outline" onClick={handleSelectNew}>
                            別のユーザーを選択
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {showAdminButton && (
                <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
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
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                        <UserCircle className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">{title}</h1>
                    <p className="text-muted-foreground">{description}</p>
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
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-xl">ようこそ</CardTitle>
                        <CardDescription>
                            あなたの名前を選択してください
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Select onValueChange={handleSelect} value={selectedMemberId || ""}>
                                <SelectTrigger className="h-12">
                                    <SelectValue placeholder="名前を選択..." />
                                </SelectTrigger>
                                <SelectContent>
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
                            className="w-full h-12 text-base"
                            onClick={handleStart}
                            disabled={!selectedMemberId}
                            size="lg"
                        >
                            <LogIn className="w-5 h-5 mr-2" />
                            {buttonLabel}
                        </Button>
                    </CardContent>
                </Card>

                <p className="text-center text-sm text-muted-foreground">
                    生徒会専用システム
                </p>
            </div>
        </div>
    );
}
