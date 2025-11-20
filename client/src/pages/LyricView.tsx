import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Music, ArrowLeft, ThumbsUp, ThumbsDown, Play, Pause } from "lucide-react";
import { APP_TITLE, getLoginUrl } from "@/const";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function LyricView() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const lyricId = params.id ? parseInt(params.id) : 0;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { data: lyric, isLoading: lyricLoading } = trpc.lyrics.getById.useQuery(
    { id: lyricId },
    { enabled: isAuthenticated && lyricId > 0 }
  );

  const feedbackMutation = trpc.feedback.create.useMutation({
    onSuccess: () => {
      toast.success("反馈已提交");
      trpc.useUtils().lyrics.getById.invalidate({ id: lyricId });
    },
    onError: () => {
      toast.error("反馈提交失败");
    },
  });

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => prev + 100);
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    if (lyric?.timingData) {
      try {
        const timings = JSON.parse(lyric.timingData);
        const currentIndex = timings.findIndex((t: any, idx: number) => {
          const nextTiming = timings[idx + 1];
          return currentTime >= t.startTime && (!nextTiming || currentTime < nextTiming.startTime);
        });
        if (currentIndex !== -1) {
          setCurrentLineIndex(currentIndex);
        }
      } catch (e) {
        // Invalid timing data
      }
    }
  }, [currentTime, lyric?.timingData]);

  if (loading || lyricLoading) {
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

  if (!lyric) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">歌词不存在</p>
          <Button className="mt-4" onClick={() => navigate("/history")}>
            返回历史记录
          </Button>
        </div>
      </div>
    );
  }

  const lines = lyric.content.split("\n");

  const handleFeedback = (type: "like" | "dislike") => {
    feedbackMutation.mutate({
      lyricId: lyric.id,
      feedbackType: type,
    });
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const resetPlay = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setCurrentLineIndex(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/history")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Music className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              {APP_TITLE}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Title and Info */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-foreground">{lyric.title || "未命名歌词"}</h2>
            <p className="text-muted-foreground">
              {lyric.languages.split(",").map(lang => {
                const langMap: Record<string, string> = {
                  zh: "中文", en: "English", ja: "日本語",
                  fr: "Français", ru: "Русский", de: "Deutsch"
                };
                return langMap[lang] || lang;
              }).join(" · ")}
              {lyric.isMixed && " · 混合语言"}
            </p>
          </div>

          {/* Playback Controls */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="py-6">
              <div className="flex items-center justify-center gap-4">
                <Button variant="outline" onClick={resetPlay}>
                  重置
                </Button>
                <Button size="lg" onClick={togglePlay}>
                  {isPlaying ? (
                    <>
                      <Pause className="w-5 h-5 mr-2" />
                      暂停
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      播放
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lyrics Display */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="py-8">
              <div className="space-y-4 text-center">
                {lines.map((line, index) => (
                  <p
                    key={index}
                    className={`text-lg transition-all duration-300 ${
                      index === currentLineIndex
                        ? "text-primary font-semibold text-2xl scale-110"
                        : "text-muted-foreground"
                    }`}
                  >
                    {line}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Translation */}
          {lyric.translation && (
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="py-6">
                <h3 className="text-lg font-semibold mb-4 text-foreground">中文翻译</h3>
                <div className="space-y-2 text-muted-foreground">
                  {lyric.translation.split("\n").map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Feedback */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="py-6">
              <div className="text-center space-y-4">
                <p className="text-foreground font-medium">您对这首歌词满意吗？</p>
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleFeedback("like")}
                    disabled={feedbackMutation.isPending}
                  >
                    <ThumbsUp className="w-5 h-5 mr-2" />
                    喜欢
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleFeedback("dislike")}
                    disabled={feedbackMutation.isPending}
                  >
                    <ThumbsDown className="w-5 h-5 mr-2" />
                    不喜欢
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  当前满意度: {lyric.satisfactionScore} · 权值: {lyric.weight.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
