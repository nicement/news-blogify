
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generateBlogDraft } from "@/ai/flows/generate-blog-draft";
import type { NaverNewsKeywordItem, FetchNaverNewsKeywordsInput } from "@/ai/flows/fetch-naver-news-keywords";
import { fetchNaverNewsKeywords } from "@/ai/flows/fetch-naver-news-keywords";
import { elaborateBlogContent } from "@/ai/flows/elaborate-blog-content";
import { ImageSelectionDialog } from "@/components/ImageSelectionDialog";
import {
  Loader2,
  Newspaper,
  Brain,
  Sparkles,
  ImagePlus,
  Edit3,
  Bot,
  FileText,
  Code,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type ContentFormat = "markdown" | "html";

const newsCategories = [
  { name: "정치", id: "100" },
  { name: "경제", id: "101" },
  { name: "사회", id: "102" },
  { name: "생활/문화", id: "103" },
  { name: "IT/과학", id: "105" },
  { name: "세계", id: "104" },
];

const getAiHintFromKeyword = (keyword: string | null): string => {
  if (!keyword) return "image";
  return keyword.split(" ").slice(0, 2).join(" ");
};

const convertMarkdownToHtml = (
  markdown: string,
  hintKeyword: string | null
): string => {
  let html = markdown;

  // Block elements
  // Headings H1-H6
  html = html.replace(/^(#{1,6})\s+(.*)$/gm, (match, hashes, content) => {
    const level = hashes.length;
    return `<h${level}>${content.trim()}</h${level}>`;
  });
  // Horizontal Rule
  html = html.replace(/^(\*\*\*|---|___)\s*$/gm, "<hr />");

  // Inline elements (order can matter)
  // Images
  const aiHint = getAiHintFromKeyword(hintKeyword);
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => {
    if (src.startsWith("data:image") || src.startsWith("http")) {
      return `<img src="${src}" alt="${
        alt || ""
      }" data-ai-hint="${aiHint}" style="max-width: 100%; height: auto; border-radius: 0.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />`;
    }
    return match; 
  });

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-accent hover:underline">$1</a>'
  );

  // Bold (handles **text** and __text__)
  html = html.replace(
    /(?:\*\*|__)(?=\S)(.+?)(?<=\S)(?:\*\*|__)/g,
    "<strong>$1</strong>"
  );

  // Italic (handles *text* and _text_)
  html = html.replace(/(?:\*|_)(?=\S)(.+?)(?<=\S)(?:\*|_)/g, "<em>$1</em>");

  const blocks = html.split("\n");
  let resultOutput = "";
  let currentParagraphContent = "";

  for (let i = 0; i < blocks.length; i++) {
    const line = blocks[i];
    const trimmedLine = line.trim();

    if (
      trimmedLine.startsWith("<h") ||
      trimmedLine.startsWith("<img") ||
      trimmedLine.startsWith("<hr") ||
      (/<a[^>]*>/.test(trimmedLine) && /<\/a>/.test(trimmedLine))
    ) {
      if (currentParagraphContent) {
        resultOutput += `<p>${currentParagraphContent
          .trim()
          .replace(/\n/g, "<br />")}</p>\n`;
        currentParagraphContent = "";
      }
      resultOutput += line + "\n";
    } else if (trimmedLine === "") {
      if (currentParagraphContent) {
        resultOutput += `<p>${currentParagraphContent
          .trim()
          .replace(/\n/g, "<br />")}</p>\n`;
        currentParagraphContent = "";
      }
      resultOutput += "\n"; 
    } else {
      currentParagraphContent += (currentParagraphContent ? "\n" : "") + line;
    }
  }
  if (currentParagraphContent) {
    resultOutput += `<p>${currentParagraphContent
      .trim()
      .replace(/\n/g, "<br />")}</p>\n`;
  }
  html = resultOutput.replace(/\n\n\n+/g, "\n\n").trim();
  return html;
};

const convertHtmlToMarkdown = (html: string): string => {
  let markdown = html;
  markdown = markdown.replace(/<br\s*\/?>/gi, "\n");
  markdown = markdown.replace(
    /<h([1-6])[^>]*>(.*?)<\/h\1>/gi,
    (match, level, content) => {
      return `${"#".repeat(parseInt(level, 10))} ${content.trim()}`;
    }
  );
  markdown = markdown.replace(/<hr\s*\/?>/gi, "---");
  markdown = markdown.replace(
    /<img\s+(?:[^>]*?\s+)?src=["'](.*?)["']\s*(?:[^>]*?\s+)?alt=["'](.*?)["'](?:[^>]*?)?(?:\/>|\s*\/?>)/gi,
    "![$2]($1)"
  );
  markdown = markdown.replace(
    /<a\s+(?:[^>]*?\s+)?href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi,
    "[$2]($1)"
  );
  markdown = markdown.replace(/<(strong|b)>(.*?)<\/\1>/gi, "**$2**");
  markdown = markdown.replace(/<(em|i)>(.*?)<\/\1>/gi, "*$1*");
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n");
  markdown = markdown.replace(/<\/?[^>]+(>|$)/g, "");
  markdown = markdown
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n\n");
  markdown = markdown.replace(/\n{3,}/g, "\n\n");
  return markdown.trim();
};

export default function NewsBlogifyPage() {
  const [keywords, setKeywords] = useState<NaverNewsKeywordItem[]>([]);
  const [selectedKeywordItem, setSelectedKeywordItem] =
    useState<NaverNewsKeywordItem | null>(null);
  const [blogContent, setBlogContent] = useState<string>("");
  const [contentFormat, setContentFormat] = useState<ContentFormat>("markdown");

  const [isLoadingKeywords, setIsLoadingKeywords] = useState<boolean>(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState<boolean>(false);
  const [isLoadingElaboration, setIsLoadingElaboration] =
    useState<boolean>(false);
  
  const [currentLoadingCategory, setCurrentLoadingCategory] = useState<string | null>(null);


  const [showImageDialog, setShowImageDialog] = useState<boolean>(false);
  const [sourceArticleTitleForDisplay, setSourceArticleTitleForDisplay] =
    useState<string | null>(null);
  const [currentCategoryName, setCurrentCategoryName] = useState<string | null>(null);


  const { toast } = useToast();

  const handleFetchKeywords = async (categoryId: string, categoryName: string) => {
    setIsLoadingKeywords(true);
    setCurrentLoadingCategory(categoryName);
    setKeywords([]);
    setSelectedKeywordItem(null); // Clear previous selection when fetching new category
    setBlogContent(""); // Clear blog content
    setSourceArticleTitleForDisplay(null);
    setCurrentCategoryName(categoryName);


    try {
      const result = await fetchNaverNewsKeywords({ categoryId });
      if (result.keywords && result.keywords.length > 0) {
        setKeywords(result.keywords);
        toast({
          title: `${categoryName} 키워드 로드 완료`,
          description: `네이버 뉴스 ${categoryName} 랭킹 키워드 ${
            result.keywords.length
          }개가 로드되었습니다.`,
        });
      } else {
        toast({
          title: "키워드 없음",
          description:
            `네이버 뉴스 ${categoryName} 분야에서 키워드를 가져오지 못했습니다. 스크래핑 로직을 확인하거나 잠시 후 다시 시도해주세요.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`Error fetching Naver news keywords for category ${categoryName}:`, error);
      toast({
        title: "오류 발생",
        description:
          `${categoryName} 키워드 로드 중 오류가 발생했습니다. 서버 측 스크래핑 로직을 확인해주세요.`,
        variant: "destructive",
      });
    } finally {
      setIsLoadingKeywords(false);
      setCurrentLoadingCategory(null);
    }
  };

  const handleKeywordSelect = async (keywordItem: NaverNewsKeywordItem) => {
    setSelectedKeywordItem(keywordItem);
    setIsLoadingDraft(true);
    setBlogContent("");
    setSourceArticleTitleForDisplay(null);
    if (contentFormat === "html") {
      setContentFormat("markdown");
    }
    try {
      const result = await generateBlogDraft({
        articleUrl: keywordItem.articleUrl,
        keyword: keywordItem.keyword,
      });
      setBlogContent(result.draft); 
      setSourceArticleTitleForDisplay(
        result.sourceArticleTitle || keywordItem.keyword
      );
      toast({
        title: "블로그 초안 생성 완료",
        description: `"${
          result.sourceArticleTitle || keywordItem.keyword
        }" 기사 기반 초안이 생성되었습니다.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error generating blog draft:", error);
      toast({
        title: "오류 발생",
        description:
          "초안 생성 중 오류가 발생했습니다. 서버 측 스크래핑 및 AI 생성 로직을 확인해주세요.",
        variant: "destructive",
      });
      setBlogContent(
        "초안 생성에 실패했습니다. 실제 기사 내용을 가져오는 데 실패했거나 AI 생성 중 문제가 발생했을 수 있습니다. 서버 로그를 확인해주세요."
      );
    } finally {
      setIsLoadingDraft(false);
    }
  };

  const handleElaborateContent = async () => {
    if (!blogContent) {
      toast({
        title: "내용 없음",
        description: "상세화할 초안 내용이 없습니다.",
        variant: "destructive",
      });
      return;
    }
    setIsLoadingElaboration(true);

    let contentToElaborate = blogContent;
    if (contentFormat === "html") {
      contentToElaborate = convertHtmlToMarkdown(blogContent);
    }

    try {
      const result = await elaborateBlogContent({ draft: contentToElaborate });
      let newContent = result.elaboratedContent; 
      if (contentFormat === "html") {
        newContent = convertMarkdownToHtml(
          newContent,
          selectedKeywordItem?.keyword || null
        );
      }
      setBlogContent(newContent);
      toast({
        title: "상세 내용 생성 완료",
        description: "블로그 내용이 상세화되었습니다.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error elaborating content:", error);
      toast({
        title: "오류 발생",
        description: "상세 내용 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingElaboration(false);
    }
  };

  const handleImageInsert = (updatedContent: string) => {
    setBlogContent(updatedContent);
    toast({
      title: "사진 삽입 완료",
      description: "선택한 사진이 블로그 내용에 추가되었습니다.",
    });
  };

  const handleFormatChange = useCallback(
    (newFormat: ContentFormat) => {
      if (newFormat === contentFormat || isLoadingDraft || isLoadingElaboration)
        return;

      setBlogContent((prevContent) => {
        if (newFormat === "html") {
          return convertMarkdownToHtml(
            prevContent,
            selectedKeywordItem?.keyword || null
          );
        } else {
          return convertHtmlToMarkdown(prevContent);
        }
      });
      setContentFormat(newFormat);
    },
    [contentFormat, selectedKeywordItem, isLoadingDraft, isLoadingElaboration]
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 md:p-8 font-sans">
      <header className="w-full max-w-4xl mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-primary flex items-center justify-center gap-3">
          <Bot size={48} /> NewsBlogify
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          네이버 뉴스 랭킹 키워드로 손쉽게 블로그 포스트를 작성하세요. 실제 기사
          기반 초안 생성 및 형식 변환 기능 제공!
        </p>
      </header>

      <main className="w-full max-w-4xl space-y-8">
        {!selectedKeywordItem ? (
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Newspaper className="text-primary" />
                {currentCategoryName ? `${currentCategoryName} 뉴스 랭킹 키워드` : "뉴스 분야 선택"}
              </CardTitle>
              <CardDescription>
                {currentCategoryName
                  ? `선택된 "${currentCategoryName}" 분야의 인기 뉴스 키워드(기사 제목)입니다. 키워드를 선택하여 블로그 초안 작성을 시작하세요.`
                  : "관심있는 뉴스 분야를 선택하여 랭킹 키워드를 확인하고 블로그 작성을 시작하세요."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {keywords.length === 0 && !isLoadingKeywords && (
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {newsCategories.map((category) => (
                    <Button
                        key={category.id}
                        onClick={() => handleFetchKeywords(category.id, category.name)}
                        className="w-full text-md py-5 bg-accent hover:bg-accent/90 text-accent-foreground flex items-center justify-center"
                        disabled={isLoadingKeywords}
                    >
                        {isLoadingKeywords && currentLoadingCategory === category.name ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                        <Sparkles className="mr-2 h-5 w-5" />
                        )}
                        {category.name}
                    </Button>
                    ))}
                </div>
              )}
              {isLoadingKeywords && currentLoadingCategory &&(
                <div className="flex justify-center items-center h-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-2 text-muted-foreground">
                    {currentLoadingCategory} 분야 키워드를 불러오는 중...
                  </p>
                </div>
              )}
              {keywords.length > 0 && (
                <>
                <Button 
                    variant="outline" 
                    onClick={() => {
                        setKeywords([]); 
                        setCurrentCategoryName(null);
                        setSelectedKeywordItem(null);
                    }} 
                    className="mb-4 w-full sm:w-auto"
                    disabled={isLoadingKeywords}
                >
                    다른 분야 선택하기
                </Button>
                <div className="space-y-2">
                  {keywords.map((kwItem) => (
                    <Button
                      key={kwItem.articleUrl}
                      variant="outline"
                      className="w-full justify-start p-4 h-auto text-base border-primary/50 hover:bg-primary/10 hover:text-primary transition-all duration-200 text-left"
                      onClick={() => handleKeywordSelect(kwItem)}
                      title={kwItem.keyword}
                    >
                      <span className="font-semibold mr-2 text-primary">
                        {kwItem.rank}.
                      </span>
                      <span className="truncate flex-grow">
                        {kwItem.keyword}
                      </span>
                      <a
                        href={kwItem.articleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="ml-2 text-sm text-muted-foreground hover:text-accent flex-shrink-0"
                        title="뉴스 원문 보기"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </Button>
                  ))}
                </div>
                </>
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
              <CardDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="truncate">
                  선택된 기사:{" "}
                  <span
                    className="font-semibold text-primary"
                    title={selectedKeywordItem.keyword}
                  >
                    {selectedKeywordItem.keyword}
                  </span>
                  {selectedKeywordItem.articleUrl && (
                    <a
                      href={selectedKeywordItem.articleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-xs text-muted-foreground hover:text-accent inline-flex items-center"
                      title="원본 기사 보기"
                    >
                      <ExternalLink size={12} className="mr-1" /> 원본 보기
                    </a>
                  )}
                </div>
                <Button
                  variant="link"
                  className="p-1 h-auto text-sm text-accent mt-1 sm:mt-0 self-start sm:self-center flex-shrink-0"
                  onClick={() => {
                    setSelectedKeywordItem(null);
                    setBlogContent("");
                    // setKeywords([]); // Keep keywords if user wants to select another from same category
                    setSourceArticleTitleForDisplay(null);
                    if (contentFormat === "html") setContentFormat("markdown");
                  }}
                >
                  다른 기사 선택
                </Button>
              </CardDescription>
              {currentCategoryName && (
                 <p className="text-sm text-muted-foreground">
                    현재 "<span className="font-medium">{currentCategoryName}</span>" 분야의 기사로 작업 중입니다.
                  </p>
              )}
              {sourceArticleTitleForDisplay && (
                <p className="text-sm text-muted-foreground">
                  블로그 초안은 "
                  <span className="font-medium">
                    {sourceArticleTitleForDisplay}
                  </span>
                  " 기사를 기반으로 작성되었습니다.
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4 mb-4">
                <Label htmlFor="content-format" className="text-base">
                  콘텐츠 형식:
                </Label>
                <RadioGroup
                  id="content-format"
                  orientation="horizontal"
                  value={contentFormat}
                  onValueChange={(value: string) =>
                    handleFormatChange(value as ContentFormat)
                  }
                  className="flex items-center"
                  disabled={isLoadingDraft || isLoadingElaboration}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="markdown" id="format-markdown" />
                    <Label
                      htmlFor="format-markdown"
                      className="flex items-center gap-1 cursor-pointer"
                    >
                      <FileText size={18} /> 마크다운
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="html" id="format-html" />
                    <Label
                      htmlFor="format-html"
                      className="flex items-center gap-1 cursor-pointer"
                    >
                      <Code size={18} /> HTML
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {isLoadingDraft ? (
                <div className="flex flex-col justify-center items-center h-60 border border-dashed rounded-md">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="mt-4 text-lg text-muted-foreground">
                    "{selectedKeywordItem?.keyword}" 기사 기반 초안 생성 중...
                  </p>
                  <p className="text-sm text-muted-foreground">
                    (실제 기사 내용을 가져오고 AI가 처리하는 중입니다...)
                  </p>
                </div>
              ) : (
                <Textarea
                  value={blogContent}
                  onChange={(e) => setBlogContent(e.target.value)}
                  placeholder="블로그 내용이 여기에 표시됩니다..."
                  rows={15}
                  className="text-base leading-relaxed bg-secondary/30 focus:bg-background transition-colors duration-200 p-4 rounded-md shadow-inner"
                  disabled={isLoadingElaboration}
                />
              )}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 pt-6">
              <Button
                onClick={handleElaborateContent}
                disabled={
                  isLoadingElaboration || isLoadingDraft || !blogContent
                }
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
                disabled={
                  isLoadingDraft || !blogContent || isLoadingElaboration
                }
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
          <AlertTitle className="font-semibold text-primary">
            AI 지원 기능 및 웹 스크래핑 안내
          </AlertTitle>
          <AlertDescription className="text-muted-foreground">
            "상세 내용 만들기"는 AI를 사용하여 현재 초안을 더 풍부하게 만듭니다.
            "사진 추가"를 통해 내용에 이미지를 삽입할 수 있습니다. (Pixabay API
            키를 .env 파일에 설정해야 합니다.) 네이버 뉴스 스크래핑은 실제 환경 및 네이버의 정책에 따라 작동하지 않을 수 있습니다.
          </AlertDescription>
        </Alert>
      </main>

      <ImageSelectionDialog
        isOpen={showImageDialog}
        onClose={() => setShowImageDialog(false)}
        currentContent={blogContent}
        onImageInsert={handleImageInsert}
        selectedKeyword={selectedKeywordItem?.keyword || currentCategoryName || null}
        contentFormat={contentFormat}
      />

      <footer className="mt-12 text-center text-muted-foreground text-sm">
        <p>
          &copy; {new Date().getFullYear()} NewsBlogify. AI의 힘으로 콘텐츠
          제작을 혁신합니다.
        </p>
      </footer>
    </div>
  );
}
