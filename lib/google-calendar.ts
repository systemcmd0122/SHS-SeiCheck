// iCalフィード形式の解析用
import ICAL from "ical.js";

export interface GoogleCalendarEvent {
    id: string;
    title: string;
    description?: string;
    startTime: string; // ISO 8601
    endTime: string; // ISO 8601
    location?: string;
    calendarName?: string; // カレンダー名
}

/**
 * 公開 Google Calendar の iCal フィードからイベントを取得（認証不要）
 */
export async function getGoogleCalendarEvents(
    calendarIdOrUrl: string = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID || "primary"
): Promise<GoogleCalendarEvent[]> {
    try {
        let calendarIds: string[] = [];

        // カンマ区切りのIDリストを処理
        if (calendarIdOrUrl.includes(",")) {
            calendarIds = calendarIdOrUrl.split(",").map((id) => id.trim());
        } else {
            calendarIds = [calendarIdOrUrl];
        }

        const allEvents: GoogleCalendarEvent[] = [];

        for (const calendarId of calendarIds) {
            try {
                const iCalUrl = `https://calendar.google.com/calendar/ical/${encodeURIComponent(calendarId)}/public/basic.ics`;
                const response = await fetch(iCalUrl, {
                    headers: {
                        "User-Agent": "Mozilla/5.0",
                    },
                    next: { revalidate: 3600 } // 1時間キャッシュ
                });

                if (!response.ok) {
                    console.warn(`⚠️ カレンダー取得失敗: ${calendarId}`);
                    continue;
                }

                const icalText = await response.text();
                const jcal = ICAL.parse(icalText);
                const comp = new ICAL.Component(jcal);
                const vevents = comp.getAllSubcomponents("vevent");

                const events: GoogleCalendarEvent[] = vevents.map((vevent) => {
                    const summary = vevent.getFirstPropertyValue("summary");
                    const description = vevent.getFirstPropertyValue("description");
                    const location = vevent.getFirstPropertyValue("location");
                    const dtstart = vevent.getFirstPropertyValue("dtstart");
                    const dtend = vevent.getFirstPropertyValue("dtend");
                    const uid = vevent.getFirstPropertyValue("uid");

                    // TypeScriptのエラー回避: ical.js の型を ICAL.Time として扱う
                    const startTime = (dtstart instanceof ICAL.Time) 
                        ? dtstart.toJSDate().toISOString() 
                        : (typeof dtstart === "string" ? new Date(dtstart).toISOString() : "");

                    const endTime = (dtend instanceof ICAL.Time) 
                        ? dtend.toJSDate().toISOString() 
                        : (typeof dtend === "string" ? new Date(dtend).toISOString() : "");

                    return {
                        id: (typeof uid === "string" ? uid : null) || Math.random().toString(36).substr(2, 9),
                        title: (typeof summary === "string" ? summary : null) || "（タイトルなし）",
                        description: typeof description === "string" ? description : undefined,
                        startTime,
                        endTime,
                        location: typeof location === "string" ? location : undefined,
                        calendarName: calendarId,
                    };
                }).filter((event) => event.startTime !== "");

                allEvents.push(...events);
            } catch (error) {
                console.warn(`カレンダー ${calendarId} の解析失敗:`, error);
            }
        }

        return allEvents;
    } catch (error) {
        const err = error as Error;
        console.error("Google Calendar フィード取得エラー:", err.message);
        throw new Error(`Google Calendar からのイベント取得に失敗しました: ${err.message}`);
    }
}

/**
 * 指定された月のイベントを取得（フィルタリング）
 */
export async function getGoogleCalendarEventsByMonth(
    year: number,
    month: number,
    calendarIdOrUrl: string = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID || "primary"
): Promise<GoogleCalendarEvent[]> {
    const allEvents = await getGoogleCalendarEvents(calendarIdOrUrl);
    return allEvents.filter((event) => {
        const date = new Date(event.startTime);
        return date.getFullYear() === year && date.getMonth() === month - 1;
    });
}