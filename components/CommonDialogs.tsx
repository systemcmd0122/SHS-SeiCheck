"use client";

import { ReactNode, JSX } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CommonDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    children: ReactNode;
    onCancel?: () => void;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    isLoading?: boolean;
    showFooter?: boolean;
}

export function CommonDialog({
    isOpen,
    onOpenChange,
    title,
    description,
    children,
    onCancel,
    onConfirm,
    confirmText = "確認",
    cancelText = "キャンセル",
    confirmVariant = "default",
    isLoading = false,
    showFooter = true,
}: CommonDialogProps): JSX.Element {
    const handleCancel = () => {
        onCancel?.();
        onOpenChange(false);
    };

    const handleConfirm = async () => {
        onConfirm?.();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:max-w-md p-4 sm:p-6">
                <DialogHeader className="space-y-2">
                    <DialogTitle className="text-lg sm:text-xl">{title}</DialogTitle>
                    {description && <DialogDescription className="text-sm sm:text-base">{description}</DialogDescription>}
                </DialogHeader>

                <div className="space-y-4 py-4">{children}</div>

                {showFooter && (
                    <DialogFooter className="flex gap-2 justify-end pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isLoading}
                            size="sm"
                        >
                            {cancelText}
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            variant={confirmVariant}
                            disabled={isLoading}
                            size="sm"
                        >
                            {confirmText}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}

/**
 * アナウンスメント作成・編集ダイアログ
 */
interface AnnouncementDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    children: ReactNode;
    isEditing?: boolean;
    onSubmit: () => void;
    onCancel?: () => void;
    isLoading?: boolean;
}

export function AnnouncementDialog({
    isOpen,
    onOpenChange,
    children,
    isEditing = false,
    onSubmit,
    onCancel,
    isLoading = false,
}: AnnouncementDialogProps): JSX.Element {
    return (
        <CommonDialog
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            title={isEditing ? "お知らせ編集" : "お知らせ作成"}
            description="お知らせの詳細を入力してください"
            onConfirm={onSubmit}
            onCancel={onCancel}
            confirmText={isEditing ? "更新" : "作成"}
            cancelText="キャンセル"
            isLoading={isLoading}
        >
            {children}
        </CommonDialog>
    );
}

/**
 * 共有リンク生成ダイアログ
 */
interface ShareLinkDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    children: ReactNode;
    onClose?: () => void;
}

export function ShareLinkDialog({
    isOpen,
    onOpenChange,
    children,
    onClose,
}: ShareLinkDialogProps): JSX.Element {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:max-w-lg p-4 sm:p-6">
                <DialogHeader className="space-y-2">
                    <DialogTitle className="text-lg sm:text-xl">共有リンクを生成</DialogTitle>
                    <DialogDescription className="text-sm sm:text-base">
                        未回答者に共有できるリンクを作成します
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">{children}</div>

                <DialogFooter className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={() => {
                            onClose?.();
                            onOpenChange(false);
                        }}
                        size="sm"
                    >
                        閉じる
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
