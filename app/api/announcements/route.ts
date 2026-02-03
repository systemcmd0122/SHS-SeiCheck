import { NextRequest, NextResponse } from "next/server";
import { getAllAnnouncements, createAnnouncement } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const announcements = await getAllAnnouncements();
        return NextResponse.json({
            success: true,
            data: announcements || [],
        });
    } catch (error) {
        const err = error as Error;
        console.error("Announcements API Error:", err.message);
        return NextResponse.json(
            {
                success: false,
                error: err.message || "お知らせ取得エラー",
                data: []
            },
            { status: 500 }
        );
    }
}

/**
 * お知らせを投稿
 * TODO: 認証・認可の実装（現在はデモ・プロトタイプのため制限なし）
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        if (!body.title || !body.content) {
            return NextResponse.json(
                { success: false, error: "タイトルと内容が必要です" },
                { status: 400 }
            );
        }

        const announcementId = await createAnnouncement({
            title: body.title,
            content: body.content,
            priority: body.priority || "通常",
            createdBy: body.createdBy || "admin",
            isTeacher: body.isTeacher || false,
        });

        return NextResponse.json({
            success: true,
            data: { id: announcementId },
        });
    } catch (error) {
        const err = error as Error;
        console.error("Announcements API Error (POST):", err.message);
        return NextResponse.json(
            {
                success: false,
                error: err.message || "お知らせ作成エラー",
            },
            { status: 500 }
        );
    }
}
