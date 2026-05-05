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
        const init = () => {
            const stored = localStorage.getItem(LAST_USER_KEY);
            if (stored && members.some((m) => m.id === stored)) {
                setLastMemberId(stored);
                setShowContinueDialog(true);
            }
            setIsLoading(false);
        };
        
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
        <div className="flex min-h-[100dvh] items-center justify-center bg-background p-4 sm:p-8">
            <Dialog open={showContinueDialog} onOpenChange={setShowContinueDialog}>
                <DialogContent className="w-[92vw] sm:max-w-md p-6 rounded-lg border shadow-md">
                    <DialogHeader className="space-y-3">
                        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                            <UserCircle className="w-8 h-8 text-primary" />
                        </div>
                        <DialogTitle className="text-xl text-center font-bold">おかえりなさい！</DialogTitle>
                        <DialogDescription className="text-center">
                            前回使用したアカウントでログインを継続しますか？
                        </DialogDescription>
                    </DialogHeader>
                    {lastMember && (
                        <div className="py-4">
                            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted border border-border">
                                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground flex-shrink-0 font-bold text-lg">
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
                    <DialogFooter className="flex flex-col gap-2 sm:flex-row pt-2">
                        <Button 
                            onClick={handleSelectNew} 
                            variant="outline"
                            className="w-full sm:flex-1 order-2 sm:order-1"
                        >
                            別のユーザーを選択
                        </Button>
                        <Button 
                            onClick={handleContinueWithLast} 
                            className="w-full sm:flex-1 order-1 sm:order-2"
                        >
                            <LogIn className="w-4 h-4 mr-2" />
                            続ける
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {showAdminButton && (
                <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-background p-1 rounded-full border shadow-sm">
                    <Button
                        onClick={handleTeacherAccess}
                        variant="ghost"
                        size="sm"
                        className="hidden sm:flex items-center gap-2 rounded-full h-8 px-3"
                    >
                        <GraduationCap className="w-4 h-4" />
                        先生
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleTeacherAccess}
                        className="sm:hidden w-8 h-8 rounded-full"
                        title="先生ログイン"
                    >
                        <GraduationCap className="w-5 h-5" />
                    </Button>
                    <div className="w-px h-4 bg-border mx-1 hidden sm:block" />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleAdminAccess}
                        className="w-8 h-8 rounded-full"
                        title="設定"
                    >
                        <Settings className="w-5 h-5" />
                    </Button>
                    <ThemeToggle />
                </div>
            )}

            <div className="w-full max-w-md space-y-6">
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-primary shadow-md mb-2">
                        <UserCircle className="w-10 h-10 text-primary-foreground" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                            {title}
                        </h1>
                        <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                </div>

                {(isEventsLoading || events.length > 0) && (
                    <div className="w-full">
                        <TodayEventsList
                            events={events}
                            isLoading={isEventsLoading}
                        />
                    </div>
                )}

                {lastMember && (
                    <Card className="rounded-lg border shadow-md overflow-hidden">
                        <CardHeader className="pb-2 px-6 pt-6">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                おかえりなさい
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-6 px-6">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary text-primary-foreground shadow-sm flex-shrink-0 font-bold text-lg">
                                        {lastMember.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-lg truncate">{lastMember.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{lastMember.committee}</p>
                                    </div>
                                </div>
                                <Button 
                                    onClick={handleContinueWithLast} 
                                    className="w-full sm:w-auto shrink-0 rounded-lg px-6 shadow-sm"
                                >
                                    入室する
                                    <LogIn className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card className="rounded-lg border shadow-md">
                    <CardHeader className="space-y-1 pb-4 px-6 pt-6">
                        <CardTitle className="text-xl font-bold">新規ログイン</CardTitle>
                        <CardDescription className="text-sm">
                            あなたの名前を選択してください
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 px-6 pb-8">
                        <div className="space-y-4">
                            <Select onValueChange={handleSelect} value={selectedMemberId || ""}>
                                <SelectTrigger className="h-12 text-base rounded-lg border-border bg-background">
                                    <SelectValue placeholder="名前を選択..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px] rounded-lg shadow-sm">
                                    {members.map((member) => (
                                        <SelectItem key={member.id} value={member.id}>
                                            <div className="flex flex-col items-start gap-0.5">
                                                <span className="font-bold text-sm">{member.name}</span>
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
                            className="w-full h-12 text-lg font-bold rounded-lg shadow-sm"
                            onClick={handleStart}
                            disabled={!selectedMemberId}
                        >
                            <LogIn className="w-4 h-4 mr-2" />
                            {buttonLabel}
                        </Button>
                    </CardContent>
                </Card>

                <div className="text-center">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest opacity-60">
                        Student Council Management System
                    </p>
                </div>
            </div>
        </div>
    );
}
