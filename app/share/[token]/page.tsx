"use client";

import { useState, useEffect, JSX } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, isPast } from "date-fns";
import { ja } from "date-fns/locale";
import {
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    LogOut,
    Share2,
    ArrowLeft,
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
import { members } from "@/lib/members";
import {
    getAllEvents,
    getAllResponses,
    saveResponse,
    getResponse,
    getSharedResponseByToken,
} from "@/lib/db";
import type { Event, Response, ResponseStatus, Member } from "@/lib/types";
import { REASON_PRESETS } from "@/lib/types";

export default function SharePage() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;

    const [event, setEvent] = useState<Event | null>(null);
    const [responses, setResponses] = useState<Response[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<ResponseStatus>("参加");
    const [reason, setReason] = useState("");
    const [saving, setSaving] = useState(false);
    const [memberResponse, setMemberResponse] = useState<Response | null>(null);

    useEffect(() => {
        loadData();
    }, [token]);

    const loadData = async () => {
        setLoading(true);
        try {
            // トークンから共有情報を取得
            const shared = await getSharedResponseByToken(token);
            if (!shared) {
                setError("このリンクは無効です。");
                setLoading(false);
                return;
            }

            // 共有されている予定を取得
            const allEvents = await getAllEvents();
            const targetEvent = allEvents.find((e) => e.id === shared.eventId);

            if (!targetEvent) {
                setError("予定が見つかりません。");
                setLoading(false);
                return;
            }

            const responsesData = await getAllResponses();
            setEvent(targetEvent);
            setResponses(responsesData);
        } catch (err) {
            console.error("読み込みエラー:", err);
            setError("予定の読み込みに失敗しました。");
        } finally {
            setLoading(false);
        }
    };

    const handleMemberSelect = async (memberId: string) => {
        setSelectedMemberId(memberId);
        setSelectedEvent(event);

        // 既存の回答を取得
        if (event) {
            const existingResponse = await getResponse(event.id, memberId);
            if (existingResponse) {
                setSelectedStatus(existingResponse.status);
                setReason(existingResponse.reason || "");
                setMemberResponse(existingResponse);
            } else {
                setSelectedStatus("参加");
                setReason("");
                setMemberResponse(null);
            }
        }

        setDialogOpen(true);
    };

    const handleSaveResponse = async () => {
        if (!selectedEvent || !selectedMemberId) return;

        // 参加以外で理由が空の場合はエラー
        if ((selectedStatus === "遅れる" || selectedStatus === "不参加") && !reason.trim()) {
            alert("理由を入力してください");
            return;
        }

        setSaving(true);
        try {
            const responseData: Response = {
                eventId: selectedEvent.id,
                memberId: selectedMemberId,
                status: selectedStatus,
                updatedAt: new Date().toISOString(),
                updatedBy: selectedMemberId,
            };

            // reason が空でない場合のみ追加
            if (reason.trim()) {
                responseData.reason = reason.trim();
            }

            await saveResponse(responseData);
            await loadData();
            setDialogOpen(false);
            setSelectedEvent(null);
            setReason("");
            setSelectedMemberId(null);
            alert("回答を保存しました");
        } catch (error) {
            console.error("回答保存エラー:", error);
            const errorMessage =
                error instanceof Error ? error.message : "回答の保存に失敗しました";
            alert(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const isDeadlinePassed = (event: Event) => {
        return isPast(new Date(event.deadline));
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

    const getMyResponse = (eventId: string, memberId: string) => {
        return responses.find((r) => r.eventId === eventId && r.memberId === memberId);
    };

    if (loading) {
        return <LoadingScreen />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
                <Card className="max-w-md w-full border-0 shadow-xl">
                    <CardHeader className="text-center">
                        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <CardTitle>エラーが発生しました</CardTitle>
                        <CardDescription className="mt-2">{error}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" onClick={() => router.push("/")}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            ホームに戻る
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
                <Card className="max-w-md w-full border-0 shadow-xl">
                    <CardHeader className="text-center">
                        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                        <CardTitle>予定が見つかりません</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" onClick={() => router.push("/")}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            ホームに戻る
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const deadlinePassed = isDeadlinePassed(event);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
            {/* ヘッダー */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Share2 className="w-6 h-6 text-primary" />
                        <div>
                            <h1 className="text-base sm:text-lg font-bold">出欠回答フォーム</h1>
                            <p className="text-xs text-muted-foreground">共有リンクから回答</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">ホーム</span>
                        </Button>
                    </div>
                </div>
            </header>

            <div className="container mx-auto p-3 sm:p-4 space-y-4 sm:space-y-6 max-w-2xl">
                {/* 予定情報 */}
                <Card className="border-0 shadow-md">
                    <CardHeader className="pb-3 sm:pb-4">
                        <div className="flex items-start justify-between gap-2 sm:gap-3">
                            <div className="flex-1 min-w-0">
                                <CardTitle className="text-lg sm:text-2xl mb-2 line-clamp-2">{event.title}</CardTitle>
                                <CardDescription className="text-xs sm:text-sm space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="shrink-0">{event.type}</Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                                        <span className="truncate">
                                            開催: {format(new Date(event.dateTime), "M月d日(E) HH:mm", {
                                                locale: ja,
                                            })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                                        <span className="truncate">
                                            締切: {format(new Date(event.deadline), "M月d日 HH:mm", { locale: ja })}
                                        </span>
                                    </div>
                                </CardDescription>
                            </div>
                        </div>
                        {deadlinePassed && (
                            <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900">
                                <div className="flex items-start gap-2 sm:gap-3">
                                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                                    <p className="text-xs sm:text-sm font-medium text-orange-900 dark:text-orange-100">
                                        締切を過ぎています。参考までに回答することができます。
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardHeader>
                </Card>

                {/* メンバー一覧 */}
                <Card className="border-0 shadow-md">
                    <CardHeader className="pb-3 sm:pb-4">
                        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                            あなたの出欠を回答してください
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                            下からあなたの名前を選択して回答してください
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 sm:space-y-3">
                        {members.map((member) => {
                            const response = getMyResponse(event.id, member.id);
                            const status: ResponseStatus = response?.status || "未回答";

                            return (
                                <button
                                    key={member.id}
                                    onClick={() => handleMemberSelect(member.id)}
                                    className="w-full text-left p-3 sm:p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 transition-all hover:border-primary hover:bg-primary/5 active:shadow-lg"
                                >
                                    <div className="flex items-center justify-between gap-2 sm:gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm sm:text-base truncate">{member.name}</p>
                                            <p className="text-xs sm:text-sm text-muted-foreground truncate">{member.committee}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 sm:gap-2 shrink-0">
                                            {getStatusBadge(status, deadlinePassed && status === "未回答")}
                                            {response?.reason && (
                                                <p className="text-xs text-muted-foreground line-clamp-1">
                                                    {response.reason}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </CardContent>
                </Card>
            </div>            {/* 回答ダイアログ */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="w-[95vw] sm:max-w-lg p-4 sm:p-6 max-h-[85vh] flex flex-col">
                    <DialogHeader className="flex-shrink-0">
                        <DialogTitle className="text-lg sm:text-xl">出欠回答</DialogTitle>
                        <DialogDescription className="text-sm sm:text-base">
                            {members.find((m) => m.id === selectedMemberId)?.name} の出欠を回答
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 py-4">
                        <div className="space-y-2 sm:space-y-3">
                            <Label className="text-sm sm:text-base font-semibold">出欠状況</Label>
                            <RadioGroup value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as ResponseStatus)}>
                                <div className="flex items-center space-x-2 p-2.5 sm:p-3 rounded-lg border hover:bg-accent transition-colors active:shadow-md">
                                    <RadioGroupItem value="参加" id="status-attend" />
                                    <Label htmlFor="status-attend" className="flex-1 cursor-pointer">
                                        <div className="font-medium text-sm sm:text-base">参加</div>
                                        <div className="text-xs text-muted-foreground">予定通り参加します</div>
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2 p-2.5 sm:p-3 rounded-lg border hover:bg-accent transition-colors active:shadow-md">
                                    <RadioGroupItem value="遅れる" id="status-late" />
                                    <Label htmlFor="status-late" className="flex-1 cursor-pointer">
                                        <div className="font-medium text-sm sm:text-base">遅れる</div>
                                        <div className="text-xs text-muted-foreground">遅れて参加します</div>
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2 p-2.5 sm:p-3 rounded-lg border hover:bg-accent transition-colors active:shadow-md">
                                    <RadioGroupItem value="不参加" id="status-absent" />
                                    <Label htmlFor="status-absent" className="flex-1 cursor-pointer">
                                        <div className="font-medium text-sm sm:text-base">不参加</div>
                                        <div className="text-xs text-muted-foreground">参加できません</div>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {(selectedStatus === "遅れる" || selectedStatus === "不参加") && (
                            <div className="space-y-2 sm:space-y-3">
                                <Label htmlFor="reason" className="text-sm sm:text-base font-semibold">
                                    理由を教えてください
                                </Label>
                                {selectedStatus === "遅れる" && REASON_PRESETS.遅れる.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                        {REASON_PRESETS.遅れる.map((preset) => (
                                            <Button
                                                key={preset}
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setReason(preset)}
                                                className={`text-xs sm:text-sm h-8 sm:h-9 ${reason === preset ? "border-primary bg-primary/10" : ""}`}
                                            >
                                                {preset}
                                            </Button>
                                        ))}
                                    </div>
                                )}
                                {selectedStatus === "不参加" && REASON_PRESETS.不参加.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                        {REASON_PRESETS.不参加.map((preset) => (
                                            <Button
                                                key={preset}
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setReason(preset)}
                                                className={`text-xs sm:text-sm h-8 sm:h-9 ${reason === preset ? "border-primary bg-primary/10" : ""}`}
                                            >
                                                {preset}
                                            </Button>
                                        ))}
                                    </div>
                                )}
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
                        <Button variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto h-10 sm:h-9 text-sm" size="sm">
                            キャンセル
                        </Button>
                        <Button onClick={handleSaveResponse} disabled={saving} className="w-full sm:w-auto h-10 sm:h-9 text-sm" size="sm">
                            {saving ? "保存中..." : "回答を保存"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
