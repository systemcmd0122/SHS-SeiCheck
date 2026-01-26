import { Users, Calendar, CheckCircle2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="text-center space-y-8">
        {/* アイコンアニメーション */}
        <div className="relative w-32 h-32 mx-auto">
          {/* 外側の回転する円 */}
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-spin" style={{ borderTopColor: 'hsl(var(--primary))' }}></div>
          
          {/* 中央のアイコングループ */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* メインアイコン */}
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <Users className="w-8 h-8 text-primary" />
              </div>
              
              {/* 周りを回るアイコン */}
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center animate-bounce" style={{ animationDelay: '0.1s' }}>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              
              <div className="absolute -bottom-2 -left-2 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center animate-bounce" style={{ animationDelay: '0.2s' }}>
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* テキスト */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent animate-pulse">
            生徒会出欠管理
          </h2>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <p className="text-sm text-muted-foreground">
            読み込み中...
          </p>
        </div>
      </div>
    </div>
  );
}