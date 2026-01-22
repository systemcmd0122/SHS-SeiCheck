import { useEffect, useRef } from 'react';
import { useNotification } from './use-notification';
import { Event } from '@/lib/types';

interface EventNotificationTracker {
    previousEventIds: Set<string>;
}

/**
 * イベントの追加を監視して、新しいイベントが追加されたときに通知を送信するフック
 */
export function useEventNotifications(events: Event[] | null) {
    const trackerRef = useRef<EventNotificationTracker>({
        previousEventIds: new Set(),
    });
    const { showNotification } = useNotification();

    useEffect(() => {
        if (!events || events.length === 0) {
            return;
        }

        const currentEventIds = new Set(events.map((e) => e.id));
        const previousEventIds = trackerRef.current.previousEventIds;

        // 新しいイベントを検出
        const newEvents = events.filter(
            (event) => !previousEventIds.has(event.id)
        );

        // 新しいイベントがある場合に通知を送信
        newEvents.forEach((event) => {
            const eventDate = typeof event.date === 'string'
                ? new Date(event.date)
                : event.date;

            const formattedDate = eventDate.toLocaleDateString('ja-JP', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });

            // ユーザーが通知を無効化していないか確認
            const isDisabled = localStorage.getItem('notificationsDisabled') === 'true';
            if (isDisabled) {
                console.log('[useEventNotifications] Notifications are disabled by user');
                return;
            }

            showNotification({
                title: '新しい予定が追加されました',
                body: `${event.name}\n${formattedDate}`,
                icon: '/icon.jpg',
                badge: '/icon.jpg',
                tag: `event-${event.id}`,
                requireInteraction: false,
                url: '/attendance',
            });

            console.log('Event notification sent:', event.name);
        });

        // 現在のイベントIDを保存
        trackerRef.current.previousEventIds = currentEventIds;
    }, [events]);
}
