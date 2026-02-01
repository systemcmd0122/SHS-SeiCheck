"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Loader2,
    Send,
    AlertCircle,
    Copy,
    Download,
    Sparkles,
    Clock,
} from "lucide-react";
import { GoogleCalendarEvent } from "@/lib/google-calendar";
import {
    ChatMessage,
    PlanningContext,
    sendMessageToGemini,
    generateInitialMessage,
} from "@/lib/gemini-chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";

interface TeacherChatPanelProps {
    events: GoogleCalendarEvent[];
}

export function TeacherChatPanel({ events }: TeacherChatPanelProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [initialized, setInitialized] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // ── 初期化 ──
    useEffect(() => {
        if (!initialized) {
            console.log("TeacherChatPanel - Initializing with events:", events);
            const initialMsg = generateInitialMessage(events && Array.isArray(events) ? events : []);
            setMessages([
                {
                    role: "assistant",
                    content: initialMsg,
                    timestamp: new Date(),
                },
            ]);
            setInitialized(true);
        }
    }, [events, initialized]);

    // ── 自動スクロール ──
    useEffect(() => {
        setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    }, [messages]);

    // ── メッセージ送信 ──
    const handleSendMessage = async (text?: string) => {
        const messageToSend = text || inputMessage;
        if (!messageToSend.trim()) return;
        setErrorMessage("");

        const userMsg: ChatMessage = {
            role: "user",
            content: messageToSend,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInputMessage("");
        setIsLoading(true);

        try {
            const context: PlanningContext = {
                events: events && Array.isArray(events) ? events : [],
                upcomingDays: 30,
            };

            const apiMessages = [...messages, userMsg].filter(
                (msg) => msg.content !== generateInitialMessage(events && Array.isArray(events) ? events : [])
            );

            const response = await sendMessageToGemini(
                messageToSend,
                apiMessages,
                context
            );

            if (!response || response.trim() === "") {
                throw new Error("AIからの応答が空です。もう一度お試しください。");
            }

            const assistantMsg: ChatMessage = {
                role: "assistant",
                content: response,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMsg]);
        } catch (error) {
            const err = error as Error;
            const errorMsg = err?.message || "不明なエラーが発生しました";
            console.error("Gemini API エラー:", errorMsg);
            setErrorMessage(errorMsg);

            const errorChatMsg: ChatMessage = {
                role: "assistant",
                content: `申し訳ありません。エラーが発生しました:\n\n${errorMsg}`,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, errorChatMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && e.ctrlKey) {
            handleSendMessage();
        }
    };

    // ── エクスポート・コピー ──
    const formatChatText = () =>
        messages
            .map((msg) => {
                const time = msg.timestamp?.toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                });
                const role = msg.role === "user" ? "あなた" : "AI";
                return `[${time}] ${role}:\n${msg.content}`;
            })
            .join("\n\n---\n\n");

    const exportChat = () => {
        const element = document.createElement("a");
        element.setAttribute(
            "href",
            "data:text/plain;charset=utf-8," + encodeURIComponent(formatChatText())
        );
        element.setAttribute("download", `teacher_chat_${new Date().getTime()}.txt`);
        element.style.display = "none";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const copyChat = () => {
        navigator.clipboard.writeText(formatChatText()).then(() => {
            alert("チャット履歴をコピーしました");
        });
    };

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-background to-background/80 rounded-lg border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* ── ヘッダー ── */}
            <div className="border-b border-border px-4 py-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-600/20 dark:to-purple-600/20 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-sm font-semibold text-foreground truncate">日程計画AI</h2>
                        <p className="text-xs text-muted-foreground">予定をスマートに管理</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <Button
                        onClick={copyChat}
                        disabled={messages.length <= 1}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-accent disabled:opacity-50"
                        title="チャットをコピー"
                    >
                        <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                        onClick={exportChat}
                        disabled={messages.length <= 1}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-accent disabled:opacity-50"
                        title="ダウンロード"
                    >
                        <Download className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* ── チャットメッセージ ── */}
            <ScrollArea className="flex-1 overflow-hidden">
                <div className="px-3 py-4 space-y-3 h-full">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            style={{
                                animation: `fadeIn 0.3s ease-in-out`,
                            }}
                        >
                            <style>{`
                                @keyframes fadeIn {
                                    from {
                                        opacity: 0;
                                        transform: translateY(8px);
                                    }
                                    to {
                                        opacity: 1;
                                        transform: translateY(0);
                                    }
                                }
                            `}</style>
                            <div
                                className={`
                                    max-w-[85%] px-4 py-2.5 rounded-lg text-sm
                                    ${msg.role === "user"
                                        ? "bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white rounded-br-none shadow-sm"
                                        : "bg-card border border-border text-foreground rounded-bl-none shadow-sm"
                                    }
                                `}
                            >
                                {msg.role === "assistant" ? (
                                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:m-0 prose-p:mb-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-strong:font-semibold">
                                        <ReactMarkdown
                                            components={{
                                                p: ({ ...props }) => (
                                                    <p
                                                        className="mb-1.5 last:mb-0 leading-relaxed text-sm"
                                                        {...props}
                                                    />
                                                ),
                                                ul: ({ ...props }) => (
                                                    <ul
                                                        className="list-disc list-inside my-1.5 space-y-0.5 text-sm"
                                                        {...props}
                                                    />
                                                ),
                                                ol: ({ ...props }) => (
                                                    <ol
                                                        className="list-decimal list-inside my-1.5 space-y-0.5 text-sm"
                                                        {...props}
                                                    />
                                                ),
                                                li: ({ ...props }) => (
                                                    <li className="text-sm leading-relaxed ml-2" {...props} />
                                                ),
                                                strong: ({ ...props }) => (
                                                    <strong className="font-bold" {...props} />
                                                ),
                                                em: ({ ...props }) => (
                                                    <em className="italic" {...props} />
                                                ),
                                                h1: ({ ...props }) => (
                                                    <h1
                                                        className="font-bold text-lg my-1.5 mt-2 first:mt-0 text-foreground"
                                                        {...props}
                                                    />
                                                ),
                                                h2: ({ ...props }) => (
                                                    <h2
                                                        className="font-bold text-base my-1.5 mt-2 first:mt-0 text-foreground"
                                                        {...props}
                                                    />
                                                ),
                                                h3: ({ ...props }) => (
                                                    <h3
                                                        className="font-semibold text-sm my-1 mt-1.5 first:mt-0 text-foreground"
                                                        {...props}
                                                    />
                                                ),
                                                h4: ({ ...props }) => (
                                                    <h4
                                                        className="font-medium text-sm my-1 mt-1 first:mt-0 text-foreground"
                                                        {...props}
                                                    />
                                                ),
                                                code: (props: any) => {
                                                    const { inline, ...rest } = props;
                                                    return (
                                                        <code
                                                            className="bg-secondary/70 rounded px-1.5 py-0.5 text-xs font-mono text-foreground"
                                                            {...rest}
                                                        />
                                                    );
                                                },
                                                pre: ({ ...props }) => (
                                                    <pre
                                                        className="bg-secondary/50 border border-border rounded-lg p-2 my-1.5 overflow-x-auto text-xs"
                                                        {...props}
                                                    />
                                                ),
                                                blockquote: ({ ...props }) => (
                                                    <blockquote
                                                        className="border-l-4 border-blue-500 dark:border-blue-400 pl-3 py-1 my-1.5 text-sm italic opacity-80"
                                                        {...props}
                                                    />
                                                ),
                                                hr: ({ ...props }) => (
                                                    <hr
                                                        className="my-2 border-border"
                                                        {...props}
                                                    />
                                                ),
                                                table: ({ ...props }) => (
                                                    <div className="overflow-x-auto my-1.5">
                                                        <table
                                                            className="text-xs border-collapse border border-border"
                                                            {...props}
                                                        />
                                                    </div>
                                                ),
                                                thead: ({ ...props }) => (
                                                    <thead className="bg-secondary/50" {...props} />
                                                ),
                                                th: ({ ...props }) => (
                                                    <th className="border border-border px-2 py-1 text-left font-semibold" {...props} />
                                                ),
                                                td: ({ ...props }) => (
                                                    <td className="border border-border px-2 py-1" {...props} />
                                                ),
                                                a: ({ ...props }) => (
                                                    <a
                                                        className="text-blue-500 dark:text-blue-400 hover:underline"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        {...props}
                                                    />
                                                ),
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <p className="whitespace-pre-wrap leading-relaxed text-sm">
                                        {msg.content}
                                    </p>
                                )}
                                <p className={`text-xs mt-1.5 flex items-center gap-1 ${msg.role === "user" ? "text-blue-100 dark:text-blue-200" : "text-muted-foreground"}`}>
                                    <Clock className="w-3 h-3" />
                                    {msg.timestamp?.toLocaleTimeString("ja-JP", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                            </div>
                        </div>
                    ))}

                    {/* AI thinking indicator */}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-card border border-border rounded-lg rounded-bl-none px-4 py-3 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1">
                                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                    <span className="text-xs text-muted-foreground">考え中...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* ── エラーAlert ── */}
            {errorMessage && (
                <div className="px-3 py-2 shrink-0 border-t border-border bg-destructive/10">
                    <Alert
                        variant="destructive"
                        className="py-2 px-3"
                    >
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs ml-2">
                            {errorMessage}
                        </AlertDescription>
                    </Alert>
                </div>
            )}

            {/* ── 入力エリア ── */}
            <div className="border-t border-border px-3 py-3 bg-card shrink-0 space-y-2">
                <div className="flex items-end gap-2">
                    <Textarea
                        placeholder="予定について質問してください..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                        className="resize-none text-sm flex-1"
                        style={{ minHeight: "40px", maxHeight: "100px" }}
                    />
                    <Button
                        onClick={() => handleSendMessage()}
                        disabled={isLoading || !inputMessage.trim()}
                        className="shrink-0 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800"
                        size="icon"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                    💡 Ctrl+Enterで送信
                </p>
            </div>
        </div>
    );
}