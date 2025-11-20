import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, ArrowLeft, Eye, Trash2 } from "lucide-react";
import { APP_TITLE, getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function History() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  
  const { data: lyrics, isLoading: lyricsLoading } = trpc.lyrics.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const deleteMutation = trpc.lyrics.delete.useMutation({
    onSuccess: () => {
      toast.success("歌词已删除");
      trpc.useUtils().lyrics.list.invalidate();
    },
    onError: () => {
      toast.error("删除失败");
    },
  });

  if (loading || lyricsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const handleDelete = (id: number) => {
    if (confirm("确定要删除这首歌词吗？")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Music className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              {APP_TITLE}
            </h1>
          </div>
          <Button onClick={() => navigate("/create")}>
            创作新歌词
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">历史记录</h2>
            <p className="text-muted-foreground">查看您创作的所有歌词</p>
          </div>

          {lyrics && lyrics.length === 0 ? (
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="py-12 text-center">
                <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground mb-4">还没有创作记录</p>
                <Button onClick={() => navigate("/create")}>
                  开始创作
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {lyrics?.map((lyric) => (
                <Card key={lyric.id} className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between">
                      <span className="flex-1">{lyric.title || "未命名歌词"}</span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/lyric/${lyric.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(lyric.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      {lyric.languages.split(",").map(lang => {
                        const langMap: Record<string, string> = {
                          zh: "中文", en: "English", ja: "日本語",
                          fr: "Français", ru: "Русский", de: "Deutsch"
                        };
                        return langMap[lang] || lang;
                      }).join(" · ")}
                      {lyric.isMixed && " · 混合语言"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {lyric.content}
                    </p>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                      <span className="text-xs text-muted-foreground">
                        {new Date(lyric.createdAt).toLocaleDateString("zh-CN")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        满意度: {lyric.satisfactionScore}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
