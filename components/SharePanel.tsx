"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2, Copy, Trash2, Link as LinkIcon, MessageCircle, Clock } from "lucide-react";
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
            try {
                if (navigator.clipboard?.writeText) {
                    await navigator.clipboard.writeText(shareUrl);
                } else {
                    if (!copyToClipboardFallback(shareUrl)) {
                        throw new Error("クリップボードコピーに失敗しました");
                    }
                }
            } catch (clipboardError) {
                console.error("URLコピーエラー:", clipboardError);
                // コピー失敗時はアラートには出さない（リンク作成は成功している）
            }

            setSelectedShareToken(token);
            setCopiedToken(token);
            setTimeout(() => setCopiedToken(null), 2000);

            alert("共有リンクを作成しました。");
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
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(shareUrl);
            } else {
                if (!copyToClipboardFallback(shareUrl)) {
                    throw new Error("クリップボードコピーに失敗しました");
                }
            }
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
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(message);
            } else {
                if (!copyToClipboardFallback(message)) {
                    throw new Error("クリップボードコピーに失敗しました");
                }
            }
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
        <div className="space-y-8 animate-fade-in">
            {/* ヘッダー */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 section-title">
                        <Share2 className="w-6 h-6 text-primary" />
                        共有リンク
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        このイベントへの回答フォームを共有できます
                    </p>
                </div>
                <Button onClick={handleCreateShare} disabled={isCreatingShare} className="gap-2 rounded-xl shadow-md">
                    <LinkIcon className="w-4 h-4" />
                    新しいリンクを生成
                </Button>
            </div>

            {/* 共有リンク一覧 */}
            {shares.length === 0 ? (
                <Card className="border-2 border-dashed border-muted bg-muted/20">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            <Share2 className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground text-center font-medium">
                            まだ共有リンクがありません。<br />
                            <span className="text-xs font-normal opacity-70">新しいリンクを生成して共有を開始してください。</span>
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {shares.map((share) => {
                        const shareUrl = `${window.location.origin}/share/${share.shareToken}`;
                        return (
                            <Card key={share.id} className="border-0 shadow-sm overflow-hidden card-hover">
                                <CardHeader className="bg-muted/30 py-3">
                                    <div className="flex items-center justify-between">
                                        <div className="text-[10px] label-caps text-muted-foreground flex items-center gap-1.5">
                                            <Clock className="w-3 h-3" />
                                            作成: {format(new Date(share.createdAt), "yyyy/MM/dd HH:mm", { locale: ja })}
                                        </div>
                                        <Badge variant="secondary" className="text-[10px] font-bold h-5 bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50">有効</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-5 pb-5 space-y-5">
                                    {/* URLコピー */}
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold label-caps text-muted-foreground text-primary/70">共有用URL</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                value={shareUrl}
                                                readOnly
                                                className="font-mono text-xs bg-muted/30 border-dashed rounded-lg h-9"
                                            />
                                            <Button
                                                size="sm"
                                                variant={copiedToken === share.shareToken ? "default" : "outline"}
                                                onClick={() => handleCopyShareLink(share.shareToken)}
                                                className="gap-2 h-9 rounded-lg"
                                            >
                                                <Copy className="w-3.5 h-3.5" />
                                                <span className="text-xs font-bold">{copiedToken === share.shareToken ? "完了" : "コピー"}</span>
                                            </Button>
                                        </div>
                                    </div>

                                    {/* メッセージコピー */}
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold label-caps text-muted-foreground text-primary/70">共有用テンプレート (LINE等)</Label>
                                        <Button
                                            size="sm"
                                            variant={copiedMessage === share.shareToken ? "default" : "outline"}
                                            onClick={() => handleCopyShareMessage(share.shareToken)}
                                            className="w-full gap-2 h-10 rounded-xl font-bold transition-all"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            <span className="text-xs">{copiedMessage === share.shareToken ? "メッセージをコピーしました" : "テンプレートをコピー"}</span>
                                        </Button>
                                    </div>

                                    {/* 削除ボタン */}
                                    <div className="flex justify-end pt-2 border-t border-border/50">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDeleteShare(share.id)}
                                            className="gap-2 h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold label-caps">リンクを削除</span>
                                        </Button>
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
