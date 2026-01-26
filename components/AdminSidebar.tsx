"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Menu,
    Home,
    Bell,
    Calendar,
    Users,
    TrendingUp,
    History,
    ListTodo,
    Download,
    Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface MenuItem {
    id?: string;
    label?: string;
    icon?: React.ReactNode;
    action?: () => void;
    href?: string;
    external?: boolean;
    divider?: boolean;
}

interface AdminSidebarProps {
    activeTab?: string;
    onTabChange?: (tabId: string) => void;
    onExportCSV?: () => void;
    onCreateAnnouncement?: () => void;
    onCreateEvent?: () => void;
    onTabChangeWithScroll?: (tabId: string) => void;
}

export function AdminSidebar({
    activeTab = "announcements",
    onTabChange,
    onExportCSV,
    onCreateAnnouncement,
    onCreateEvent,
    onTabChangeWithScroll,
}: AdminSidebarProps) {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const menuItems: MenuItem[] = [
        {
            id: "announcements",
            label: "お知らせ管理",
            icon: <Bell className="w-4 h-4" />,
        },
        {
            id: "calendar",
            label: "カレンダー",
            icon: <Calendar className="w-4 h-4" />,
        },
        {
            id: "events",
            label: "予定一覧",
            icon: <Calendar className="w-4 h-4" />,
        },
        {
            id: "matrix",
            label: "マトリクス",
            icon: <Users className="w-4 h-4" />,
        },
        {
            id: "history",
            label: "履歴",
            icon: <History className="w-4 h-4" />,
        },
        { divider: true },
        {
            id: "export",
            label: "CSVエクスポート",
            icon: <Download className="w-4 h-4" />,
            action: onExportCSV,
        },
        {
            id: "create-announcement",
            label: "お知らせ作成",
            icon: <Plus className="w-4 h-4" />,
            action: onCreateAnnouncement,
        },
        {
            id: "create-event",
            label: "予定作成",
            icon: <Plus className="w-4 h-4" />,
            action: onCreateEvent,
        },
        { divider: true },
        {
            id: "temp-events",
            label: "今日することリスト",
            icon: <ListTodo className="w-4 h-4" />,
            href: "/admin/events",
        },
        { divider: true },
        {
            id: "home",
            label: "ホームに戻る",
            icon: <Home className="w-4 h-4" />,
            href: "/",
        },
    ];

    const handleMenuItemClick = (item: MenuItem) => {
        if (item.href) {
            router.push(item.href);
        } else if (item.action) {
            item.action();
        } else if (item.id && !item.divider) {
            if (onTabChangeWithScroll) {
                onTabChangeWithScroll(item.id);
            } else if (onTabChange) {
                onTabChange(item.id);
            }
        }
        setOpen(false);
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    aria-label="メニューを開く"
                >
                    <Menu className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
                <div className="flex flex-col h-full">
                    {/* タイトル（アクセシビリティ用） */}
                    <SheetTitle className="sr-only">
                        管理メニュー
                    </SheetTitle>

                    {/* ヘッダー */}
                    <div className="p-6 border-b">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                                <Users className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">管理メニュー</h2>
                                <p className="text-xs text-muted-foreground">出欠管理</p>
                            </div>
                        </div>
                    </div>

                    {/* スクロール可能なメニューエリア */}
                    <nav className="flex-1 overflow-y-auto">
                        <div className="p-3 space-y-1">
                            {menuItems.map((item, index) => {
                                if (item.divider) {
                                    return (
                                        <div key={`divider-${index}`} className="my-2 border-t" />
                                    );
                                }

                                const isActive = item.id === activeTab && !item.action && !item.href;

                                if (item.href) {
                                    const target = item.external ? "_blank" : undefined;
                                    return (
                                        <a
                                            key={item.id}
                                            href={item.href}
                                            target={target}
                                            rel={item.external ? "noopener noreferrer" : undefined}
                                            onClick={() => {
                                                if (!item.external) setOpen(false);
                                            }}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-muted",
                                                "text-left text-sm font-medium"
                                            )}
                                        >
                                            {item.icon}
                                            <span className="flex-1">{item.label}</span>
                                            {item.external && (
                                                <span className="text-xs text-muted-foreground">↗</span>
                                            )}
                                        </a>
                                    );
                                }

                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleMenuItemClick(item)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left text-sm font-medium",
                                            isActive
                                                ? "bg-primary text-primary-foreground"
                                                : "hover:bg-muted text-foreground"
                                        )}
                                    >
                                        {item.icon}
                                        <span className="flex-1">{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </nav>

                    {/* フッター */}
                    <div className="p-4 border-t space-y-2">
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
