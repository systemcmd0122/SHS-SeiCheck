import { NextRequest, NextResponse } from "next/server";
import { getStatistics } from "@/lib/statistics";

export async function GET(request: NextRequest) {
    try {
        const stats = await getStatistics();
        return NextResponse.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        const err = error as Error;
        console.error("Statistics API Error:", err.message);
        return NextResponse.json(
            {
                success: false,
                error: err.message || "統計情報取得エラー",
                data: null
            },
            { status: 500 }
        );
    }
}
