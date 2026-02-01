"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Copy, Check, AlertCircle } from "lucide-react";
import { GoogleCalendarEvent } from "@/lib/google-calendar";
import { quickCopyEvents } from "@/lib/classroom-copy";

interface ClassroomCopyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    events: GoogleCalendarEvent[];
}

export function ClassroomCopyDialog({
    open,
    onOpenChange,
    events,
}: ClassroomCopyDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string>("");

    const handleCopy = async () => {
        setIsLoading(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            await quickCopyEvents(events);
            setSuccessMessage(
                `${events.length}件の予定をクリップボードにコピーしました！\nGoogle Classroomに貼り付けてください。`
            );
            setTimeout(() => {
                onOpenChange(false);
                setSuccessMessage("");
            }, 3000);
        } catch (error) {
            const err = error as Error;
            setErrorMessage(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Copy className="w-5 h-5" />
                        Google Classroomに共有
                    </DialogTitle>
                    <DialogDescription>
                        {events.length}件の予定をクリップボードにコピーしてクラスに貼り付けます
                    </DialogDescription>
                </DialogHeader>

                {successMessage && (
                    <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <AlertDescription className="text-green-700 dark:text-green-300 whitespace-pre-line">
                            {successMessage}
                        </AlertDescription>
                    </Alert>
                )}

                {errorMessage && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                )}

                {/* プレビュー */}
                <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">
                        コピーされる内容:
                    </p>
                    <div className="bg-muted/50 rounded-lg p-3 max-h-48 overflow-y-auto font-mono text-xs space-y-2 border border-muted">
                        {events.map((event, idx) => (
                            <div
                                key={event.id}
                                className="pb-2 border-b border-muted/40 last:border-b-0"
                            >
                                <p className="font-semibold text-foreground">
                                    【{idx + 1}】 {event.title}
                                </p>
                                <p className="text-muted-foreground">
                                    {new Date(event.startTime).toLocaleString("ja-JP")}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        💡 <strong>使い方:</strong>
                    </p>
                    <ol className="text-xs text-blue-600 dark:text-blue-400 list-decimal list-inside mt-1 space-y-1">
                        <li>「クリップボードにコピー」をクリック</li>
                        <li>Google Classroomを開く</li>
                        <li>投稿欄に貼り付ける</li>
                    </ol>
                </div>

                <DialogFooter className="flex gap-2">
                    <DialogClose asChild>
                        <Button
                            variant="outline"
                            disabled={isLoading}
                        >
                            キャンセル
                        </Button>
                    </DialogClose>
                    <Button
                        onClick={handleCopy}
                        disabled={isLoading || events.length === 0}
                    >
                        {isLoading && (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        {isLoading ? "コピー中..." : "クリップボードにコピー"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
