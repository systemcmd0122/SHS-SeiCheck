"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Loader2,
    Send,
    ArrowLeft,
    AlertCircle,
    Copy,
    Download,
    Calendar,
    ChevronLeft,
    ChevronRight,
    X,
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
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
} from "date-fns";
import { ja } from "date-fns/locale";

interface PlanningChatPageProps {
    events: GoogleCalendarEvent[];
    backHref?: string;
}

// ─── イベント色パレット（カレンダー上で視覚的に分離） ───
const EVENT_COLORS = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-violet-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-cyan-500",
    "bg-orange-500",
    "bg-teal-500",
];

function getEventColor(title: string): string {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
        hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    return EVENT_COLORS[Math.abs(hash) % EVENT_COLORS.length];
}

export function PlanningChatPage({ events, backHref = "/admin" }: PlanningChatPageProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [initialized, setInitialized] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [calendarWidth, setCalendarWidth] = useState(320); // デフォルト 320px
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const isResizing = useRef(false);
    const startX = useRef(0);
    const startWidth = useRef(320);

    const MIN_CALENDAR_WIDTH = 240;
    const MAX_CALENDAR_WIDTH = 600;

    // ── リサイズハンドラー ──
    const handleResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        isResizing.current = true;
        startX.current = e.clientX;
        startWidth.current = calendarWidth;
        document.body.style.userSelect = "none";
        document.body.style.cursor = "col-resize";

        const handleMouseMove = (ev: MouseEvent) => {
            if (!isResizing.current) return;
            // 左方向にドラッグ＝幅増加なので反転
            const diff = startX.current - ev.clientX;
            const newWidth = Math.min(
                MAX_CALENDAR_WIDTH,
                Math.max(MIN_CALENDAR_WIDTH, startWidth.current + diff)
            );
            setCalendarWidth(newWidth);
        };

        const handleMouseUp = () => {
            isResizing.current = false;
            document.body.style.userSelect = "";
            document.body.style.cursor = "";
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    // ── 初期化 ──
    useEffect(() => {
        if (!initialized) {
            const initialMsg = generateInitialMessage(events);
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
    const handleSendMessage = async () => {
        if (!inputMessage.trim()) return;
        setErrorMessage("");

        const userMsg: ChatMessage = {
            role: "user",
            content: inputMessage,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInputMessage("");
        setIsLoading(true);

        try {
            const context: PlanningContext = {
                events,
                upcomingDays: 30,
            };

            const apiMessages = [...messages, userMsg].filter(
                (msg) => msg.content !== generateInitialMessage(events)
            );

            const response = await sendMessageToGemini(
                inputMessage,
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
        element.setAttribute("download", `chat_${new Date().getTime()}.txt`);
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

    // ── カレンダー計算 ──
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const weeks: (Date | null)[][] = [];
    let week: (Date | null)[] = [];
    for (let i = 0; i < monthStart.getDay(); i++) week.push(null);
    daysInMonth.forEach((day) => {
        if (week.length === 7) {
            weeks.push(week);
            week = [];
        }
        week.push(day);
    });
    while (week.length < 7) week.push(null);
    weeks.push(week);

    const getEventsForDate = (date: Date | null): GoogleCalendarEvent[] => {
        if (!date) return [];
        const dStr = format(date, "yyyy-MM-dd");
        return events.filter((e) => {
            try {
                if (!e.startTime) return false;
                return format(new Date(e.startTime), "yyyy-MM-dd") === dStr;
            } catch {
                return false;
            }
        });
    };

    // 選択日のイベント
    const selectedDayEvents = selectedDate ? getEventsForDate(selectedDate) : [];

    // ── UI ──
    return (
        <div className="flex h-screen bg-white dark:bg-slate-900 overflow-hidden">
            {/* ════════════════════════════════════════════
          左側：チャットエリア
          ════════════════════════════════════════════ */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* ── ヘッダー ── */}
                <header className="border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 sm:px-6 py-3 shrink-0">
                    <div className="flex items-center justify-between gap-2">
                        {/* 左側: タイトル */}
                        <div className="flex items-center gap-2 min-w-0">
                            <Link href={backHref}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 shrink-0"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                            </Link>
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center shrink-0 overflow-hidden">
                                <img
                                    src="/ai_icon.png"
                                    alt="AI"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                                予定計画アシスタント
                            </h1>
                        </div>

                        {/* 右側: アクションボタン */}
                        <div className="flex items-center gap-1 shrink-0">
                            {/* カレンダートグgle */}
                            <Button
                                onClick={() => setShowCalendar(!showCalendar)}
                                variant={showCalendar ? "default" : "ghost"}
                                size="sm"
                                className={`
                  transition-all duration-200
                  ${showCalendar
                                        ? "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800"
                                    }
                `}
                            >
                                <Calendar className="w-4 h-4" />
                                <span className="hidden sm:inline ml-1.5 text-sm">
                                    カレンダー
                                </span>
                            </Button>

                            {/* コピー */}
                            <Button
                                onClick={copyChat}
                                disabled={messages.length === 0}
                                variant="ghost"
                                size="sm"
                                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-40"
                            >
                                <Copy className="w-4 h-4" />
                                <span className="hidden md:inline ml-1.5 text-sm">コピー</span>
                            </Button>

                            {/* エクスポート */}
                            <Button
                                onClick={exportChat}
                                disabled={messages.length === 0}
                                variant="ghost"
                                size="sm"
                                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-40"
                            >
                                <Download className="w-4 h-4" />
                                <span className="hidden md:inline ml-1.5 text-sm">
                                    エクスポート
                                </span>
                            </Button>
                        </div>
                    </div>
                </header>

                {/* ── チャットメッセージ ── */}
                <ScrollArea className="flex-1 overflow-hidden">
                    <div className="px-3 sm:px-4 py-3 space-y-3">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
                                    }`}
                            >
                                <div
                                    className={`
                    max-w-[85%] sm:max-w-lg lg:max-w-2xl
                    px-3 py-2 rounded-lg text-sm
                    ${msg.role === "user"
                                            ? "bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white shadow-sm rounded-br-none"
                                            : "bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 shadow-sm rounded-bl-none border border-gray-200 dark:border-slate-700"
                                        }
                  `}
                                >
                                    {msg.role === "assistant" ? (
                                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:m-0 prose-p:mb-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-strong:font-semibold">
                                            <ReactMarkdown
                                                components={{
                                                    p: ({ ...props }) => (
                                                        <p
                                                            className="mb-2 last:mb-0 leading-relaxed text-sm"
                                                            {...props}
                                                        />
                                                    ),
                                                    ul: ({ ...props }) => (
                                                        <ul
                                                            className="list-disc list-inside my-2 space-y-1 text-sm"
                                                            {...props}
                                                        />
                                                    ),
                                                    ol: ({ ...props }) => (
                                                        <ol
                                                            className="list-decimal list-inside my-2 space-y-1 text-sm"
                                                            {...props}
                                                        />
                                                    ),
                                                    li: ({ ...props }) => (
                                                        <li className="text-sm leading-relaxed" {...props} />
                                                    ),
                                                    strong: ({ ...props }) => (
                                                        <strong className="font-bold" {...props} />
                                                    ),
                                                    em: ({ ...props }) => (
                                                        <em className="italic" {...props} />
                                                    ),
                                                    h1: ({ ...props }) => (
                                                        <h1
                                                            className="font-bold text-lg my-3 mt-4 first:mt-0"
                                                            {...props}
                                                        />
                                                    ),
                                                    h2: ({ ...props }) => (
                                                        <h2
                                                            className="font-bold text-base my-2 mt-3 first:mt-0"
                                                            {...props}
                                                        />
                                                    ),
                                                    h3: ({ ...props }) => (
                                                        <h3
                                                            className="font-semibold text-sm my-1.5 mt-2 first:mt-0"
                                                            {...props}
                                                        />
                                                    ),
                                                    code: ({ ...props }) => (
                                                        <code
                                                            className="bg-gray-200 dark:bg-slate-700 rounded px-1.5 py-0.5 text-xs font-mono"
                                                            {...props}
                                                        />
                                                    ),
                                                    pre: ({ ...props }) => (
                                                        <pre
                                                            className="bg-gray-200 dark:bg-slate-700 rounded-lg p-3 my-2 overflow-x-auto"
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
                                    <p
                                        className={`text-xs mt-2 ${msg.role === "user"
                                            ? "text-blue-100 dark:text-blue-200"
                                            : "text-gray-400 dark:text-gray-500"
                                            }`}
                                    >
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
                                <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl rounded-bl-none px-4 py-3 border border-gray-200 dark:border-slate-700 shadow-sm">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 bg-gray-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <span className="w-2 h-2 bg-gray-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <span className="w-2 h-2 bg-gray-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                {/* ── エラーAlert ── */}
                {errorMessage && (
                    <div className="px-3 sm:px-4 py-1.5 shrink-0">
                        <Alert
                            variant="destructive"
                            className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 py-2 px-3"
                        >
                            <AlertCircle className="h-3.5 w-3.5 text-red-500 dark:text-red-400 flex-shrink-0" />
                            <AlertDescription className="text-red-600 dark:text-red-300 text-xs ml-1">
                                {errorMessage}
                            </AlertDescription>
                        </Alert>
                    </div>
                )}

                {/* ── 入力エリア ── */}
                <div className="border-t border-gray-200 dark:border-slate-700 px-3 sm:px-4 py-2 bg-white dark:bg-slate-900 shrink-0">
                    <div className="flex items-end gap-2">
                        <Textarea
                            placeholder="予定について質問やアドバイスを求めてください… (Ctrl+Enter で送信)"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isLoading}
                            className="resize-none text-sm bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent"
                            style={{ minHeight: "60px", maxHeight: "150px" }}
                        />
                        <Button
                            onClick={handleSendMessage}
                            disabled={isLoading || !inputMessage.trim()}
                            className="shrink-0 w-10 h-10 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            size="icon"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* ════════════════════════════════════════════
          右側：カレンダーサイドバー（オーバーレイ）
          ════════════════════════════════════════════ */}
            {/* モバイル用ダークオーバーレイ */}
            {showCalendar && (
                <div
                    className="fixed inset-0 bg-black/30 z-20 lg:hidden"
                    onClick={() => setShowCalendar(false)}
                />
            )}

            {/* カレンダーパネル */}
            <div
                className={`
          fixed lg:relative
          inset-y-0 right-0
          bg-white dark:bg-slate-900
          border-l border-gray-200 dark:border-slate-700
          shadow-xl lg:shadow-none
          z-30 lg:z-0
          flex flex-col
          overflow-hidden
          transition-all duration-300 ease-out
          ${showCalendar ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
        `}
                style={{
                    width: showCalendar ? (typeof window !== "undefined" && window.innerWidth < 1024 ? undefined : calendarWidth) : 0,
                    minWidth: showCalendar && typeof window !== "undefined" && window.innerWidth >= 1024 ? calendarWidth : undefined,
                }}
            >
                {/* リサイズハンドル（lg以上のみ） */}
                <div
                    className="hidden lg:block absolute inset-y-0 left-0 w-1.5 cursor-col-resize z-10 group"
                    onMouseDown={handleResizeStart}
                >
                    <div className="h-full w-full group-hover:bg-blue-400 dark:group-hover:bg-blue-600 transition-colors rounded-r" />
                </div>
                {/* ── カレンダーヘッダー ── */}
                <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {format(currentDate, "yyyy年M月", { locale: ja })}
                        </h2>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() =>
                                    setCurrentDate(
                                        new Date(
                                            currentDate.getFullYear(),
                                            currentDate.getMonth() - 1
                                        )
                                    )
                                }
                                className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() =>
                                    setCurrentDate(
                                        new Date(
                                            currentDate.getFullYear(),
                                            currentDate.getMonth() + 1
                                        )
                                    )
                                }
                                className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            {/* モバイル用閉じるボタン */}
                            <button
                                onClick={() => setShowCalendar(false)}
                                className="lg:hidden ml-1 p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* 曜日行 */}
                    <div className="grid grid-cols-7 gap-1">
                        {["日", "月", "火", "水", "木", "金", "土"].map((day, i) => (
                            <div
                                key={day}
                                className={`text-center text-xs font-medium py-1.5 rounded ${i === 0
                                    ? "text-red-400 dark:text-red-500"
                                    : i === 6
                                        ? "text-blue-400 dark:text-blue-500"
                                        : "text-gray-400 dark:text-gray-500"
                                    }`}
                            >
                                {day}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── カレンダーグリッド ── */}
                <div className="px-3 py-2 shrink-0">
                    {weeks.map((weekDays, weekIdx) => (
                        <div key={weekIdx} className="grid grid-cols-7 gap-1 mb-1">
                            {weekDays.map((day, dayIdx) => {
                                const dayEvents = getEventsForDate(day);
                                const isToday = day && isSameDay(day, new Date());
                                const isSelected = day && selectedDate && isSameDay(day, selectedDate);
                                const hasEvents = dayEvents.length > 0;

                                return (
                                    <button
                                        key={dayIdx}
                                        onClick={() => day && setSelectedDate(day)}
                                        disabled={!day}
                                        className={`
                      relative w-full aspect-square flex flex-col items-center justify-center rounded-lg text-xs
                      transition-all duration-150
                      ${!day ? "cursor-default" : "cursor-pointer"}
                      ${isSelected
                                                ? "bg-blue-500 dark:bg-blue-600 text-white shadow-sm"
                                                : isToday
                                                    ? "bg-blue-50 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-semibold"
                                                    : day
                                                        ? "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                                                        : ""
                                            }
                    `}
                                    >
                                        {day && (
                                            <>
                                                <span className="text-xs font-medium leading-none">
                                                    {format(day, "d")}
                                                </span>
                                                {/* イベント存在インディケーター */}
                                                {hasEvents && (
                                                    <div className="flex gap-0.5 mt-0.5">
                                                        {dayEvents.slice(0, 3).map((ev, i) => (
                                                            <span
                                                                key={i}
                                                                className={`w-1.5 h-1.5 rounded-full ${isSelected
                                                                    ? "bg-white/70"
                                                                    : getEventColor(ev.title)
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* ── 選択日のイベント一覧 ── */}
                <div className="border-t border-gray-200 dark:border-slate-700 flex-1 overflow-y-auto">
                    <div className="px-4 py-3">
                        {/* 選択日タイトル */}
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {selectedDate
                                    ? format(selectedDate, "M月d日 (EEE)", { locale: ja })
                                    : "日付を選択してください"}
                            </h3>
                            {selectedDate && (
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                    {selectedDayEvents.length}件
                                </span>
                            )}
                        </div>

                        {/* イベントリスト */}
                        {selectedDate && selectedDayEvents.length > 0 ? (
                            <div className="space-y-2">
                                {selectedDayEvents.map((event, idx) => {
                                    const colorClass = getEventColor(event.title);
                                    return (
                                        <div
                                            key={idx}
                                            className="flex items-start gap-2.5 p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700"
                                        >
                                            {/* カラードット */}
                                            <span
                                                className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${colorClass}`}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                    {event.title}
                                                </p>
                                                {(() => {
                                                    if (!event.startTime) return null;
                                                    const startDate = new Date(event.startTime);
                                                    const startHH = startDate.getHours();
                                                    const startMM = startDate.getMinutes();
                                                    const isAllDay =
                                                        startHH === 0 &&
                                                        startMM === 0 &&
                                                        (!event.endTime ||
                                                            (() => {
                                                                const endDate = new Date(event.endTime);
                                                                return endDate.getHours() === 0 && endDate.getMinutes() === 0;
                                                            })());
                                                    if (isAllDay) return null;
                                                    return (
                                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                                            {format(startDate, "HH:mm", { locale: ja })}
                                                            {event.endTime &&
                                                                ` – ${format(new Date(event.endTime), "HH:mm", { locale: ja })}`}
                                                        </p>
                                                    );
                                                })()}
                                                {event.location && (
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                                                        📍 {event.location}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : selectedDate ? (
                            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
                                この日に予定はありません
                            </p>
                        ) : (
                            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
                                カレンダーの日付をタップして
                                <br />
                                その日の予定を確認できます
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}