import { GoogleCalendarEvent } from "./google-calendar";

/**
 * カレンダーイベントをClassroom投稿用のテキスト形式に変換
 */
export function formatEventForClassroom(event: GoogleCalendarEvent): string {
    const startDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);

    const formattedStart = startDate.toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });

    const formattedEnd = endDate.toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });

    let text = `${event.title}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `開始: ${formattedStart}\n`;
    text += `終了: ${formattedEnd}\n`;

    if (event.location) {
        text += `場所: ${event.location}\n`;
    }

    if (event.description) {
        text += `\n説明:\n${event.description}\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    return text;
}

/**
 * 複数のカレンダーイベントをClassroom投稿用のテキスト形式に変換
 */
export function formatEventsForClassroom(events: GoogleCalendarEvent[]): string {
    let text = `予定のお知らせ (${events.length}件)\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    events.forEach((event, index) => {
        const startDate = new Date(event.startTime);
        const formattedStart = startDate.toLocaleString("ja-JP", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });

        text += `【${index + 1}】 ${event.title}\n`;
        text += `開始: ${formattedStart}\n`;

        if (event.location) {
            text += `場所: ${event.location}\n`;
        }

        if (event.description) {
            text += `説明: ${event.description}\n`;
        }

        text += `\n`;
    });

    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `このお知らせはSHS-SeiCheckから共有されました`;

    return text;
}

/**
 * テキストをクリップボードにコピー
 */
export async function copyToClipboard(text: string): Promise<void> {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            // 標準的なClipboard API
            await navigator.clipboard.writeText(text);
        } else {
            // フォールバック（HTTPでのテスト用）
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.opacity = "0";
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
        }
    } catch (error) {
        const err = error as Error;
        throw new Error(`クリップボードへのコピーに失敗しました: ${err.message}`);
    }
}

/**
 * クイックコピー用ヘルパー
 */
export async function quickCopyEvent(event: GoogleCalendarEvent): Promise<void> {
    const text = formatEventForClassroom(event);
    await copyToClipboard(text);
}

/**
 * 複数イベントのクイックコピー
 */
export async function quickCopyEvents(events: GoogleCalendarEvent[]): Promise<void> {
    const text = formatEventsForClassroom(events);
    await copyToClipboard(text);
}
