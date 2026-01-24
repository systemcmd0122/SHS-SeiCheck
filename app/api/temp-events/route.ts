import { NextRequest, NextResponse } from "next/server";
import { addTodayTask, getTodayTasks, deleteTodayTask, deleteExpiredTasks } from "@/lib/db";

export async function GET() {
    try {
        // 期限切れのタスクを削除
        await deleteExpiredTasks();
        // 今日のタスクを取得
        const tasks = await getTodayTasks();
        return NextResponse.json(
            { success: true, data: tasks },
            { headers: { "Cache-Control": "no-store" } }
        );
    } catch (error) {
        console.error("Get tasks error:", error);
        return NextResponse.json(
            { success: false, error: "タスク取得失敗", data: [] },
            { status: 500, headers: { "Cache-Control": "no-store" } }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (!body.title?.trim()) {
            return NextResponse.json(
                { success: false, error: "タイトルは必須です" },
                { status: 400, headers: { "Cache-Control": "no-store" } }
            );
        }
        const taskId = await addTodayTask(body.title);
        const tasks = await getTodayTasks();
        return NextResponse.json(
            { success: true, data: tasks },
            { headers: { "Cache-Control": "no-store" } }
        );
    } catch (error) {
        console.error("Add task error:", error);
        return NextResponse.json(
            { success: false, error: "タスク追加失敗" },
            { status: 500, headers: { "Cache-Control": "no-store" } }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        if (!body.id) {
            return NextResponse.json(
                { success: false, error: "タスクIDは必須です" },
                { status: 400, headers: { "Cache-Control": "no-store" } }
            );
        }
        await deleteTodayTask(body.id);
        const tasks = await getTodayTasks();
        return NextResponse.json(
            { success: true, data: tasks },
            { headers: { "Cache-Control": "no-store" } }
        );
    } catch (error) {
        console.error("Delete task error:", error);
        return NextResponse.json(
            { success: false, error: "タスク削除失敗" },
            { status: 500, headers: { "Cache-Control": "no-store" } }
        );
    }
}

