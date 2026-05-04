"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md w-full">
        <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
                <span className="text-4xl font-bold text-muted-foreground">404</span>
            </div>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          ページが見つかりません
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <Button asChild className="w-full">
            <Link href="/">
                ホームに戻る
            </Link>
        </Button>
      </div>
    </div>
  );
}
