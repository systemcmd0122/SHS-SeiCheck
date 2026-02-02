import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * エラーメッセージを整形して返す
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Firebase エラーの場合
    if (error.message.includes("Firebase")) {
      return "データベースに接続できません。ネットワークを確認してください。"
    }
    // Firestore エラーの場合
    if (error.message.includes("permission-denied")) {
      return "アクセス権限がありません。"
    }
    if (error.message.includes("not-found")) {
      return "データが見つかりません。"
    }
    if (error.message.includes("unavailable")) {
      return "サービスが一時的に利用できません。しばらく待ってから試してください。"
    }
    return error.message
  }
  if (typeof error === "string") {
    return error
  }
  return "予期しないエラーが発生しました。"
}

/**
 * セッション情報を完全に削除
 */
export function clearAllSession(): void {
  // localStorage から削除
  try {
    localStorage.removeItem("last_login_member_id")
    localStorage.removeItem("member_id")
    localStorage.removeItem("memberInfo")
  } catch (e) {
    console.warn("Failed to clear localStorage:", e)
  }

  // sessionStorage から削除
  try {
    sessionStorage.removeItem("teacherInfo")
    sessionStorage.removeItem("teacher_id")
    sessionStorage.removeItem("adminInfo")
    sessionStorage.removeItem("admin_id")
  } catch (e) {
    console.warn("Failed to clear sessionStorage:", e)
  }

  // 全キーを安全に削除（予期しないキーも削除）
  try {
    if (typeof localStorage !== "undefined") {
      const keysToDelete: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes("member") || key.includes("teacher") || key.includes("admin"))) {
          keysToDelete.push(key)
        }
      }
      keysToDelete.forEach(key => localStorage.removeItem(key))
    }
  } catch (e) {
    console.warn("Failed to iterate localStorage:", e)
  }

  try {
    if (typeof sessionStorage !== "undefined") {
      const keysToDelete: string[] = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && (key.includes("member") || key.includes("teacher") || key.includes("admin"))) {
          keysToDelete.push(key)
        }
      }
      keysToDelete.forEach(key => sessionStorage.removeItem(key))
    }
  } catch (e) {
    console.warn("Failed to iterate sessionStorage:", e)
  }
}
