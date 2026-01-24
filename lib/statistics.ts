import type { Event, Response, Member } from "./types";
import { getAllEvents, getResponsesForEvent } from "./db";
import { members } from "./members";

/**
 * 参加率の計算
 */
export function calculateAttendanceRate(
    responses: Response[],
    totalMembers: number
): { rate: number; attended: number; absent: number; late: number; unanswered: number } {
    const attended = responses.filter((r) => r.status === "参加").length;
    const absent = responses.filter((r) => r.status === "不参加").length;
    const late = responses.filter((r) => r.status === "遅れる").length;
    const unanswered = totalMembers - responses.length;

    const rate = totalMembers > 0 ? Math.round((attended / totalMembers) * 100) : 0;

    return { rate, attended, absent, late, unanswered };
}

/**
 * メンバーの個別参加率を計算
 */
export function calculateMemberAttendanceRate(
    memberId: string,
    allEventResponses: Record<string, Response[]>,
    totalEvents: number
): { rate: number; attended: number; absent: number; late: number; undecided: number } {
    let attended = 0;
    let absent = 0;
    let late = 0;

    for (const eventId in allEventResponses) {
        const response = allEventResponses[eventId].find((r) => r.memberId === memberId);
        if (response?.status === "参加") attended++;
        if (response?.status === "不参加") absent++;
        if (response?.status === "遅れる") late++;
    }

    const undecided = totalEvents - attended - absent - late;
    const rate = totalEvents > 0 ? Math.round((attended / totalEvents) * 100) : 0;

    return { rate, attended, absent, late, undecided };
}

/**
 * イベントタイプ別の統計
 */
export function getStatisticsByEventType(
    events: Event[],
    responses: Response[],
    eventType: string
) {
    const typeEvents = events.filter((e) => e.type === eventType);
    const stats = typeEvents.map((event) => {
        const eventResponses = responses.filter((r) => r.eventId === event.id);
        const stats = calculateAttendanceRate(eventResponses, 50); // 仮の全メンバー数
        return {
            title: event.title,
            dateTime: event.dateTime,
            ...stats,
        };
    });
    return stats;
}

/**
 * 欠席理由の集計
 */
export function aggregateAbsenceReasons(responses: Response[]): Record<string, number> {
    const reasons: Record<string, number> = {};

    responses.forEach((response) => {
        if (response.status === "不参加" && response.reason) {
            reasons[response.reason] = (reasons[response.reason] || 0) + 1;
        }
    });

    return reasons;
}

/**
 * グラフ用データの作成
 */
export function generateChartData(
    events: Event[],
    responses: Response[],
    totalMembers: number
) {
    return events
        .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
        .slice(-10) // 最新10件
        .map((event) => {
            const eventResponses = responses.filter((r) => r.eventId === event.id);
            const { attended, absent, late, unanswered } = calculateAttendanceRate(
                eventResponses,
                totalMembers
            );

            return {
                title: event.title.substring(0, 10), // 短縮版
                attended,
                absent,
                late,
                unanswered,
            };
        });
}

/**
 * 全体統計情報を取得
 */
export async function getStatistics() {
    try {
        const allEvents = await getAllEvents();
        const totalMembers = members.length;

        let participated = 0;
        let late = 0;
        let absent = 0;
        let unanswered = 0;

        // 全イベントの回答を集計
        for (const event of allEvents) {
            const responses = await getResponsesForEvent(event.id);
            participated += responses.filter((r) => r.status === "参加").length;
            late += responses.filter((r) => r.status === "遅れる").length;
            absent += responses.filter((r) => r.status === "不参加").length;
            unanswered += responses.filter((r) => r.status === "未回答").length;
        }

        return {
            participated,
            late,
            absent,
            unanswered,
            total: totalMembers,
        };
    } catch (error) {
        console.error("Failed to get statistics:", error);
        return {
            participated: 0,
            late: 0,
            absent: 0,
            unanswered: 0,
            total: members.length,
        };
    }
}
