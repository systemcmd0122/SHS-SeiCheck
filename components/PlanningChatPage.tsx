"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Send,
    ArrowLeft,
    Calendar,
    ChevronLeft,
    ChevronRight,
    X,
    Plus,
} from "lucide-react";
import { GoogleCalendarEvent } from "@/lib/google-calendar";
import {
    ChatMessage,
    PlanningContext,
    sendMessageToGemini,
    generateInitialMessage,
} from "@/lib/gemini-chat";
import { createEvent, updateEvent } from "@/lib/db";
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
import { cn } from "@/lib/utils";

interface PlanningChatPageProps {
    events: GoogleCalendarEvent[];
    backHref?: string;
}

interface AddEventFormData {
    title: string;
    description: string;
    date: string;
}

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
    for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
    return EVENT_COLORS[Math.abs(hash) % EVENT_COLORS.length];
}

export function PlanningChatPage({ events, backHref = "/admin" }: PlanningChatPageProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [initialized, setInitialized] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showAddEventDialog, setShowAddEventDialog] = useState(false);
    const [editingEvent, setEditingEvent] = useState<any>(null);
    const [formData, setFormData] = useState<AddEventFormData>({ title: "", description: "", date: "" });
    const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
    const [dbEvents, setDbEvents] = useState<any[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!initialized) {
            const combinedEvents = [...events, ...dbEvents.map((e: any) => ({
                id: e.id, title: e.title, description: e.description || "",
                startTime: e.dateTime.split('T')[0] + 'T00:00:00',
                endTime: e.deadline.split('T')[0] + 'T23:59:00',
                location: "",
            }))];
            const todayStr = format(new Date(), "yyyy年M月d日", { locale: ja });
            setMessages([{ role: "assistant", content: generateInitialMessage(combinedEvents) + `\n\n**本日は ${todayStr} です。**`, timestamp: new Date() }]);
            setInitialized(true);
        }
    }, [events, dbEvents, initialized]);

    useEffect(() => {
        fetch("/api/events").then(r => r.json()).then(d => { if (d.success) setDbEvents(d.data); });
    }, []);

    useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    const handleSendMessage = async () => {
        if (!inputMessage.trim()) return;
        const userMsg: ChatMessage = { role: "user", content: inputMessage, timestamp: new Date() };
        setMessages(p => [...p, userMsg]);
        setInputMessage("");
        setIsLoading(true);
        try {
            const context: PlanningContext = {
                events: [...events, ...dbEvents.map((e: any) => ({ id: e.id, title: e.title, description: e.description || "", startTime: e.dateTime.split('T')[0] + 'T00:00:00', endTime: e.deadline.split('T')[0] + 'T23:59:00', location: "" }))],
                upcomingDays: 30,
            };
            const res = await sendMessageToGemini(`【本日: ${format(new Date(), "yyyy年M月d日", { locale: ja })}】\n\n${inputMessage}`, messages.filter(m=>m.role!=="assistant"||!m.content.includes("計画アシスタント")), context);
            setMessages(p => [...p, { role: "assistant", content: res || "AIからの応答がありません。", timestamp: new Date() }]);
        } catch (e: any) {
            setErrorMessage(e.message);
            setMessages(p => [...p, { role: "assistant", content: "エラーが発生しました。", timestamp: new Date() }]);
        } finally { setIsLoading(false); }
    };

    const handleSaveEvent = async () => {
        if (!formData.title.trim() || !formData.date) return;
        setIsSubmittingEvent(true);
        try {
            const d = { title: formData.title, description: formData.description, dateTime: `${formData.date}T00:00:00`, deadline: `${formData.date}T23:59:00` };
            if (editingEvent) await updateEvent(editingEvent.id, d);
            else await createEvent({ ...d, type: "その他", createdBy: "admin", isAttendanceRequired: false });
            fetch("/api/events").then(r => r.json()).then(d => { if (d.success) setDbEvents(d.data); });
            setShowAddEventDialog(false);
        } finally { setIsSubmittingEvent(false); }
    };

    const monthStart = startOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: endOfMonth(currentDate) });
    const weeks: (Date | null)[][] = [];
    let week: (Date | null)[] = Array(monthStart.getDay()).fill(null);
    days.forEach(d => { if (week.length === 7) { weeks.push(week); week = []; } week.push(d); });
    while (week.length < 7) week.push(null);
    weeks.push(week);

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0">
                <header className="border-b bg-background px-4 py-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                        <Link href={backHref}><Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="w-4 h-4" /></Button></Link>
                        <h1 className="font-bold text-sm sm:text-base truncate">予定計画アシスタント</h1>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button onClick={() => setShowCalendar(!showCalendar)} variant={showCalendar ? "default" : "ghost"} size="sm" className="h-8"><Calendar className="w-3.5 h-3.5 mr-1" /><span className="text-xs">カレンダー</span></Button>
                        <Button onClick={() => { navigator.clipboard.writeText(messages.map(m=>m.content).join("\n\n")); alert("コピーしました"); }} size="sm" variant="ghost" className="h-8 text-xs">コピー</Button>
                    </div>
                </header>
                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-4">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[90%] p-3 rounded-lg text-sm border ${m.role === "user" ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border"}`}>
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <ReactMarkdown>{m.content}</ReactMarkdown>
                                    </div>
                                    <div className="text-[10px] mt-1 opacity-60 text-right">{format(m.timestamp!, "HH:mm")}</div>
                                </div>
                            </div>
                        ))}
                        {isLoading && <div className="flex justify-start"><div className="bg-muted p-3 rounded-lg border flex gap-1"><div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-pulse" /><div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-pulse" style={{animationDelay:"200ms"}} /><div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-pulse" style={{animationDelay:"400ms"}} /></div></div>}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>
                {errorMessage && <Alert variant="destructive" className="mx-4 mb-2 py-2"><AlertDescription className="text-xs">{errorMessage}</AlertDescription></Alert>}
                <div className="p-3 border-t bg-background flex gap-2 items-end">
                    <Textarea placeholder="予定について質問してください..." value={inputMessage} onChange={e=>setInputMessage(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&e.ctrlKey)handleSendMessage()}} className="min-h-[40px] max-h-[120px] text-sm" />
                    <Button onClick={handleSendMessage} disabled={isLoading||!inputMessage.trim()} size="icon" className="h-10 w-10 shrink-0"><Send className="w-4 h-4" /></Button>
                </div>
            </div>

            {showCalendar && (
                <div className="w-80 border-l bg-background flex flex-col shrink-0">
                    <header className="p-3 border-b flex items-center justify-between">
                        <span className="font-bold text-xs">{format(currentDate, "yyyy年M月", { locale: ja })}</span>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={()=>setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()-1))}><ChevronLeft className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={()=>setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()+1))}><ChevronRight className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 lg:hidden" onClick={()=>setShowCalendar(false)}><X className="w-4 h-4" /></Button>
                        </div>
                    </header>
                    <div className="p-2 grid grid-cols-7 text-center text-[10px] font-bold text-muted-foreground">{["日","月","火","水","木","金","土"].map(d=><div key={d} className="py-1">{d}</div>)}</div>
                    <ScrollArea className="flex-1">
                        <div className="p-2">
                            {weeks.map((w, wi) => (
                                <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
                                    {w.map((d, di) => (
                                        <button key={di} onClick={() => d && setSelectedDate(d)} disabled={!d} className={cn("aspect-square rounded flex items-center justify-center text-xs transition-colors", !d ? "opacity-0" : isSameDay(d, selectedDate||new Date(-1)) ? "bg-primary text-primary-foreground" : isSameDay(d, new Date()) ? "bg-primary/10 font-bold border border-primary/20" : "hover:bg-muted")}>
                                            {d ? format(d, "d") : ""}
                                        </button>
                                    ))}
                                </div>
                            ))}
                        </div>
                        {selectedDate && (
                            <div className="p-3 border-t space-y-2">
                                <div className="flex justify-between items-center"><span className="text-[10px] font-bold uppercase">{format(selectedDate, "M/d (EEE)", { locale: ja })}</span><Button variant="ghost" size="icon" className="h-6 w-6" onClick={()=>{setEditingEvent(null); setFormData({title:"",description:"",date:format(selectedDate,"yyyy-MM-dd")}); setShowAddEventDialog(true);}}><Plus className="w-3 h-3" /></Button></div>
                                {[...events.filter(e=>e.startTime&&isSameDay(new Date(e.startTime),selectedDate)), ...dbEvents.filter(e=>isSameDay(new Date(e.dateTime),selectedDate))].map((e,i) => (
                                    <div key={i} className="p-2 rounded border bg-muted/50 text-[10px] flex gap-2 items-start"><div className={cn("w-1.5 h-1.5 rounded-full mt-1 shrink-0", getEventColor(e.title))} /><div className="flex-1 min-w-0 font-bold truncate">{e.title}</div></div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>
            )}

            <Dialog open={showAddEventDialog} onOpenChange={setShowAddEventDialog}>
                <DialogContent className="w-[95vw] sm:max-w-md p-6">
                    <DialogHeader><DialogTitle>{editingEvent?"編集":"追加"}</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1"><Label className="text-xs">タイトル</Label><Input value={formData.title} onChange={e=>setFormData({...formData,title:e.target.value})} /></div>
                        <div className="space-y-1"><Label className="text-xs">日付</Label><Input type="date" value={formData.date} onChange={e=>setFormData({...formData,date:e.target.value})} /></div>
                    </div>
                    <DialogFooter><Button variant="outline" onClick={()=>setShowAddEventDialog(false)}>キャンセル</Button><Button onClick={handleSaveEvent} disabled={isSubmittingEvent}>保存</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
