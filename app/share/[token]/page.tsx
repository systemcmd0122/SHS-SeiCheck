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
    getEvent,
    getAllResponses,
    saveResponse,
    getResponse,
    getSharedResponseByToken,
} from "@/lib/db";
import type { Event, Response, ResponseStatus } from "@/lib/types";
import { REASON_PRESETS } from "@/lib/types";
import { getErrorMessage } from "@/lib/utils";

export default function SharePage() {
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

    useEffect(() => {
        loadData();
    }, [token]);

    const loadData = async () => {
        setLoading(true);
        try {
            const shared = await getSharedResponseByToken(token);
            if (!shared) {
                setError("このリンクは無効です。");
                setLoading(false);
                return;
            }
            const targetEvent = await getEvent(shared.eventId);
            if (!targetEvent) {
                setError("予定が見つかりません。");
                setLoading(false);
                return;
            }
            const responsesData = await getAllResponses();
            setEvent(targetEvent);
            setResponses(responsesData);
        } catch (err) {
            setError("読み込みに失敗しました");
        } finally {
            setLoading(false);
        }
    };

    const handleMemberSelect = async (memberId: string) => {
        setSelectedMemberId(memberId);
        setSelectedEvent(event);
        if (event) {
            const existingResponse = await getResponse(event.id, memberId);
            if (existingResponse) {
                setSelectedStatus(existingResponse.status);
                setReason(existingResponse.reason || "");
            } else {
                setSelectedStatus("参加");
                setReason("");
            }
        }
        setDialogOpen(true);
    };

    const handleSaveResponse = async () => {
        if (!selectedEvent || !selectedMemberId) return;
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
            if (reason.trim()) responseData.reason = reason.trim();
            await saveResponse(responseData);
            await loadData();
            setDialogOpen(false);
            alert("回答を保存しました");
        } catch (error) {
            alert("保存に失敗しました");
        } finally {
            setSaving(false);
        }
    };

    const isDeadlinePassed = (event: Event) => isPast(new Date(event.deadline));

    const getStatusBadge = (status: ResponseStatus, isOverdue: boolean = false) => {
        if (isOverdue && status === "未回答") return <Badge variant="destructive">期限切れ</Badge>;
        const badges: Record<ResponseStatus, JSX.Element> = {
            参加: <Badge className="bg-emerald-600">参加</Badge>,
            遅れる: <Badge className="bg-amber-600">遅れる</Badge>,
            不参加: <Badge className="bg-rose-600">不参加</Badge>,
            未回答: <Badge variant="outline">未回答</Badge>,
        };
        return badges[status];
    };

    const getMyResponse = (eventId: string, memberId: string) => responses.find((r) => r.eventId === eventId && r.memberId === memberId);

    if (loading) return <LoadingScreen />;

    if (error || !event) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="max-w-md w-full border shadow-sm">
                    <CardHeader className="text-center">
                        <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-4" />
                        <CardTitle>{error || "エラーが発生しました"}</CardTitle>
                    </CardHeader>
                    <CardContent><Button className="w-full" onClick={() => router.push("/")}><ArrowLeft className="w-4 h-4 mr-2" />ホームに戻る</Button></CardContent>
                </Card>
            </div>
        );
    }

    const deadlinePassed = isDeadlinePassed(event);

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3"><Share2 className="w-5 h-5 text-primary" /><div><h1 className="text-base font-bold">出欠回答フォーム</h1><p className="text-[10px] text-muted-foreground uppercase">Response Form</p></div></div>
                    <div className="flex items-center gap-2"><ThemeToggle /><Button variant="ghost" size="sm" onClick={() => router.push("/")}><ArrowLeft className="w-4 h-4 mr-2" />ホーム</Button></div>
                </div>
            </header>

            <div className="container mx-auto p-4 space-y-6 max-w-2xl">
                <Card className="border shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl mb-2">{event.title}</CardTitle>
                        <CardDescription className="space-y-2">
                            <Badge variant="outline">{event.type}</Badge>
                            <div className="text-xs space-y-1">
                                <div className="flex items-center gap-2"><Calendar className="w-3 h-3" /><span>開催: {safeFormat(event.dateTime, "M/d HH:mm")}</span></div>
                                <div className="flex items-center gap-2"><Clock className="w-3 h-3" /><span>締切: {safeFormat(event.deadline, "M/d HH:mm")}</span></div>
                            </div>
                        </CardDescription>
                        {deadlinePassed && <div className="mt-4 p-2.5 rounded bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-xs font-bold border border-amber-200">締切を過ぎていますが回答可能です。</div>}
                    </CardHeader>
                </Card>

                <Card className="border shadow-sm">
                    <CardHeader><CardTitle className="text-base">名前を選択して回答してください</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {members.map((member) => {
                            const res = getMyResponse(event.id, member.id);
                            return (
                                <button key={member.id} onClick={() => handleMemberSelect(member.id)} className="w-full text-left p-4 rounded-lg border bg-background hover:bg-muted transition-colors flex justify-between items-center">
                                    <div className="min-w-0 flex-1"><p className="font-bold text-sm truncate">{member.name}</p><p className="text-[10px] text-muted-foreground truncate">{member.committee}</p></div>
                                    <div className="shrink-0">{getStatusBadge(res?.status || "未回答", deadlinePassed && !res)}</div>
                                </button>
                            );
                        })}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="w-[95vw] sm:max-w-lg p-6 rounded-lg">
                    <DialogHeader><DialogTitle>出欠回答</DialogTitle><DialogDescription>{members.find(m=>m.id===selectedMemberId)?.name} の回答</DialogDescription></DialogHeader>
                    <div className="space-y-6 py-4">
                        <RadioGroup value={selectedStatus} onValueChange={(v)=>setSelectedStatus(v as any)}>
                            {["参加", "遅れる", "不参加"].map(s=>(
                                <div key={s} className="flex items-center space-x-2 p-3 rounded border hover:bg-muted cursor-pointer"><RadioGroupItem value={s} id={s} /><Label htmlFor={s} className="flex-1 cursor-pointer font-bold">{s}</Label></div>
                            ))}
                        </RadioGroup>
                        {(selectedStatus === "遅れる" || selectedStatus === "不参加") && (
                            <div className="space-y-2">
                                <Label className="text-xs font-bold">理由 *</Label>
                                <div className="flex flex-wrap gap-2">
                                    {REASON_PRESETS[selectedStatus].map(p=>(
                                        <Button key={p} variant="outline" size="sm" className={`text-[10px] h-7 ${reason===p?"bg-primary text-primary-foreground":""}`} onClick={()=>setReason(p)}>
                                            {p}
                                        </Button>
                                    ))}
                                </div>
                                <Textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="理由を入力してください" rows={3} className="text-xs" />
                            </div>
                        )}
                    </div>
                    <DialogFooter className="flex gap-2"><Button variant="outline" onClick={()=>setDialogOpen(false)} className="w-full sm:w-auto">キャンセル</Button><Button onClick={handleSaveResponse} disabled={saving} className="w-full sm:w-auto">{saving?"保存中...":"保存"}</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
