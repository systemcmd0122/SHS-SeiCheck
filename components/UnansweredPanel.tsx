"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
    AlertTriangle,
    Copy,
    Share2,
    Mail,
    Check,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShareLinkDialog } from "@/components/CommonDialogs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { members } from "@/lib/members";
import { getSharedResponsesForEvent } from "@/lib/db";
import type { Event, Response, Member } from "@/lib/types";
import { cn } from "@/lib/utils";

interface UnansweredPanelProps {
    event: Event;
    responses: Response[];
}

export function UnansweredPanel({ event, responses }: UnansweredPanelProps) {
    const [unansweredMembers, setUnansweredMembers] = useState<Member[]>([]);
    const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
    const [shareLink, setShareLink] = useState<string>("");
    const [shareMessage, setShareMessage] = useState("");
    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedMessage, setCopiedMessage] = useState(false);

    useEffect(() => {
        // 未回答のメンバーを特定
        const answeredMemberIds = new Set(responses.map((r) => r.memberId));
        const unanswered = members.filter((m) => !answeredMemberIds.has(m.id));
        setUnansweredMembers(unanswered);
    }, [responses]);

    const handleGenerateShareLink = async () => {
        try {
            // 既存の共有リンクを取得
            const existingShares = await getSharedResponsesForEvent(event.id);

            let shareLink = "";
            if (existingShares.length > 0) {
                // 既存のリンクを使用
                shareLink = `${typeof window !== "undefined" ? window.location.origin : ""}/share/${existingShares[0].shareToken}`;
            } else {
                // 既存の共有リンクがない場合は、SharePanel で作成するように促す
                alert("共有リンクを作成してください");
                return;
            }

            setShareLink(shareLink);

            // メッセージに未回答者の苗字を組み込む
            const unansweredNames = unansweredMembers.map((m) => m.name.split(" ")[0]).join("さんと");
            const defaultMessage = `【回答のお願い】\n\n${unansweredNames}さんがまだ未回答です！\n\n予定「${event.title}」への回答をお願いします。\n下記のリンクから簡単に回答できます：\n\n${shareLink}\n\n締切：${format(new Date(event.deadline), "yyyy年M月d日 HH:mm", { locale: ja })}`;
            setShareMessage(defaultMessage);

            // ダイアログを開く
            setIsShareDialogOpen(true);
        } catch (error) {
            console.error("共有リンク取得エラー:", error);
            alert("共有リンクの取得に失敗しました");
        }
    };

    // フォールバック関数：古いやり方でクリップボードにコピー
    const copyToClipboardFallback = (text: string) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);

        try {
            textArea.focus();
            textArea.select();
            const successful = document.execCommand("copy");
            document.body.removeChild(textArea);
            return successful;
        } catch (error) {
            document.body.removeChild(textArea);
            return false;
        }
    };

    const handleCopyLink = async () => {
        try {
            // まず新しい Clipboard API を試す
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(shareLink);
            } else {
                // フォールバック：古い方法を使う
                if (!copyToClipboardFallback(shareLink)) {
                    throw new Error("クリップボードコピーに失敗しました");
                }
            }
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        } catch (error) {
            console.error("クリップボードコピーエラー:", error);
            alert("リンクのコピーに失敗しました");
        }
    };

    const handleCopyMessage = async () => {
        try {
            // まず新しい Clipboard API を試す
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(shareMessage);
            } else {
                // フォールバック：古い方法を使う
                if (!copyToClipboardFallback(shareMessage)) {
                    throw new Error("クリップボードコピーに失敗しました");
                }
            }
            setCopiedMessage(true);
            setTimeout(() => setCopiedMessage(false), 2000);
        } catch (error) {
            console.error("クリップボードコピーエラー:", error);
            alert("メッセージのコピーに失敗しました");
        }
    };

    const isOverdue = new Date(event.deadline) < new Date();
    const hasUnanswered = unansweredMembers.length > 0;

    if (!hasUnanswered) {
        return (
            <Card className="border-0 bg-emerald-500/10 dark:bg-emerald-500/5 shadow-sm overflow-hidden">
                <CardHeader className="py-4">
                    <CardTitle className="text-emerald-700 dark:text-emerald-400 flex items-center gap-2 text-base font-bold">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <Check className="w-4 h-4" />
                        </div>
                        全員が回答しました
                    </CardTitle>
                    <CardDescription className="text-emerald-600/70 dark:text-emerald-400/70 ml-10">すべてのメンバーから回答を受け取っています</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className={cn(
            "border-0 shadow-sm overflow-hidden",
            isOverdue
                ? "bg-rose-500/10 dark:bg-rose-500/5"
                : "bg-amber-500/10 dark:bg-amber-500/5"
        )}>
            <CardHeader className="py-4">
                <CardTitle className={cn(
                    "flex items-center gap-2 text-base font-bold",
                    isOverdue ? "text-rose-700 dark:text-rose-400" : "text-amber-700 dark:text-amber-400"
                )}>
                    <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        isOverdue ? "bg-rose-500/20" : "bg-amber-500/20"
                    )}>
                        <AlertTriangle className="w-4 h-4" />
                    </div>
                    未回答者がいます
                </CardTitle>
                <CardDescription className={cn(
                    "ml-10",
                    isOverdue ? "text-rose-600/70 dark:text-rose-400/70" : "text-amber-600/70 dark:text-amber-400/70"
                )}>
                    {unansweredMembers.length}人のメンバーが未回答です
                    {isOverdue && " （締切超過）"}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-0">
                {/* 未回答者一覧 */}
                <div className="ml-10 space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                        {unansweredMembers.map((member) => (
                            <Badge
                                key={member.id}
                                variant="outline"
                                className={cn(
                                    "text-[10px] font-normal rounded-lg bg-card/50",
                                    isOverdue ? "border-rose-200 text-rose-700" : "border-amber-200 text-amber-700"
                                )}
                            >
                                {member.name}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* 共有リンク機能 */}
                <div className="ml-10">
                    <Button
                        className={cn(
                            "w-full rounded-xl shadow-sm h-10 font-bold text-xs transition-all",
                            isOverdue
                                ? "bg-rose-600 hover:bg-rose-700 text-white"
                                : "bg-amber-600 hover:bg-amber-700 text-white"
                        )}
                        onClick={handleGenerateShareLink}
                    >
                        <Share2 className="w-3.5 h-3.5 mr-2" />
                        共有リンクで回答を促す
                    </Button>
                </div>

                <ShareLinkDialog
                    isOpen={isShareDialogOpen}
                    onOpenChange={setIsShareDialogOpen}
                    onClose={() => {
                        setIsShareDialogOpen(false);
                    }}
                >
                    {/* リンク表示・コピー */}
                    <div className="space-y-2">
                        <Label>共有リンク:</Label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Input
                                readOnly
                                value={shareLink}
                                className="text-sm flex-1 min-w-0"
                            />
                            <Button
                                size="sm"
                                variant={copiedLink ? "default" : "outline"}
                                onClick={handleCopyLink}
                                className="shrink-0"
                            >
                                <Copy className="w-4 h-4" />
                                {copiedLink ? "コピー済" : "コピー"}
                            </Button>
                        </div>
                    </div>

                    {/* メッセージプレビュー */}
                    <div className="space-y-2">
                        <Label>メッセージ:</Label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <textarea
                                readOnly
                                value={shareMessage}
                                className="flex-1 min-h-32 p-3 text-sm border rounded-md bg-muted/50"
                            />
                            <Button
                                size="sm"
                                variant={copiedMessage ? "default" : "outline"}
                                onClick={handleCopyMessage}
                                className="self-start shrink-0"
                            >
                                <Copy className="w-4 h-4" />
                                {copiedMessage ? "コピー済" : "コピー"}
                            </Button>
                        </div>
                    </div>

                    {/* 注意事項 */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm border border-blue-200 dark:border-blue-800">
                        <p className="text-blue-700 dark:text-blue-300">
                            💡 共有リンクを使用すれば、ログインなしで回答できます
                        </p>
                    </div>
                </ShareLinkDialog>

                {/* 締切情報 */}
                <div className="text-xs text-muted-foreground">
                    <p>
                        締切：{format(new Date(event.deadline), "yyyy年M月d日 HH:mm", { locale: ja })}
                    </p>
                    {isOverdue && (
                        <p className="text-red-600 dark:text-red-400 font-medium">
                            ⚠ 締切超過
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
