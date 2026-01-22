import { useEffect, useState, useCallback } from 'react';

interface NotificationOptions {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    requireInteraction?: boolean;
    url?: string;
}

export function useNotification() {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);

    const checkNotificationStatus = useCallback(async () => {
        if (typeof window === 'undefined') {
            setIsLoading(false);
            return;
        }

        try {
            // ブラウザの通知権限を確認 - これが最信頼できる情報源
            const permission = Notification.permission;
            console.log('[useNotification] Notification.permission:', permission);
            setNotificationPermission(permission);

            if (permission !== 'granted') {
                // 許可されていない場合は購読状態はfalse
                console.log('[useNotification] Permission not granted:', permission);
                setIsSubscribed(false);
                setIsLoading(false);
                return;
            }

            // 許可されている場合、Service Workerをチェック
            if (!('serviceWorker' in navigator)) {
                console.log('[useNotification] Service Worker not supported');
                setIsSubscribed(true); // 許可されている、ローカル通知は可能
                setIsLoading(false);
                return;
            }

            try {
                const registration = await navigator.serviceWorker.ready;
                console.log('[useNotification] Service Worker ready');

                // Push購読をチェック（失敗してもOK - ローカル通知は使える）
                try {
                    const subscription = await registration.pushManager.getSubscription();
                    console.log('[useNotification] Push subscription:', !!subscription);
                    // 許可があれば、購読の有無に関わらず有効と判定
                    setIsSubscribed(true);
                } catch (pushError) {
                    console.log('[useNotification] Push check failed:', pushError);
                    // Push APIエラーでも許可があれば有効
                    setIsSubscribed(true);
                }
            } catch (swError) {
                console.error('[useNotification] Service Worker error:', swError);
                // Service Workerエラーでも許可があれば有効
                setIsSubscribed(true);
            }
        } catch (error) {
            console.error('[useNotification] Error checking status:', error);
            setIsSubscribed(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const supported =
            'serviceWorker' in navigator &&
            'PushManager' in window &&
            'Notification' in window;

        console.log('[useNotification] Browser support:', supported);
        setIsSupported(supported);

        if (supported) {
            // 初期チェック
            checkNotificationStatus();
        } else {
            setIsLoading(false);
        }
    }, [checkNotificationStatus]);

    const requestPermission = useCallback(async () => {
        if (!isSupported) {
            console.error('Notifications not supported');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            console.log('[useNotification] Permission requested:', permission);
            setNotificationPermission(permission);

            // 許可後は状態を再チェック
            if (permission === 'granted') {
                await new Promise(resolve => setTimeout(resolve, 100)); // 少し待機
                await checkNotificationStatus();
            }

            return permission === 'granted';
        } catch (error) {
            console.error('Failed to request notification permission:', error);
            return false;
        }
    }, [isSupported, checkNotificationStatus]);

    const subscribe = useCallback(async () => {
        if (!isSupported) {
            console.error('Notifications not supported');
            return false;
        }

        try {
            setIsLoading(true);

            // 通知権限をリクエスト
            const permission = await requestPermission();
            if (!permission) {
                console.log('Notification permission denied');
                setIsSubscribed(false);
                return false;
            }

            try {
                const registration = await navigator.serviceWorker.ready;

                // すでに購読している場合をチェック
                const existingSubscription = await registration.pushManager.getSubscription();
                if (existingSubscription) {
                    console.log('Already subscribed to push notifications');
                    setIsSubscribed(true);
                    await checkNotificationStatus();
                    return true;
                }

                // Push通知を購読
                try {
                    const subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                    });
                    console.log('Successfully subscribed to push notifications');
                    setIsSubscribed(true);
                    await checkNotificationStatus();
                    return true;
                } catch (pushError) {
                    // Push通知購読に失敗しても、ローカル通知は可能
                    console.log('Push subscription not available, but local notifications work');
                    setIsSubscribed(true);
                    await checkNotificationStatus();
                    return true;
                }
            } catch (swError) {
                console.error('Service Worker error:', swError);
                // Service Workerエラーでも権限が与えられていれば成功と判定
                setIsSubscribed(true);
                await checkNotificationStatus();
                return true;
            }
        } catch (error) {
            console.error('Failed to subscribe to notifications:', error);
            setIsSubscribed(false);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [isSupported, requestPermission, checkNotificationStatus]);

    const unsubscribe = useCallback(async () => {
        if (!isSupported) return false;

        try {
            setIsLoading(true);

            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
                console.log('Unsubscribed from push notifications');
            }

            setIsSubscribed(false);
            // 権限は保持されているが、購読を解除したことを示す
            await checkNotificationStatus();
            return true;
        } catch (error) {
            console.error('Failed to unsubscribe:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [isSupported, checkNotificationStatus]);

    const disableNotifications = useCallback(() => {
        try {
            localStorage.setItem('notificationsDisabled', 'true');
            console.log('[useNotification] Notifications disabled via localStorage');
            return true;
        } catch (error) {
            console.error('Failed to disable notifications:', error);
            return false;
        }
    }, []);

    const enableNotifications = useCallback(() => {
        try {
            localStorage.removeItem('notificationsDisabled');
            console.log('[useNotification] Notifications enabled via localStorage');
            return true;
        } catch (error) {
            console.error('Failed to enable notifications:', error);
            return false;
        }
    }, []);

    const isNotificationsDisabled = useCallback(() => {
        if (typeof window === 'undefined') return false;
        const disabled = localStorage.getItem('notificationsDisabled');
        return disabled === 'true';
    }, []);

    const showNotification = useCallback(async (options: NotificationOptions) => {
        if (!isSupported) {
            console.error('Notifications not supported');
            return false;
        }

        try {
            // ブラウザの権限を再確認
            if (Notification.permission !== 'granted') {
                console.warn('Notification permission not granted');
                return false;
            }

            const registration = await navigator.serviceWorker.ready;

            // Service Workerを通じて通知を表示
            registration.showNotification(options.title, {
                body: options.body,
                icon: options.icon || '/icon.jpg',
                badge: options.badge || '/icon.jpg',
                tag: options.tag || 'notification',
                requireInteraction: options.requireInteraction ?? false,
                data: {
                    url: options.url || '/',
                },
            });

            console.log('Notification sent successfully');
            return true;
        } catch (error) {
            console.error('Failed to show notification:', error);
            return false;
        }
    }, [isSupported]);

    return {
        isSupported,
        isSubscribed,
        isLoading,
        notificationPermission,
        checkNotificationStatus,
        requestPermission,
        subscribe,
        unsubscribe,
        showNotification,
        disableNotifications,
        enableNotifications,
        isNotificationsDisabled,
    };
}
