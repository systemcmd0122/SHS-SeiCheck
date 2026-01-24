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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { members } from "@/lib/members";
import { getSharedResponsesForEvent } from "@/lib/db";
import type { Event, Response, Member } from "@/lib/types";

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

            // メッセージに未回答者の名前を組み込む
            const unansweredNames = unansweredMembers.map((m) => m.name).join("さんと");
            const defaultMessage = `【回答のお願い】\n\n${unansweredNames}さんがまだ未回答です！\n\n予定「${event.title}」への回答をお願いします。\n下記のリンクから簡単に回答できます：\n\n${shareLink}\n\n締切：${format(new Date(event.deadline), "yyyy年M月d日 HH:mm", { locale: ja })}`;
            setShareMessage(defaultMessage);
        } catch (error) {
            console.error("共有リンク取得エラー:", error);
            alert("共有リンクの取得に失敗しました");
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareLink);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        } catch (error) {
            console.error("クリップボードコピーエラー:", error);
            alert("リンクのコピーに失敗しました");
        }
    };

    const handleCopyMessage = async () => {
        try {
            await navigator.clipboard.writeText(shareMessage);
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
            <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
                <CardHeader>
                    <CardTitle className="text-green-700 dark:text-green-400 flex items-center gap-2">
                        <Check className="w-5 h-5" />
                        全員が回答しました
                    </CardTitle>
                    <CardDescription>すべてのメンバーから回答を受け取っています</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className={isOverdue ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950" : "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950"}>
            <CardHeader>
                <CardTitle className={isOverdue ? "text-red-700 dark:text-red-400" : "text-yellow-700 dark:text-yellow-400"} >
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        未回答者がいます
                    </div>
                </CardTitle>
                <CardDescription>
                    {unansweredMembers.length}人のメンバーからまだ回答を受け取っていません
                    {isOverdue && " （締切超過）"}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* 未回答者一覧 */}
                <div className="space-y-2">
                    <h4 className="font-medium text-sm">未回答者一覧:</h4>
                    <div className="flex flex-wrap gap-2">
                        {unansweredMembers.map((member) => (
                            <Badge
                                key={member.id}
                                variant={isOverdue ? "destructive" : "secondary"}
                                className="text-xs"
                            >
                                {member.name}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* 共有リンク機能 */}
                <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            className="w-full"
                            variant={isOverdue ? "destructive" : "default"}
                            onClick={handleGenerateShareLink}
                        >
                            <Share2 className="w-4 h-4 mr-2" />
                            共有リンクで回答を促す
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>共有リンクを生成</DialogTitle>
                            <DialogDescription>
                                未回答者に共有できるリンクを作成します
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            {/* リンク表示・コピー */}
                            <div className="space-y-2">
                                <Label>共有リンク:</Label>
                                <div className="flex gap-2">
                                    <Input
                                        readOnly
                                        value={shareLink}
                                        className="text-sm"
                                    />
                                    <Button
                                        size="sm"
                                        variant={copiedLink ? "default" : "outline"}
                                        onClick={handleCopyLink}
                                    >
                                        <Copy className="w-4 h-4" />
                                        {copiedLink ? "コピー済" : "コピー"}
                                    </Button>
                                </div>
                            </div>

                            {/* メッセージプレビュー */}
                            <div className="space-y-2">
                                <Label>メッセージ:</Label>
                                <div className="flex gap-2">
                                    <textarea
                                        readOnly
                                        value={shareMessage}
                                        className="flex-1 min-h-32 p-3 text-sm border rounded-md bg-muted/50"
                                    />
                                    <Button
                                        size="sm"
                                        variant={copiedMessage ? "default" : "outline"}
                                        onClick={handleCopyMessage}
                                        className="self-start"
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
                        </div>

                        <DialogFooter className="flex-row-reverse">
                            <Button
                                variant="outline"
                                onClick={() => setIsShareDialogOpen(false)}
                            >
                                閉じる
                            </Button>
                            <Button
                                onClick={() => {
                                    handleCopyLink();
                                    setIsShareDialogOpen(false);
                                }}
                            >
                                <Copy className="w-4 h-4 mr-2" />
                                リンクをコピーして閉じる
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

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
