import { NextRequest, NextResponse } from "next/server";
import { getAllEvents, getAllResponses } from "@/lib/db";
import { members } from "@/lib/members";
import { isSameDay } from "date-fns";

export async function GET(request: NextRequest) {
    try {
        const allEvents = await getAllEvents();
        const allResponses = await getAllResponses();
        const today = new Date();

        // 今日のイベントを抽出
        const todayEvents = allEvents.filter(e => {
            if (!e.dateTime) return false;
            const d = new Date(e.dateTime);
            return isSameDay(d, today);
        });
        if (todayEvents.length === 0) {
            return NextResponse.json({ success: true, data: [] });
        }

        // 今日のイベントの欠席者一覧を作成
        const absentList = [];
        for (const event of todayEvents) {
            const responses = allResponses.filter(r => r.eventId === event.id);
            const absents = responses.filter(r => r.status === "不参加");
            for (const a of absents) {
                const member = members.find(m => m.id === a.memberId);
                absentList.push({
                    eventId: event.id,
                    eventTitle: event.title,
                    memberId: a.memberId,
                    memberName: member ? member.name : a.memberId,
                    reason: a.reason || "理由未記入"
                });
            }
        }
        return NextResponse.json({ success: true, data: absentList });
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        return NextResponse.json({ success: false, error: err.message, data: [] }, { status: 500 });
    }
}
