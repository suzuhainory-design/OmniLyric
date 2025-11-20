import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Music, ArrowLeft, Sparkles, Plus, X } from "lucide-react";
import { APP_TITLE, getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const LANGUAGES = [
  { code: "zh", name: "中文" },
  { code: "en", name: "English" },
  { code: "ja", name: "日本語" },
  { code: "fr", name: "Français" },
  { code: "ru", name: "Русский" },
  { code: "de", name: "Deutsch" },
];

export default function Create() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [keywords, setKeywords] = useState<string[]>([]);
  const [currentKeyword, setCurrentKeyword] = useState("");
  const [melodyDescription, setMelodyDescription] = useState("");
  const [melodyType, setMelodyType] = useState<"text" | "pattern" | "other">("text");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["zh"]);
  const [allowMixed, setAllowMixed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const utils = trpc.useUtils();

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

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const addKeyword = () => {
    if (currentKeyword.trim() && !keywords.includes(currentKeyword.trim())) {
      setKeywords([...keywords, currentKeyword.trim()]);
      setCurrentKeyword("");
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const toggleLanguage = (langCode: string) => {
    if (selectedLanguages.includes(langCode)) {
      if (selectedLanguages.length > 1) {
        setSelectedLanguages(selectedLanguages.filter(l => l !== langCode));
      }
    } else {
      setSelectedLanguages([...selectedLanguages, langCode]);
    }
  };

  const generateMutation = trpc.generate.generateLyrics.useMutation({
    onSuccess: (lyric) => {
      toast.success("歌词生成成功！");
      utils.lyrics.list.invalidate();
      navigate(`/lyric/${lyric.id}`);
    },
    onError: (error) => {
      toast.error("生成失败: " + error.message);
      setIsGenerating(false);
    },
  });

  const handleGenerate = async () => {
    if (keywords.length === 0) {
      toast.error("请至少添加一个关键词");
      return;
    }
    if (!melodyDescription.trim()) {
      toast.error("请输入旋律描述");
      return;
    }

    setIsGenerating(true);
    toast.info("正在生成歌词，请稍候...");
    
    generateMutation.mutate({
      keywords,
      melodyDescription,
      languages: selectedLanguages,
      isMixed: allowMixed,
    });
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
          <Button variant="ghost" onClick={() => navigate("/history")}>
            历史记录
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">创作歌词</h2>
            <p className="text-muted-foreground">输入关键词和旋律描述，让AI为您创作独特的歌词</p>
          </div>

          {/* Keywords Section */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle>关键词</CardTitle>
              <CardDescription>添加与歌曲主题相关的关键词，系统会自动联网搜索相关内容</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="输入关键词..."
                  value={currentKeyword}
                  onChange={(e) => setCurrentKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addKeyword()}
                  className="bg-background/50"
                />
                <Button onClick={addKeyword}>
                  <Plus className="w-4 h-4 mr-2" />
                  添加
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {keywords.map((keyword) => (
                  <div
                    key={keyword}
                    className="bg-primary/10 text-primary px-3 py-1 rounded-full flex items-center gap-2"
                  >
                    <span>{keyword}</span>
                    <button onClick={() => removeKeyword(keyword)} className="hover:text-primary-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Melody Section */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle>旋律描述</CardTitle>
              <CardDescription>描述歌曲的旋律、节奏和风格</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="melodyType">旋律类型</Label>
                <Select value={melodyType} onValueChange={(v) => setMelodyType(v as any)}>
                  <SelectTrigger id="melodyType" className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">文字描述</SelectItem>
                    <SelectItem value="pattern">节奏模式</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="melodyDesc">旋律描述</Label>
                <Textarea
                  id="melodyDesc"
                  placeholder="例如：欢快的流行风格，4/4拍，中速，副歌部分节奏加快..."
                  value={melodyDescription}
                  onChange={(e) => setMelodyDescription(e.target.value)}
                  rows={4}
                  className="bg-background/50"
                />
              </div>
            </CardContent>
          </Card>

          {/* Language Selection */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle>语言选择</CardTitle>
              <CardDescription>选择歌词使用的语言</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {LANGUAGES.map((lang) => (
                  <div key={lang.code} className="flex items-center space-x-2">
                    <Checkbox
                      id={lang.code}
                      checked={selectedLanguages.includes(lang.code)}
                      onCheckedChange={() => toggleLanguage(lang.code)}
                    />
                    <label
                      htmlFor={lang.code}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {lang.name}
                    </label>
                  </div>
                ))}
              </div>
              <div className="flex items-center space-x-2 pt-2 border-t border-border/50">
                <Checkbox
                  id="allowMixed"
                  checked={allowMixed}
                  onCheckedChange={(checked) => setAllowMixed(checked as boolean)}
                />
                <label
                  htmlFor="allowMixed"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  允许混合语言歌词
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <div className="flex justify-center pt-4">
            <Button
              size="lg"
              className="text-lg px-8 py-6"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2"></div>
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  生成歌词
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
