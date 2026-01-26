import { NextRequest, NextResponse } from "next/server";
import { getAllEvents } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const events = await getAllEvents();
        return NextResponse.json({
            success: true,
            data: events || [],
        });
    } catch (error) {
        const err = error as Error;
        console.error("Events API Error:", err.message);
        return NextResponse.json(
            {
                success: false,
                error: err.message || "イベント取得エラー",
                data: []
            },
            { status: 500 }
        );
    }
}
