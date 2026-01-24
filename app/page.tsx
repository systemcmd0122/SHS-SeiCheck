"use client";

import { MemberSelectionPage } from "@/components/MemberSelectionPage";

export default function Home() {
  return (
    <MemberSelectionPage
      title="生徒会出欠管理"
      description="メンバー選択してログイン"
      buttonLabel="ログイン"
      showAdminButton={true}
    />
  );
}
