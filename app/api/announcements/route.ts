import { NextRequest, NextResponse } from "next/server";
import { getAllAnnouncements } from "@/lib/db";

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
