"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Copy, Clock } from "lucide-react";
import type { EventTemplate, EventType, Event } from "@/lib/types";
import { EVENT_TYPES } from "@/lib/types";

interface TemplatesPanelProps {
    templates: EventTemplate[];
    onCreateFromTemplate?: (template: EventTemplate) => Promise<void>;
    onDeleteTemplate?: (templateId: string) => Promise<void>;
    onAddTemplate?: (template: Omit<EventTemplate, "id" | "createdAt">) => Promise<void>;
}

export function TemplatesPanel({
    templates,
    onCreateFromTemplate,
    onDeleteTemplate,
    onAddTemplate,
}: TemplatesPanelProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newTemplate, setNewTemplate] = useState({
        name: "",
        type: "定例会" as EventType,
        timeHour: 19,
        timeMinute: 0,
        deadlineHoursBefore: 24,
    });

    const handleCreateFromTemplate = async (template: EventTemplate) => {
        if (onCreateFromTemplate) {
            await onCreateFromTemplate(template);
        }
    };

    const handleAddTemplate = async () => {
        if (onAddTemplate && newTemplate.name) {
            await onAddTemplate({
                ...newTemplate,
                createdBy: "admin",
            });
            setIsDialogOpen(false);
            setNewTemplate({
                name: "",
                type: "定例会",
                timeHour: 19,
                timeMinute: 0,
                deadlineHoursBefore: 24,
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* ヘッダー */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Clock className="w-6 h-6" />
                        テンプレート
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">よく使う予定パターンを保存</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            新しいテンプレート
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>新しいテンプレートを作成</DialogTitle>
                            <DialogDescription>よく使う予定パターンをテンプレートとして保存</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="template-name">テンプレート名</Label>
                                <Input
                                    id="template-name"
                                    placeholder="例: 毎週月曜の定例会"
                                    value={newTemplate.name}
                                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label htmlFor="template-type">予定種類</Label>
                                <Select
                                    value={newTemplate.type}
                                    onValueChange={(value) =>
                                        setNewTemplate({ ...newTemplate, type: value as EventType })
                                    }
                                >
                                    <SelectTrigger id="template-type">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {EVENT_TYPES.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="template-hour">時刻（時間）</Label>
                                    <Input
                                        id="template-hour"
                                        type="number"
                                        min="0"
                                        max="23"
                                        value={newTemplate.timeHour}
                                        onChange={(e) =>
                                            setNewTemplate({ ...newTemplate, timeHour: parseInt(e.target.value) })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="template-minute">時刻（分）</Label>
                                    <Input
                                        id="template-minute"
                                        type="number"
                                        min="0"
                                        max="59"
                                        step="15"
                                        value={newTemplate.timeMinute}
                                        onChange={(e) =>
                                            setNewTemplate({ ...newTemplate, timeMinute: parseInt(e.target.value) })
                                        }
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="template-deadline">回答期限（時間前）</Label>
                                <Input
                                    id="template-deadline"
                                    type="number"
                                    min="1"
                                    value={newTemplate.deadlineHoursBefore}
                                    onChange={(e) =>
                                        setNewTemplate({
                                            ...newTemplate,
                                            deadlineHoursBefore: parseInt(e.target.value),
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                キャンセル
                            </Button>
                            <Button onClick={handleAddTemplate}>作成</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* テンプレート一覧 */}
            {templates.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {templates.map((template) => (
                        <Card key={template.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{template.name}</CardTitle>
                                        <CardDescription>{template.type}</CardDescription>
                                    </div>
                                    <Badge variant="outline">
                                        {String(template.timeHour).padStart(2, "0")}:
                                        {String(template.timeMinute).padStart(2, "0")}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="text-sm">
                                        <span className="text-muted-foreground">回答期限:</span>
                                        <span className="font-medium ml-2">{template.deadlineHoursBefore}時間前</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1 gap-2"
                                            onClick={() => handleCreateFromTemplate(template)}
                                        >
                                            <Copy className="w-4 h-4" />
                                            このテンプレートで予定を作成
                                        </Button>
                                        {onDeleteTemplate && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => onDeleteTemplate(template.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-muted-foreground text-center py-8">
                            テンプレートはまだありません。よく使う予定パターンを保存してください。
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* 定例会自動生成ガイド */}
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
                <CardHeader>
                    <CardTitle className="text-base text-blue-900 dark:text-blue-100">定例会の自動生成</CardTitle>
                    <CardDescription className="text-blue-700 dark:text-blue-300">定例会テンプレートで毎週の予定を簡単に作成</CardDescription>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                    <p className="text-blue-800 dark:text-blue-200">
                        🔄 定例会テンプレートを作成すると、同じ時刻・回答期限で複数の予定を一度に生成できます。
                    </p>
                    <p className="text-blue-800 dark:text-blue-200">テンプレート名に「毎週月曜」などの情報を含めると、管理しやすくなります。</p>
                </CardContent>
            </Card>
        </div>
    );
}
