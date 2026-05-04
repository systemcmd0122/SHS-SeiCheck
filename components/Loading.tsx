import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function MemberListSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border rounded-xl">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-[60%]" />
              <Skeleton className="h-3 w-[40%]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EventListSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-32" />
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground">
            生徒会出欠管理
          </h2>
          <p className="text-sm text-muted-foreground">
            読み込み中...
          </p>
        </div>
      </div>
    </div>
  );
}
