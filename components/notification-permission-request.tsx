import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, X } from 'lucide-react';
import { useNotification } from '@/hooks/use-notification';

export function NotificationPermissionRequest() {
    const { isSupported, isSubscribed, isLoading, subscribe } = useNotification();
    const [showPrompt, setShowPrompt] = useState(false);
    const [hasPrompted, setHasPrompted] = useState(false);

    useEffect(() => {
        // LocalStorageから過去のプロンプト状態を確認
        const promptedBefore = localStorage.getItem('notification-prompted') === 'true';
        setHasPrompted(promptedBefore);

        // 初回訪問で、許可していない場合にプロンプトを表示
        if (isSupported && !isLoading && !isSubscribed && !promptedBefore) {
            // 500msのディレイを加えてUIの読み込み後に表示
            const timer = setTimeout(() => setShowPrompt(true), 500);
            return () => clearTimeout(timer);
        }
    }, [isSupported, isLoading, isSubscribed]);

    if (!isSupported || isLoading || isSubscribed || !showPrompt) {
        return null;
    }

    const handleSubscribe = async () => {
        const success = await subscribe();
        if (success) {
            localStorage.setItem('notification-prompted', 'true');
            setShowPrompt(false);
        }
    };

    const handleDismiss = () => {
        localStorage.setItem('notification-prompted', 'true');
        setShowPrompt(false);
    };

    return (
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
            <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="ml-3 flex items-center justify-between gap-4">
                <span className="text-sm text-blue-900 dark:text-blue-100">
                    予定の追加を通知で受け取りますか？
                </span>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="default"
                        onClick={handleSubscribe}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        有効にする
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleDismiss}
                        className="h-8 w-8 p-0"
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">閉じる</span>
                    </Button>
                </div>
            </AlertDescription>
        </Alert>
    );
}
