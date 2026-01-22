import { useState, useEffect } from 'react';
import { Announcement } from '@/lib/types';
import {
    getAnnouncementsRealtime,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    toggleAnnouncementPin,
} from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Info, RefreshCw, Trash2, Pin, PinOff, Edit2, X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface AnnouncementsManagerProps {
    adminMode: boolean;
}

export function AnnouncementsManager({ adminMode }: AnnouncementsManagerProps) {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState<'重要' | 'お知らせ' | '更新'>('お知らせ');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        try {
            const unsubscribe = getAnnouncementsRealtime((data) => {
                console.log('Announcements loaded in manager:', data);
                setAnnouncements(data);
                setIsLoading(false);
            });

            return () => unsubscribe();
        } catch (error) {
            console.error('Error loading announcements:', error);
            setIsLoading(false);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            alert('タイトルと内容を入力してください');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingId) {
                const editingAnnouncement = announcements.find((a) => a.id === editingId);
                await updateAnnouncement(
                    editingId,
                    title,
                    content,
                    category,
                    editingAnnouncement?.pinned || false
                );
                setEditingId(null);
            } else {
                await createAnnouncement(title, content, category);
            }

            setTitle('');
            setContent('');
            setCategory('お知らせ');
            setIsDialogOpen(false);
        } catch (error) {
            console.error('Failed to save announcement:', error);
            alert('お知らせの保存に失敗しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (announcement: Announcement) => {
        setEditingId(announcement.id);
        setTitle(announcement.title);
        setContent(announcement.content);
        setCategory(announcement.category);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('このお知らせを削除しますか？')) return;

        try {
            await deleteAnnouncement(id);
        } catch (error) {
            console.error('Failed to delete announcement:', error);
            alert('お知らせの削除に失敗しました');
        }
    };

    const handleTogglePin = async (id: string, currentPinned: boolean) => {
        try {
            await toggleAnnouncementPin(id, currentPinned);
        } catch (error) {
            console.error('Failed to toggle pin:', error);
            alert('ピン止めの切り替えに失敗しました');
        }
    };

    const handleDialogOpenChange = (open: boolean) => {
        if (!open) {
            setEditingId(null);
            setTitle('');
            setContent('');
            setCategory('お知らせ');
        }
        setIsDialogOpen(open);
    };

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

    return (
        <div className="space-y-6">
            {adminMode && (
                <div>
                    <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                                新しいお知らせを投稿
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingId ? 'お知らせを編集' : '新しいお知らせを投稿'}
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="category">カテゴリー</Label>
                                    <Select value={category} onValueChange={(value) => setCategory(value as any)}>
                                        <SelectTrigger id="category">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                                            <SelectItem value="重要">重要</SelectItem>
                                            <SelectItem value="お知らせ">お知らせ</SelectItem>
                                            <SelectItem value="更新">更新</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="title">タイトル</Label>
                                    <Input
                                        id="title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="お知らせのタイトルを入力"
                                        maxLength={100}
                                    />
                                    <p className="text-xs text-slate-500">
                                        {title.length} / 100 文字
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="content">内容</Label>
                                    <Textarea
                                        id="content"
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="お知らせの内容を入力（改行可）"
                                        rows={6}
                                        maxLength={1000}
                                    />
                                    <p className="text-xs text-slate-500">
                                        {content.length} / 1000 文字
                                    </p>
                                </div>

                                <div className="flex justify-end gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => handleDialogOpenChange(false)}
                                    >
                                        キャンセル
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        {isSubmitting ? '保存中...' : editingId ? '更新' : '投稿'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            )}

            {/* お知らせ一覧 */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    お知らせ一覧
                </h3>

                {isLoading ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        <p className="text-sm">読み込み中...</p>
                    </div>
                ) : announcements.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        <p className="text-sm">お知らせはありません</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {announcements.map((announcement) => (
                            <Card
                                key={announcement.id}
                                className={`border-l-4 ${announcement.category === '重要'
                                    ? 'border-l-red-600 dark:border-l-red-500'
                                    : announcement.category === '更新'
                                        ? 'border-l-blue-600 dark:border-l-blue-500'
                                        : 'border-l-slate-400 dark:border-l-slate-600'
                                    }`}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                {announcement.pinned && (
                                                    <Badge variant="outline" className="text-xs">
                                                        📌 ピン済み
                                                    </Badge>
                                                )}
                                                <Badge
                                                    variant={getCategoryBadgeVariant(announcement.category) as any}
                                                    className="text-xs gap-1"
                                                >
                                                    {getCategoryIcon(announcement.category)}
                                                    {announcement.category}
                                                </Badge>
                                            </div>
                                            <CardTitle className="text-base md:text-lg text-slate-900 dark:text-white">
                                                {announcement.title}
                                            </CardTitle>
                                        </div>

                                        {adminMode && (
                                            <div className="flex gap-1 flex-shrink-0">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => handleTogglePin(announcement.id, announcement.pinned)}
                                                    title={announcement.pinned ? 'ピン止めを解除' : 'ピン止め'}
                                                >
                                                    {announcement.pinned ? (
                                                        <PinOff className="h-4 w-4" />
                                                    ) : (
                                                        <Pin className="h-4 w-4" />
                                                    )}
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => handleEdit(announcement)}
                                                    title="編集"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => handleDelete(announcement.id)}
                                                    title="削除"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
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
                )}
            </div>
        </div>
    );
}
