"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash2, Settings, Menu, X, Bell, CheckCircle2, AlertCircle } from "lucide-react";
import { DarkModeToggle } from "@/components/dark-mode-toggle";
import { useNotification } from "@/hooks/use-notification";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function SettingsPage() {
    const router = useRouter();
    const { isSupported, isSubscribed, isLoading: hookIsLoading, notificationPermission, checkNotificationStatus, subscribe, unsubscribe, showNotification, disableNotifications, enableNotifications, isNotificationsDisabled } = useNotification();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [cachedMember, setCachedMember] = useState<any | null>(null);
    const [cacheSize, setCacheSize] = useState(0);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [testingNotification, setTestingNotification] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [notificationsDisabled, setNotificationsDisabled] = useState(false);

    useEffect(() => {
        const loadCacheInfo = () => {
            const storedMember = localStorage.getItem("selectedMember");
            if (storedMember) {
                try {
                    const member = JSON.parse(storedMember);
                    setCachedMember(member);
                    setCacheSize(new Blob([storedMember]).size);
                } catch (error) {
                    console.error("Failed to parse cached member:", error);
                }
            }
        };

        // 通知無効状態を初期化
        setNotificationsDisabled(isNotificationsDisabled());

        loadCacheInfo();
    }, [isNotificationsDisabled]);

    const handleSubscribe = async () => {
        setIsLoading(true);
        try {
            const success = await subscribe();
            // アプリレベルで通知を有効化
            enableNotifications();

            // 少し待機してブラウザの権限状態を反映させる
            await new Promise(resolve => setTimeout(resolve, 200));
            await checkNotificationStatus();

            if (success) {
                // 状態を更新
                setNotificationsDisabled(false);
                // テスト通知を送信
                await showNotification({
                    title: '通知が有効になりました',
                    body: 'これからイベント追加時に通知を受け取ります',
                    icon: '/icon.jpg',
                    badge: '/icon.jpg',
                    url: '/',
                });
            }
        } catch (error) {
            console.error('Failed to subscribe:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUnsubscribe = async () => {
        setIsLoading(true);
        try {
            // Push購読を削除
            const success = await unsubscribe();
            // アプリレベルで通知を無効化
            const disabled = disableNotifications();

            if (success && disabled) {
                // 状態を更新
                setNotificationsDisabled(true);
                await checkNotificationStatus();
            }
        } catch (error) {
            console.error('Failed to unsubscribe:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTestNotification = async () => {
        if (notificationPermission !== 'granted') {
            alert('通知が有効になっていません。先に「通知を有効にする」ボタンをクリックしてください。');
            return;
        }

        setTestingNotification(true);
        try {
            // Service Workerが準備できているか確認
            if (!('serviceWorker' in navigator)) {
                alert('このブラウザはService Workerをサポートしていません');
                return;
            }

            const success = await showNotification({
                title: 'テスト通知',
                body: 'これはテストのための通知です。通知機能が正常に動作しています！',
                icon: '/icon.jpg',
                badge: '/icon.jpg',
                url: '/',
            });
            if (!success) {
                console.error('showNotification returned false');
                alert('通知の送信に失敗しました。ブラウザの通知設定を確認してください。');
            } else {
                console.log('Test notification sent successfully');
            }
        } catch (error) {
            console.error('Failed to send test notification:', error);
            alert('通知の送信中にエラーが発生しました: ' + (error instanceof Error ? error.message : String(error)));
        } finally {
            setTestingNotification(false);
        }
    };

    const handleDeleteCache = () => {
        localStorage.removeItem("selectedMember");
        setCachedMember(null);
        setCacheSize(0);
        setDeleteConfirm(false);
    };

    const handleClearAllCache = () => {
        localStorage.clear();
        setCachedMember(null);
        setCacheSize(0);
    };

    return (
        <div className="flex flex-col min-h-screen" suppressHydrationWarning>
            {/* ナビゲーションバー */}
            <div className="border-b-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 backdrop-blur-sm flex-shrink-0 shadow-sm sticky top-0 z-40">
                <div className="mx-auto max-w-4xl px-4 md:px-6 lg:px-8 py-4 md:py-5 flex items-center justify-between gap-4">
                    {/* モバイルハンバーガーメニュー */}
                    <div className="md:hidden flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>
                        <div className="flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 text-sm">
                            <Settings className="h-4 w-4" />
                            <span>設定</span>
                        </div>
                    </div>

                    {/* デスクトップナビゲーション */}
                    <div className="hidden md:flex items-center gap-4">
                        <Button
                            variant="outline"
                            onClick={() => router.push("/")}
                            className="gap-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold h-10"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            <span>戻る</span>
                        </Button>
                    </div>

                    <DarkModeToggle />
                </div>
            </div>

            {/* モバイルメニュー */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetContent side="left" className="w-64 bg-white dark:bg-slate-800">
                    <SheetHeader className="mb-6">
                        <SheetTitle className="text-left text-lg font-bold text-slate-900 dark:text-white">
                            メニュー
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col gap-2">
                        <Button
                            onClick={() => {
                                router.push("/");
                                setMobileMenuOpen(false);
                            }}
                            className="justify-start gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            <span>ホームに戻る</span>
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* メインコンテンツ */}
            <div className="flex-1 overflow-y-auto mx-auto max-w-4xl w-full px-4 md:px-6 lg:px-8 py-8 md:py-12">
                {/* ページタイトル */}
                <div className="mb-8 md:mb-10">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                        設定
                    </h1>
                    <p className="text-sm md:text-base text-slate-600 dark:text-slate-400">
                        通知設定とキャッシュを管理します
                    </p>
                </div>

                {/* 通知設定セクション */}
                {isSupported && (
                    <Card className="mb-8 overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                        <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 md:p-6">
                            <CardTitle className="text-lg md:text-xl text-slate-900 dark:text-white flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                通知設定
                            </CardTitle>
                            <CardDescription className="text-slate-600 dark:text-slate-400">
                                ブラウザ通知の許可と設定を管理します
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 md:p-6">
                            <div className="space-y-6">
                                {/* 通知ステータス */}
                                <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/30 p-4 md:p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        {hookIsLoading ? (
                                            <AlertCircle className="h-5 w-5 text-slate-400 dark:text-slate-500 animate-pulse" />
                                        ) : notificationPermission === 'granted' ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        ) : notificationPermission === 'denied' ? (
                                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                        ) : (
                                            <AlertCircle className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                                        )}
                                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                                            通知ステータス
                                        </h3>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600 dark:text-slate-400">
                                            {hookIsLoading ? (
                                                'ステータス確認中...'
                                            ) : notificationPermission === 'granted' ? (
                                                '通知が有効です'
                                            ) : notificationPermission === 'denied' ? (
                                                '通知を許可していません'
                                            ) : (
                                                '通知が未設定です'
                                            )}
                                        </span>
                                        <Badge
                                            className={
                                                hookIsLoading
                                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
                                                    : notificationPermission === 'granted'
                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                        : notificationPermission === 'denied'
                                                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
                                            }
                                        >
                                            {hookIsLoading ? '確認中' : notificationPermission === 'granted' ? '有効' : notificationPermission === 'denied' ? '拒否' : '未設定'}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-3">
                                        {notificationsDisabled
                                            ? 'アプリの通知機能は無効化されています。「通知を有効にする」をクリックして再度有効化してください。'
                                            : notificationPermission === 'granted'
                                                ? 'イベントが追加されると自動で通知を受け取ります。'
                                                : notificationPermission === 'denied'
                                                    ? 'ブラウザの設定で通知がブロックされています。設定を変更してください。'
                                                    : 'ブラウザ通知を有効にすると、イベント追加時に通知を受け取ります。'}
                                    </p>
                                </div>

                                {/* アクションボタン */}
                                <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                        通知操作
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {notificationPermission !== 'granted' || notificationsDisabled ? (
                                            <Button
                                                onClick={handleSubscribe}
                                                disabled={isLoading || hookIsLoading}
                                                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                                            >
                                                <Bell className="h-4 w-4" />
                                                {isLoading || hookIsLoading ? '確認中...' : '通知を有効にする'}
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={handleUnsubscribe}
                                                disabled={isLoading || hookIsLoading}
                                                className="gap-2 border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 font-semibold"
                                                variant="outline"
                                            >
                                                <Bell className="h-4 w-4" />
                                                Push通知を無効にする
                                            </Button>
                                        )}
                                        <Button
                                            onClick={handleTestNotification}
                                            disabled={isLoading || hookIsLoading || testingNotification || notificationPermission !== 'granted' || notificationsDisabled}
                                            className="gap-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                                            variant="outline"
                                        >
                                            <Bell className="h-4 w-4" />
                                            {testingNotification ? 'テスト中...' : 'テスト通知を送信'}
                                        </Button>
                                    </div>
                                    {notificationPermission === 'granted' && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                                            💡 「Push通知を無効にする」はアプリの自動通知を停止します。ブラウザの許可設定を完全に削除するには、ブラウザの設定で直接変更してください。
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ページタイトル */}
                <Card className="mb-8 overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 md:p-6">
                        <CardTitle className="text-lg md:text-xl text-slate-900 dark:text-white">
                            キャッシュ情報
                        </CardTitle>
                        <CardDescription className="text-slate-600 dark:text-slate-400">
                            ブラウザに保存されているデータを確認・管理します
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6">
                        {cachedMember ? (
                            <div className="space-y-6">
                                {/* キャッシュ内容 */}
                                <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/30 p-4 md:p-6">
                                    <div className="mb-4">
                                        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-4">
                                            保存されたメンバー情報
                                        </h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-600 dark:text-slate-400">名前</span>
                                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                                {cachedMember.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-600 dark:text-slate-400">委員会</span>
                                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                                {cachedMember.committee}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-600 dark:text-slate-400">キャッシュサイズ</span>
                                            <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                                {cacheSize} bytes
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* 削除ボタン */}
                                <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                        キャッシュ操作
                                    </p>
                                    <Button
                                        variant="outline"
                                        onClick={() => setDeleteConfirm(true)}
                                        className="w-full gap-2 border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 font-semibold"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        メンバーキャッシュを削除
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleClearAllCache}
                                        className="w-full gap-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        すべてのキャッシュを削除
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="inline-block mb-3">
                                    <Settings className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                    キャッシュされたデータがありません
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-500">
                                    ホームページでメンバーを選択するとキャッシュが保存されます
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ストレージ情報セクション */}
                <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 md:p-6">
                        <CardTitle className="text-lg md:text-xl text-slate-900 dark:text-white">
                            ストレージ情報
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600 dark:text-slate-400">ブラウザキャッシュタイプ</span>
                                <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                    localStorage
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600 dark:text-slate-400">保存状態</span>
                                <Badge className={cachedMember ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"}>
                                    {cachedMember ? "キャッシュ有効" : "キャッシュなし"}
                                </Badge>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                キャッシュは自動的にブラウザに保存され、次回訪問時に使用されます。キャッシュを削除すると、次回はメンバー選択画面から開始します。
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 削除確認ダイアログ */}
            <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
                <AlertDialogContent className="bg-white dark:bg-slate-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle>メンバーキャッシュを削除しますか？</AlertDialogTitle>
                        <AlertDialogDescription>
                            保存されているメンバー情報（{cachedMember?.name}）が削除されます。次回訪問時はメンバー選択画面から開始します。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteCache}
                            className="bg-red-500 hover:bg-red-600 text-white"
                        >
                            削除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
