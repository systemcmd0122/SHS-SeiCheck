import { NextRequest, NextResponse } from "next/server";

/**
 * HTMLエンティティをデコード
 */
function decodeHtmlEntities(text: string): string {
    const entities: Record<string, string> = {
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": '"',
        "&apos;": "'",
        "&#39;": "'",
        "&nbsp;": " ",
    };

    let decoded = text;
    for (const [entity, char] of Object.entries(entities)) {
        decoded = decoded.replace(new RegExp(entity, "g"), char);
    }

    // 数値実体参照（&#123;等）をデコード
    decoded = decoded.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(parseInt(dec, 10)));
    decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)));

    return decoded;
}

/**
 * HTMLタグを削除
 */
function stripHtmlTags(text: string): string {
    // 全てのHTMLタグを削除
    let stripped = text.replace(/<[^>]+>/g, "");
    // CDATAセクションも削除（念のため）
    stripped = stripped.replace(/<!\[CDATA\[/g, "").replace(/\]\]>/g, "");
    return stripped;
}

/**
 * ニュース取得API
 * Google News RSSを使用してニュースを取得
 */
export async function GET(request: NextRequest) {
    try {
        // Google News RSS（日本語）
        const feedUrl = "https://news.google.com/rss?hl=ja&gl=JP&ceid=JP:ja";

        const response = await fetch(feedUrl);
        if (!response.ok) {
            throw new Error(`Feed fetch failed: ${response.statusText}`);
        }

        const text = await response.text();

        // 簡易的なXML解析
        const items: any[] = [];
        const itemMatches = text.matchAll(/<item>([\s\S]*?)<\/item>/g);

        for (const match of itemMatches) {
            const itemXml = match[1];

            // タイトルを抽出（CDATA対応）
            let titleMatch = itemXml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/);
            if (!titleMatch) {
                titleMatch = itemXml.match(/<title>([^<]+)<\/title>/);
            }

            // 説明を抽出（CDATA対応、HTMLを含む）
            let descMatch = itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/);
            if (!descMatch) {
                descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/);
            }

            const linkMatch = itemXml.match(/<link>([^<]+)<\/link>/);
            const pubDateMatch = itemXml.match(/<pubDate>([^<]+)<\/pubDate>/);

            if (titleMatch && titleMatch[1].trim()) {
                let title = titleMatch[1];
                // エンティティをデコード
                title = decodeHtmlEntities(title).trim();

                let description = "";
                if (descMatch && descMatch[1].trim()) {
                    let rawDesc = descMatch[1];

                    // 1. HTMLエンティティをデコード
                    rawDesc = decodeHtmlEntities(rawDesc);

                    // 2. HTMLタグを削除（<br>, <p>, <div>, <ol>, <li>, <a>等全て）
                    rawDesc = stripHtmlTags(rawDesc);

                    // 3. 改行文字を削除・統一
                    rawDesc = rawDesc.replace(/[\r\n]+/g, " ");

                    // 4. 連続する空白を1つに統一
                    rawDesc = rawDesc.replace(/\s+/g, " ");

                    // 5. 前後の空白を除去
                    rawDesc = rawDesc.trim();

                    // 6. タイトルとの重複を排除
                    // （タイトルで始まる説明は削除）
                    if (rawDesc.startsWith(title)) {
                        rawDesc = rawDesc.substring(title.length).trim();
                    }

                    // 7. 先頭のハイフンやダッシュを削除
                    rawDesc = rawDesc.replace(/^[\s\-\–\—\|]+/, "").trim();

                    // 8. 最初の200文字を抽出
                    description = rawDesc.substring(0, 200);
                }

                // タイトルと説明の両方が存在することを確認
                if (title) {
                    items.push({
                        title,
                        description: description || title.substring(0, 100), // 説明がない場合はタイトルの最初の部分を使用
                        link: linkMatch ? decodeHtmlEntities(linkMatch[1]).trim() : "",
                        pubDate: pubDateMatch ? pubDateMatch[1] : new Date().toISOString(),
                    });
                }
            }
        }

        // 最新の5件を返す
        const latestNews = items.slice(0, 5);

        return NextResponse.json({
            success: true,
            data: latestNews,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        const err = error as Error;
        console.error("News API Error:", err.message);

        // フォールバック：サンプルニュースを返す
        return NextResponse.json(
            {
                success: true,
                data: [
                    {
                        title: "ニュースの取得準備中です",
                        description: "外部のニュースソースから最新情報を取得しています",
                        link: "#",
                        pubDate: new Date().toISOString(),
                    }
                ],
                timestamp: new Date().toISOString(),
            },
            { status: 200 }
        );
    }
}
