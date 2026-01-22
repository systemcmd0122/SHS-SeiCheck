import { useEffect, useState } from 'react';
import { Announcement } from '@/lib/types';
import { getAnnouncementsRealtime } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, AlertCircle, Info, RefreshCw } from 'lucide-react';

export function AnnouncementsDisplay() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setIsLoading(true);
        try {
            const unsubscribe = getAnnouncementsRealtime((data) => {
                console.log('Announcements fetched:', data);
                setAnnouncements(data);
                setIsLoading(false);
            });

            return () => unsubscribe();
        } catch (err) {
            console.error('Error fetching announcements:', err);
            setError('お知らせの読み込みに失敗しました');
            setIsLoading(false);
        }
    }, []);

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case '重要':
                return <AlertCircle className="h-4 w-4" />;
            case '更新':
                return <RefreshCw className="h-4 w-4" />;
            default:
                return <Info className="h-4 w-4" />;
        }
    };

    const getCategoryBadgeVariant = (category: string) => {
        switch (category) {
            case '重要':
                return 'destructive';
            case '更新':
                return 'secondary';
            default:
                return 'default';
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case '重要':
                return 'bg-red-100 dark:bg-red-950 border-red-200 dark:border-red-900';
            case '更新':
                return 'bg-blue-100 dark:bg-blue-950 border-blue-200 dark:border-blue-900';
            default:
                return 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
        }
    };

    if (isLoading) {
        return (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <p className="text-sm">読み込み中...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8 text-red-500 dark:text-red-400">
                <p className="text-sm">{error}</p>
            </div>
        );
    }

    if (announcements.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">お知らせはありません</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {announcements.map((announcement) => (
                <Card
                    key={announcement.id}
                    className={`border-l-4 ${announcement.category === '重要'
                        ? 'border-l-red-600 dark:border-l-red-500'
                        : announcement.category === '更新'
                            ? 'border-l-blue-600 dark:border-l-blue-500'
                            : 'border-l-slate-400 dark:border-l-slate-600'
                        } ${getCategoryColor(announcement.category)}`}
                >
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    {announcement.pinned && (
                                        <Badge variant="outline" className="text-xs">
                                            📌 ピン済み
                                        </Badge>
                                    )}
                                    <Badge variant={getCategoryBadgeVariant(announcement.category) as any} className="text-xs gap-1">
                                        {getCategoryIcon(announcement.category)}
                                        {announcement.category}
                                    </Badge>
                                </div>
                                <CardTitle className="text-lg md:text-xl text-slate-900 dark:text-white">
                                    {announcement.title}
                                </CardTitle>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm md:text-base text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                            {announcement.content}
                        </p>
                        <CardDescription className="text-xs md:text-sm">
                            投稿日時: {announcement.createdAt.toLocaleDateString('ja-JP', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </CardDescription>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
