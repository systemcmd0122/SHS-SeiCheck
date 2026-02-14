"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2, Copy, Trash2, Link as LinkIcon, MessageCircle, Clock, Calendar } from "lucide-react";
import type { Event, SharedResponse } from "@/lib/types";
import { deleteSharedResponse } from "@/lib/db";
import { successToast, errorToast } from "@/components/ui/toast-simple";

interface SharedLinksListProps {
    events: Event[];
    sharedResponses: SharedResponse[];
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

export function SharedLinksList({ events, sharedResponses }: SharedLinksListProps) {
    const [copiedToken, setCopiedToken] = useState<string | null>(null);
    const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredShares = sharedResponses.filter(share => {
        const event = events.find(e => e.id === share.eventId);
        if (!event) return false;
        return event.title.toLowerCase().includes(searchQuery.toLowerCase());
    });

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
            successToast("コピー成功", "URLをコピーしました");
        } catch (error) {
            console.error("コピーエラー:", error);
            errorToast("コピー失敗", "URLのコピーに失敗しました");
        }
    };

    const handleCopyShareMessage = async (share: SharedResponse) => {
        const event = events.find(e => e.id === share.eventId);
        if (!event) {
            errorToast("エラー", "予定が見つかりません");
            return;
        }

        try {
            const shareUrl = `${window.location.origin}/share/${share.shareToken}`;
            const message = generateShareMessage(event, shareUrl);
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(message);
            } else {
                if (!copyToClipboardFallback(message)) {
                    throw new Error("クリップボードコピーに失敗しました");
                }
            }
            setCopiedMessage(share.shareToken);
            setTimeout(() => setCopiedMessage(null), 2000);
            successToast("コピー成功", "メッセージをコピーしました");
        } catch (error) {
            console.error("コピーエラー:", error);
            errorToast("コピー失敗", "メッセージのコピーに失敗しました");
        }
    };

    const handleDeleteShare = async (shareId: string) => {
        if (!confirm("この共有リンクを削除してもよろしいですか?")) {
            return;
        }

        try {
            await deleteSharedResponse(shareId);
            successToast("削除成功", "共有リンクを削除しました");
        } catch (error) {
            console.error("共有リンク削除エラー:", error);
            errorToast("削除失敗", "共有リンクの削除に失敗しました");
        }
    };

    if (sharedResponses.length === 0) {
        return (
            <Card className="border-2 border-dashed border-muted bg-muted/20">
                <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Share2 className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-center font-medium">
                        有効な共有リンクがありません。<br />
                        <span className="text-xs font-normal opacity-70">予定一覧から新しいリンクを生成できます。</span>
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="relative">
                <Input
                    placeholder="リンクを検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl shadow-sm focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <Share2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
            </div>

            {filteredShares.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                    検索結果が見つかりませんでした。
                </div>
            ) : filteredShares.map((share) => {
                const event = events.find(e => e.id === share.eventId);
                const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/share/${share.shareToken}`;
                
                return (
                    <Card key={share.id} className="border-0 shadow-sm overflow-hidden card-hover">
                        <CardHeader className="bg-muted/30 py-3">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex flex-col gap-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                                        <h3 className="font-bold text-sm truncate">
                                            {event ? event.title : "不明な予定"}
                                        </h3>
                                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 shrink-0">
                                            {event ? event.type : "不明"}
                                        </Badge>
                                    </div>
                                    <div className="text-[10px] label-caps text-muted-foreground flex items-center gap-1.5">
                                        <Clock className="w-3 h-3" />
                                        作成: {format(new Date(share.createdAt), "yyyy/MM/dd HH:mm", { locale: ja })}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Badge variant="secondary" className="text-[10px] font-bold h-5 bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50">有効</Badge>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleDeleteShare(share.id)}
                                        className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 pb-4 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* URLコピー */}
                                <div className="space-y-1.5">
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
                                            className="gap-2 h-9 rounded-lg shrink-0"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                            <span className="text-xs font-bold">{copiedToken === share.shareToken ? "完了" : "コピー"}</span>
                                        </Button>
                                    </div>
                                </div>

                                {/* メッセージコピー */}
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold label-caps text-muted-foreground text-primary/70">共有用テンプレート</Label>
                                    <Button
                                        size="sm"
                                        variant={copiedMessage === share.shareToken ? "default" : "outline"}
                                        onClick={() => handleCopyShareMessage(share)}
                                        className="w-full gap-2 h-9 rounded-lg font-bold transition-all"
                                        disabled={!event}
                                    >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                        <span className="text-xs">{copiedMessage === share.shareToken ? "コピーしました" : "テンプレートをコピー"}</span>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
