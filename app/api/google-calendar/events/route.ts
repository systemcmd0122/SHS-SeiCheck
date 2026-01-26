import { NextRequest, NextResponse } from "next/server";
import { getGoogleCalendarEventsByMonth } from "@/lib/google-calendar";

/**
 * Google Calendar イベント取得API
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
        const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());
        const calendarId = searchParams.get("calendarId") || process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID || "primary";

        if (isNaN(year) || isNaN(month)) {
            return NextResponse.json({ success: false, error: "無効な日付形式です" }, { status: 400 });
        }

        const events = await getGoogleCalendarEventsByMonth(year, month, calendarId);

        return NextResponse.json({
            success: true,
            data: events,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        const err = error as Error;
        console.error("API Route Error:", err.message);
        return NextResponse.json(
            {
                success: false,
                error: err.message || "取得エラーが発生しました",
                data: []
            },
            { status: 500 }
        );
    }
}