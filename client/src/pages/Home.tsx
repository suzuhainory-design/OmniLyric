import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Music, Sparkles, Languages, TrendingUp } from "lucide-react";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Music className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              {APP_TITLE}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Button variant="ghost" onClick={() => navigate("/history")}>
                  历史记录
                </Button>
                <Button onClick={() => navigate("/create")}>
                  开始创作
                </Button>
              </>
            ) : (
              <Button onClick={() => window.location.href = getLoginUrl()}>
                登录
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-5xl md:text-6xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
                智能歌词创作
              </span>
              <br />
              <span className="text-foreground">让灵感自由流淌</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              基于AI技术的多语言歌词创作平台，支持中、日、英、法、俄、德六种语言，
              让您的音乐创作更加自由和高效
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 pt-4">
            {isAuthenticated ? (
              <Button size="lg" className="text-lg px-8 py-6" onClick={() => navigate("/create")}>
                <Sparkles className="w-5 h-5 mr-2" />
                立即创作
              </Button>
            ) : (
              <Button size="lg" className="text-lg px-8 py-6" onClick={() => window.location.href = getLoginUrl()}>
                <Sparkles className="w-5 h-5 mr-2" />
                开始使用
              </Button>
            )}
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 pt-16">
            <div className="bg-card/50 backdrop-blur border border-border/50 rounded-lg p-6 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Languages className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground">多语言支持</h3>
              <p className="text-muted-foreground">
                支持中、日、英、法、俄、德六种语言，还可以创作混合语言歌词
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur border border-border/50 rounded-lg p-6 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground">智能创作</h3>
              <p className="text-muted-foreground">
                基于关键词和旋律描述，AI智能生成符合您需求的歌词内容
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur border border-border/50 rounded-lg p-6 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground">持续优化</h3>
              <p className="text-muted-foreground">
                根据您的反馈不断优化创作结果，越用越懂您的风格
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-20">
        <div className="container mx-auto px-4 py-6 text-center text-muted-foreground">
          <p>© 2025 {APP_TITLE}. Powered by AI.</p>
        </div>
      </footer>
    </div>
  );
}
