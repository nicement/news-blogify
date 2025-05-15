
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generateBlogDraft } from "@/ai/flows/generate-blog-draft";
import { elaborateBlogContent } from "@/ai/flows/elaborate-blog-content";
import { ImageSelectionDialog } from "@/components/ImageSelectionDialog";
import { Loader2, Newspaper, Brain, Sparkles, ImagePlus, Edit3, Bot, FileText, Code } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const MOCK_KEYWORDS = [
  "부동산 시장", "AI 발전", "저출산 문제", "K-POP 인기", "주식 투자", 
  "전기차 확대", "기후 변화", "청년 취업", "반도체 경쟁", "OTT 성장"
];

export type ContentFormat = 'markdown' | 'html';

// Helper function to get AI hint from keyword
const getAiHintFromKeyword = (keyword: string | null): string => {
  if (!keyword) return "image";
  return keyword.split(" ").slice(0, 2).join(" ");
};

// Conversion functions for image tags
const convertMarkdownImagesToHtml = (markdown: string, hintKeyword: string | null): string => {
  const aiHint = getAiHintFromKeyword(hintKeyword);
  return markdown.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => {
    // Check if the image is already an HTML tag (e.g. from a previous conversion or direct input)
    // This simple check might not be foolproof for complex mixed content.
    if (src.startsWith('data:image') || src.startsWith('http')) { // Simple check for typical image URLs
         return `<img src="${src}" alt="${alt}" data-ai-hint="${aiHint}" style="max-width: 100%; height: auto; border-radius: 0.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />`;
    }
    return match; // Return original if it doesn't look like a standard MD image link
  });
};

const convertHtmlImagesToMarkdown = (html: string): string => {
  return html.replace(/<img .*?src=["'](.*?)["'].*?alt=["'](.*?)["'].*?(?:data-ai-hint=["'](.*?)["'])?.*?>/gi, (match, src, alt) => {
    return `![${alt}](${src})`;
  });
};


export default function NewsBlogifyPage() {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [blogContent, setBlogContent] = useState<string>(""); // Stores the authoritative version of the content
  const [contentFormat, setContentFormat] = useState<ContentFormat>('markdown');
  
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
    setBlogContent(""); 
    // Ensure content is treated as Markdown initially after generation
    if (contentFormat === 'html') {
      setContentFormat('markdown'); // Switch to Markdown for new draft
    }
    try {
      const result = await generateBlogDraft({ keyword });
      setBlogContent(result.draft); // AI generates Markdown
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
    
    let contentToElaborate = blogContent;
    if (contentFormat === 'html') {
      contentToElaborate = convertHtmlImagesToMarkdown(blogContent);
    }

    try {
      const result = await elaborateBlogContent({ draft: contentToElaborate });
      // AI elaborates on Markdown, result is Markdown
      let newContent = result.elaboratedContent;
      if (contentFormat === 'html') {
        // If user is in HTML mode, convert the new Markdown from AI to HTML for display
        newContent = convertMarkdownImagesToHtml(newContent, selectedKeyword);
      }
      setBlogContent(newContent);
      toast({ title: "상세 내용 생성 완료", description: "블로그 내용이 상세화되었습니다.", variant: "default" });
    } catch (error) {
      console.error("Error elaborating content:", error);
      toast({ title: "오류 발생", description: "상세 내용 생성 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setIsLoadingElaboration(false);
    }
  };

  const handleImageInsert = (updatedContent: string) => {
    setBlogContent(updatedContent); // ImageSelectionDialog provides content in the correct format
    toast({ title: "사진 삽입 완료", description: "선택한 사진이 블로그 내용에 추가되었습니다." });
  };

  const handleFormatChange = useCallback((newFormat: ContentFormat) => {
    if (newFormat === contentFormat || isLoadingDraft || isLoadingElaboration) return;

    if (newFormat === 'html') {
      setBlogContent(prevContent => convertMarkdownImagesToHtml(prevContent, selectedKeyword));
    } else { // Switching to Markdown
      setBlogContent(prevContent => convertHtmlImagesToMarkdown(prevContent));
    }
    setContentFormat(newFormat);
  }, [contentFormat, selectedKeyword, isLoadingDraft, isLoadingElaboration]);


  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 md:p-8 font-sans">
      <header className="w-full max-w-4xl mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-primary flex items-center justify-center gap-3">
          <Bot size={48} /> NewsBlogify
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          오늘의 핫 키워드로 손쉽게 블로그 포스트를 작성하세요. 기사 기반 초안 생성 및 형식 변환 기능 제공!
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
                가장 인기있는 뉴스 키워드 10개를 확인하고 블로그 작성을 시작하세요. 선택한 키워드 관련 기사를 기반으로 초안이 작성됩니다.
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
              <div className="flex items-center space-x-4 mb-4">
                <Label htmlFor="content-format" className="text-base">콘텐츠 형식:</Label>
                <RadioGroup
                  id="content-format"
                  orientation="horizontal"
                  value={contentFormat}
                  onValueChange={(value: string) => handleFormatChange(value as ContentFormat)}
                  className="flex items-center"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="markdown" id="format-markdown" />
                    <Label htmlFor="format-markdown" className="flex items-center gap-1 cursor-pointer">
                      <FileText size={18} /> 마크다운
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="html" id="format-html" />
                    <Label htmlFor="format-html" className="flex items-center gap-1 cursor-pointer">
                      <Code size={18} /> HTML
                    </Label>
                  </div>
                </RadioGroup>
              </div>

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
              "상세 내용 만들기"는 AI를 사용하여 현재 초안을 더 풍부하게 만듭니다. "사진 추가"를 통해 내용에 이미지를 삽입할 수 있습니다. 선택한 콘텐츠 형식(마크다운/HTML)에 따라 이미지 태그가 다르게 삽입되며, 형식 변경 시 내용의 이미지 태그도 변환됩니다. (현재는 Placeholder 이미지만 제공됩니다.)
            </AlertDescription>
          </Alert>
      </main>

      <ImageSelectionDialog
        isOpen={showImageDialog}
        onClose={() => setShowImageDialog(false)}
        currentContent={blogContent} // Pass current blogContent
        onImageInsert={handleImageInsert}
        selectedKeyword={selectedKeyword}
        contentFormat={contentFormat}
      />

      <footer className="mt-12 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} NewsBlogify. AI의 힘으로 콘텐츠 제작을 혁신합니다.</p>
      </footer>
    </div>
  );
}
