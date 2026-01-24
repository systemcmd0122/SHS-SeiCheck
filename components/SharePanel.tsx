"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2, Copy, Trash2, Link as LinkIcon, MessageCircle } from "lucide-react";
import type { Event, SharedResponse } from "@/lib/types";
import { getSharedResponsesForEvent, createSharedResponse, deleteSharedResponse } from "@/lib/db";

interface SharePanelProps {
    event: Event;
    onShareCreated?: () => void;
    onShareDeleted?: () => void;
}

/**
 * ランダムなトークンを生成
 */
function generateShareToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * 共有メッセージを生成
 */
function generateShareMessage(event: Event, shareUrl: string): string {
    const eventDateTime = format(new Date(event.dateTime), "M月d日(E) HH:mm", { locale: ja });
    const deadline = format(new Date(event.deadline), "M月d日 HH:mm", { locale: ja });

    return `【出欠回答のお願い】

「${event.title}」の出欠回答をお願いします。

📋 詳細
─────────────────
種類: ${event.type}
開催日時: ${eventDateTime}
回答締切: ${deadline}

以下のリンクから回答してください
${shareUrl}

よろしくお願いします。`;
}

export function SharePanel({ event, onShareCreated, onShareDeleted }: SharePanelProps) {
    const [shares, setShares] = useState<SharedResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreatingShare, setIsCreatingShare] = useState(false);
    const [selectedShareToken, setSelectedShareToken] = useState<string | null>(null);
    const [copiedToken, setCopiedToken] = useState<string | null>(null);
    const [copiedMessage, setCopiedMessage] = useState<string | null>(null);

    useEffect(() => {
        loadShares();
    }, [event.id]);

    const loadShares = async () => {
        setIsLoading(true);
        try {
            const sharedResponses = await getSharedResponsesForEvent(event.id);
            setShares(sharedResponses);
        } catch (error) {
            console.error("共有リンク読み込みエラー:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateShare = async () => {
        setIsCreatingShare(true);
        try {
            const token = generateShareToken();
            const shareUrl = `${window.location.origin}/share/${token}`;

            await createSharedResponse({
                eventId: event.id,
                shareToken: token,
                createdBy: "admin",
            });

            await loadShares();
            onShareCreated?.();

            // 自動でURLをコピー
            navigator.clipboard.writeText(shareUrl);
            setSelectedShareToken(token);
            setCopiedToken(token);
            setTimeout(() => setCopiedToken(null), 2000);

            alert("共有リンクを作成しました。URLをコピーしました。");
        } catch (error) {
            console.error("共有リンク作成エラー:", error);
            alert("共有リンクの作成に失敗しました");
        } finally {
            setIsCreatingShare(false);
        }
    };

    const handleCopyShareLink = async (token: string) => {
        try {
            const shareUrl = `${window.location.origin}/share/${token}`;
            await navigator.clipboard.writeText(shareUrl);
            setCopiedToken(token);
            setTimeout(() => setCopiedToken(null), 2000);
        } catch (error) {
            console.error("コピーエラー:", error);
            alert("URLのコピーに失敗しました");
        }
    };

    const handleCopyShareMessage = async (token: string) => {
        try {
            const shareUrl = `${window.location.origin}/share/${token}`;
            const message = generateShareMessage(event, shareUrl);
            await navigator.clipboard.writeText(message);
            setCopiedMessage(token);
            setTimeout(() => setCopiedMessage(null), 2000);
        } catch (error) {
            console.error("コピーエラー:", error);
            alert("メッセージのコピーに失敗しました");
        }
    };

    const handleDeleteShare = async (shareId: string) => {
        if (!confirm("この共有リンクを削除してもよろしいですか?")) {
            return;
        }

        try {
            await deleteSharedResponse(shareId);
            await loadShares();
            onShareDeleted?.();
        } catch (error) {
            console.error("共有リンク削除エラー:", error);
            alert("共有リンクの削除に失敗しました");
        }
    };

    return (
        <div className="space-y-6">
            {/* ヘッダー */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Share2 className="w-6 h-6" />
                        共有リンク
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        このイベントへの回答フォームを共有できます
                    </p>
                </div>
                <Button onClick={handleCreateShare} disabled={isCreatingShare} className="gap-2">
                    <LinkIcon className="w-4 h-4" />
                    新しいリンクを生成
                </Button>
            </div>

            {/* 共有リンク一覧 */}
            {shares.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Share2 className="w-12 h-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground text-center">
                            まだ共有リンクがありません。<br />
                            新しいリンクを生成して共有を開始してください。
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {shares.map((share) => {
                        const shareUrl = `${window.location.origin}/share/${share.shareToken}`;
                        return (
                            <Card key={share.id}>
                                <CardContent className="pt-6">
                                    <div className="space-y-4">
                                        {/* メタ情報 */}
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-muted-foreground">
                                                作成日: {format(new Date(share.createdAt), "yyyy年M月d日 HH:mm", { locale: ja })}
                                            </div>
                                            <Badge variant="outline">アクティブ</Badge>
                                        </div>

                                        {/* URLコピー */}
                                        <div className="flex items-center gap-2">
                                            <Input
                                                value={shareUrl}
                                                readOnly
                                                className="font-mono text-sm"
                                            />
                                            <Button
                                                size="sm"
                                                variant={copiedToken === share.shareToken ? "default" : "outline"}
                                                onClick={() => handleCopyShareLink(share.shareToken)}
                                                className="gap-2"
                                            >
                                                <Copy className="w-4 h-4" />
                                                {copiedToken === share.shareToken ? "コピー済" : "URL"}
                                            </Button>
                                        </div>

                                        {/* メッセージコピー */}
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-2">LINE・メール等で共有するテンプレート</p>
                                            <Button
                                                size="sm"
                                                variant={copiedMessage === share.shareToken ? "default" : "outline"}
                                                onClick={() => handleCopyShareMessage(share.shareToken)}
                                                className="w-full gap-2"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                                {copiedMessage === share.shareToken ? "メッセージをコピー済" : "メッセージをコピー"}
                                            </Button>
                                        </div>

                                        {/* 削除ボタン */}
                                        <div className="flex justify-end">
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleDeleteShare(share.id)}
                                                className="gap-2"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                削除
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* 説明 */}
            <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
                <CardHeader>
                    <CardTitle className="text-base">共有リンクについて</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <p>
                        生成されたリンクを共有することで、他のメンバーが直接回答フォームにアクセスできます。
                    </p>
                    <p>
                        <strong>メッセージをコピー</strong>ボタンで、LINE・メール・チャットに貼り付けられるテンプレート文章をコピーできます。
                    </p>
                    <p>
                        リンクは複数生成可能です。不要になったリンクはいつでも削除できます。
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
