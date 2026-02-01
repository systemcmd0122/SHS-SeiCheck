import { GoogleCalendarEvent } from "./google-calendar";

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    timestamp?: Date;
}

export interface PlanningContext {
    events: GoogleCalendarEvent[];
    upcomingDays: number;
    userNote?: string;
}

/**
 * カレンダーイベント情報をテキスト形式に変換
 */
export function formatEventsForContext(events: GoogleCalendarEvent[]): string {
    if (events.length === 0) {
        return "現在、登録されている予定がありません。";
    }

    let text = "=== カレンダー予定情報 ===\n\n";
    events.forEach((event, index) => {
        const startDate = new Date(event.startTime);
        const endDate = new Date(event.endTime);

        const start = startDate.toLocaleString("ja-JP", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });

        const end = endDate.toLocaleString("ja-JP", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });

        text += `【${index + 1}】 ${event.title}\n`;
        text += `開始: ${start}\n`;
        text += `終了: ${end}\n`;

        if (event.location) {
            text += `場所: ${event.location}\n`;
        }

        if (event.description) {
            text += `説明: ${event.description}\n`;
        }

        text += "\n";
    });

    return text;
}

/**
 * プロンプトを生成
 */
export function generateSystemPrompt(): string {
    return `あなたは学校生活の予定管理アシスタントです。ユーザーのカレンダー予定をもとに、以下のことをサポートします：

1. 予定の分析と提案
2. 空き時間の提案
3. 予定の重要度の整理
4. スケジュール調整のアドバイス
5. イベント企画のブレインストーミング

回答時のルール：
- 日本語で自然に会話してください
- 提案は具体的で実行可能なものにしてください
- ユーザーのカレンダー情報を参考にしながら、実現的なアドバイスをしてください
- 敬語を使用してください
- 必要に応じて絵文字を使用して、分かりやすくしてください`;
}

/**
 * Gemini チャット機能（@google/genai 使用）
 */
export async function sendMessageToGemini(
    message: string,
    chatHistory: ChatMessage[],
    context: PlanningContext
): Promise<string> {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_KEY;

    if (!apiKey) {
        throw new Error(
            "NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_KEY が設定されていません"
        );
    }

    try {
        // Dynamic import for client-side usage
        const { GoogleGenAI } = await import("@google/genai");
        
        // クライアントの初期化
        const ai = new GoogleGenAI({
            apiKey: apiKey,
        });

        // カレンダーコンテキストとシステムプロンプトを準備
        const eventsContext = formatEventsForContext(context.events);
        const systemPrompt = generateSystemPrompt();

        // 会話履歴を @google/genai の形式に変換
        const history: Array<{ role: string; parts: Array<{ text: string }> }> = [];

        // システムプロンプトを最初のユーザーメッセージとして追加（会話が空の場合のみ）
        if (chatHistory.length === 0) {
            history.push({
                role: "user",
                parts: [{ text: systemPrompt }],
            });
            history.push({
                role: "model",
                parts: [{ text: "承知しました。学校生活の予定管理アシスタントとして、カレンダー予定をもとにサポートさせていただきます。何でもお聞きください！" }],
            });
        }

        // チャット履歴を追加
        chatHistory.forEach((msg) => {
            history.push({
                role: msg.role === "user" ? "user" : "model",
                parts: [{ text: msg.content }],
            });
        });

        // チャットセッションを作成
        const chat = ai.chats.create({
            model: "gemini-2.5-flash",
            history: history,
            config: {
                temperature: 0.7,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 2048,
            },
        });

        // カレンダー情報を含めたメッセージを送信
        const fullMessage = `【現在のカレンダー予定】
${eventsContext}

【ユーザーからの質問】
${message}`;

        const response = await chat.sendMessage({
            message: fullMessage,
        });

        // レスポンステキストを取得
        return response.text || "申し訳ありません。応答を生成できませんでした。";

    } catch (error) {
        const err = error as Error;
        console.error("Gemini API エラー:", err.message);
        
        // エラーメッセージをより詳細に
        if (err.message.includes("API key")) {
            throw new Error("APIキーが無効です。環境変数を確認してください。");
        } else if (err.message.includes("quota")) {
            throw new Error("APIの利用制限に達しました。しばらく待ってから再度お試しください。");
        } else if (err.message.includes("model")) {
            throw new Error("モデルが見つかりません。モデル名を確認してください。");
        } else {
            throw new Error(`チャット中にエラーが発生しました: ${err.message}`);
        }
    }
}

/**
 * イベント計画のための初期メッセージを生成
 */
export function generateInitialMessage(events: GoogleCalendarEvent[]): string {
    const eventCount = events.length;

    if (eventCount === 0) {
        return "こんにちは!📅 カレンダーにはまだ予定が登録されていないようですね。何かお手伝いできることはありますか?予定の提案や、スケジュール計画のアドバイスなど、何でもお聞きください。";
    }

    const upcomingEvent = events[0];
    const startDate = new Date(upcomingEvent.startTime);
    const dateStr = startDate.toLocaleString("ja-JP", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });

    return `こんにちは!👋 あなたのカレンダーには現在 ${eventCount} 件の予定が登録されています。次のイベントは ${upcomingEvent.title} (${dateStr}) です。

予定の相談や、スケジュール調整のアドバイスなど、何かお手伝いできることはありますか?`;
}