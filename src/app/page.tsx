
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generateBlogDraft } from "@/ai/flows/generate-blog-draft";
import { elaborateBlogContent } from "@/ai/flows/elaborate-blog-content";
import { ImageSelectionDialog } from "@/components/ImageSelectionDialog";
import { Loader2, Newspaper, Brain, Sparkles, ImagePlus, Edit3, Bot } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const MOCK_KEYWORDS = [
  "부동산 시장", "AI 발전", "저출산 문제", "K-POP 인기", "주식 투자", 
  "전기차 확대", "기후 변화", "청년 취업", "반도체 경쟁", "OTT 성장"
];

export default function NewsBlogifyPage() {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [blogContent, setBlogContent] = useState<string>("");
  
  const [isLoadingKeywords, setIsLoadingKeywords] = useState<boolean>(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState<boolean>(false);
  const [isLoadingElaboration, setIsLoadingElaboration] = useState<boolean>(false);
  
  const [showImageDialog, setShowImageDialog] = useState<boolean>(false);

  const { toast } = useToast();

  const fetchKeywords = () => {
    setIsLoadingKeywords(true);
    // Simulate API call
    setTimeout(() => {
      setKeywords(MOCK_KEYWORDS);
      setIsLoadingKeywords(false);
      toast({ title: "키워드 로드 완료", description: "가장 핫한 키워드 10개가 표시되었습니다." });
    }, 1000);
  };

  const handleKeywordSelect = async (keyword: string) => {
    setSelectedKeyword(keyword);
    setIsLoadingDraft(true);
    setBlogContent(""); // Clear previous content
    try {
      const result = await generateBlogDraft({ keyword });
      setBlogContent(result.draft);
      toast({ title: "블로그 초안 생성 완료", description: `"${keyword}"에 대한 초안이 생성되었습니다.`, variant: "default" });
    } catch (error) {
      console.error("Error generating blog draft:", error);
      toast({ title: "오류 발생", description: "초안 생성 중 오류가 발생했습니다.", variant: "destructive" });
      setBlogContent("초안 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoadingDraft(false);
    }
  };

  const handleElaborateContent = async () => {
    if (!blogContent) {
      toast({ title: "내용 없음", description: "상세화할 초안 내용이 없습니다.", variant: "destructive" });
      return;
    }
    setIsLoadingElaboration(true);
    try {
      const result = await elaborateBlogContent({ draft: blogContent });
      setBlogContent(result.elaboratedContent);
      toast({ title: "상세 내용 생성 완료", description: "블로그 내용이 상세화되었습니다.", variant: "default" });
    } catch (error) {
      console.error("Error elaborating content:", error);
      toast({ title: "오류 발생", description: "상세 내용 생성 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setIsLoadingElaboration(false);
    }
  };

  const handleImageInsert = (updatedContent: string) => {
    setBlogContent(updatedContent);
    toast({ title: "사진 삽입 완료", description: "선택한 사진이 블로그 내용에 추가되었습니다." });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 md:p-8 font-sans">
      <header className="w-full max-w-4xl mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-primary flex items-center justify-center gap-3">
          <Bot size={48} /> NewsBlogify
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          오늘의 핫 키워드로 손쉽게 블로그 포스트를 작성하세요.
        </p>
      </header>

      <main className="w-full max-w-4xl space-y-8">
        {!selectedKeyword ? (
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Newspaper className="text-primary" />
                오늘의 핫 키워드
              </CardTitle>
              <CardDescription>
                가장 인기있는 뉴스 키워드 10개를 확인하고 블로그 작성을 시작하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {keywords.length === 0 && !isLoadingKeywords && (
                <Button onClick={fetchKeywords} className="w-full text-lg py-6 bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Sparkles className="mr-2" />
                  핫 키워드 불러오기
                </Button>
              )}
              {isLoadingKeywords && (
                <div className="flex justify-center items-center h-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-2 text-muted-foreground">키워드를 불러오는 중...</p>
                </div>
              )}
              {keywords.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {keywords.map((kw) => (
                    <Button
                      key={kw}
                      variant="outline"
                      className="p-4 h-auto text-base border-primary/50 hover:bg-primary/10 hover:text-primary transition-all duration-200"
                      onClick={() => handleKeywordSelect(kw)}
                    >
                      {kw}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Edit3 className="text-primary" />
                블로그 편집기
              </CardTitle>
              <CardDescription>
                선택된 키워드: <span className="font-semibold text-primary">{selectedKeyword}</span>. 아래 내용을 편집하고 기능을 사용하세요.
                 <Button variant="link" className="p-1 h-auto text-sm text-accent" onClick={() => { setSelectedKeyword(null); setBlogContent(''); setKeywords([])} }>다른 키워드 선택</Button>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingDraft ? (
                <div className="flex flex-col justify-center items-center h-60 border border-dashed rounded-md">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="mt-4 text-lg text-muted-foreground">"{selectedKeyword}" 초안 생성 중...</p>
                </div>
              ) : (
                <Textarea
                  value={blogContent}
                  onChange={(e) => setBlogContent(e.target.value)}
                  placeholder="블로그 내용이 여기에 표시됩니다..."
                  rows={15}
                  className="text-base leading-relaxed bg-secondary/30 focus:bg-background transition-colors duration-200 p-4 rounded-md shadow-inner"
                />
              )}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 pt-6">
              <Button
                onClick={handleElaborateContent}
                disabled={isLoadingElaboration || isLoadingDraft || !blogContent}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isLoadingElaboration ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Brain className="mr-2" />
                )}
                상세 내용 만들기 (AI)
              </Button>
              <Button
                onClick={() => setShowImageDialog(true)}
                disabled={isLoadingDraft || !blogContent}
                variant="outline"
                className="w-full sm:w-auto border-accent text-accent hover:bg-accent/10"
              >
                <ImagePlus className="mr-2" />
                사진 추가
              </Button>
            </CardFooter>
          </Card>
        )}
         <Alert className="mt-8 bg-secondary/50 border-primary/30">
            <Bot className="h-5 w-5 text-primary" />
            <AlertTitle className="font-semibold text-primary">AI 지원 기능</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              "상세 내용 만들기"는 AI를 사용하여 현재 초안을 더 풍부하게 만듭니다. "사진 추가"를 통해 내용에 이미지를 삽입할 수 있습니다. (현재는 Placeholder 이미지만 제공됩니다.)
            </AlertDescription>
          </Alert>
      </main>

      <ImageSelectionDialog
        isOpen={showImageDialog}
        onClose={() => setShowImageDialog(false)}
        currentContent={blogContent}
        onImageInsert={handleImageInsert}
        selectedKeyword={selectedKeyword}
      />

      <footer className="mt-12 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} NewsBlogify. AI의 힘으로 콘텐츠 제작을 혁신합니다.</p>
      </footer>
    </div>
  );
}
