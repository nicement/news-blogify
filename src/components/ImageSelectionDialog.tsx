
"use client";

import type React from "react";
import { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle, Image as ImageIcon, Loader2, Search } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ContentFormat } from "@/app/page";
import { fetchPixabayImages } from "@/ai/flows/fetch-pixabay-images";
import type { PixabayImage } from "@/ai/flows/fetch-pixabay-images";
import { useToast } from "@/hooks/use-toast";

interface ImageSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentContent: string;
  onImageInsert: (updatedContent: string) => void;
  selectedKeyword: string | null; // Main keyword for the blog post
  contentFormat: ContentFormat;
}

export function ImageSelectionDialog({
  isOpen,
  onClose,
  currentContent,
  onImageInsert,
  selectedKeyword,
  contentFormat,
}: ImageSelectionDialogProps) {
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedImageAlt, setSelectedImageAlt] = useState<string>("");
  const [selectedSectionIndex, setSelectedSectionIndex] = useState<string | undefined>(undefined);
  
  const [fetchedImages, setFetchedImages] = useState<PixabayImage[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState<boolean>(false);
  const [customSearchQuery, setCustomSearchQuery] = useState<string>("");
  const [activeSearchTerm, setActiveSearchTerm] = useState<string | null>(null);

  const { toast } = useToast();

  const blogSections = useMemo(() => {
    if (!currentContent) return [];
    return currentContent.split("\n\n").map((content, index) => ({
      id: index.toString(),
      name: content.substring(0, 80).trim() + (content.length > 80 ? "..." : "") || `Paragraph ${index + 1}`,
      originalContent: content,
    }));
  }, [currentContent]);

  const aiHintForInsertion = useMemo(() => {
    const term = activeSearchTerm || selectedImageAlt || "image";
    return term.split(" ").slice(0, 2).join(" ");
  }, [activeSearchTerm, selectedImageAlt]);

  const loadImages = useCallback(async (queryOverride?: string) => {
    if (!isOpen) {
      setFetchedImages([]);
      return;
    }

    const searchTerm = queryOverride !== undefined ? queryOverride : (customSearchQuery.trim() || selectedKeyword);

    if (!searchTerm || searchTerm.trim() === "") {
      toast({
        title: "검색어 필요",
        description: "이미지를 검색할 키워드가 없습니다. 블로그 키워드를 사용하거나 검색어를 직접 입력해주세요.",
        variant: "destructive",
      });
      setFetchedImages([]);
      setActiveSearchTerm(null);
      return;
    }

    setIsLoadingImages(true);
    setSelectedImageUrl(null); 
    setActiveSearchTerm(searchTerm.trim());
    
    try {
      const result = await fetchPixabayImages({ query: searchTerm.trim(), count: 6 });
      if (result.images.length === 0 && process.env.NEXT_PUBLIC_PIXABAY_API_KEY) {
        toast({
          title: "이미지 없음",
          description: `"${searchTerm.trim()}" 관련 이미지를 Pixabay에서 찾을 수 없습니다. 다른 키워드로 시도해보세요.`,
          variant: "default",
        });
      } else if (result.images.length === 0 && !process.env.NEXT_PUBLIC_PIXABAY_API_KEY) {
         toast({
          title: "API 키 필요",
          description: `Pixabay 이미지를 로드하려면 .env 파일에 NEXT_PUBLIC_PIXABAY_API_KEY 를 설정해야 합니다. 현재 키가 없어 이미지를 가져올 수 없습니다.`,
          variant: "destructive",
        });
      }
      setFetchedImages(result.images);
    } catch (error) {
      console.error("Error fetching Pixabay images:", error);
      toast({
        title: "이미지 로드 오류",
        description: "Pixabay 이미지를 가져오는 중 오류가 발생했습니다. API키 또는 네트워크 연결을 확인해주세요.",
        variant: "destructive",
      });
      setFetchedImages([]);
    } finally {
      setIsLoadingImages(false);
    }
  }, [isOpen, selectedKeyword, toast, customSearchQuery]);

  useEffect(() => {
    if (isOpen) {
      const initialQuery = selectedKeyword || "";
      setCustomSearchQuery(initialQuery); // Set customSearchQuery to the main blog keyword initially
      if (initialQuery.trim() !== "") {
        loadImages(initialQuery); // Load images based on the main blog keyword when dialog opens
      } else {
        // If no selectedKeyword, don't auto-search, clear previous results.
        setFetchedImages([]);
        setActiveSearchTerm(null);
      }
    } else {
      // Reset states when dialog closes
      setFetchedImages([]);
      setSelectedImageUrl(null);
      setSelectedSectionIndex(undefined);
      setIsLoadingImages(false);
      setCustomSearchQuery("");
      setActiveSearchTerm(null);
    }
  }, [isOpen, selectedKeyword, loadImages]); // Rely on loadImages useCallback dependencies

  const handleImageSelect = (image: PixabayImage) => {
    setSelectedImageUrl(image.webformatURL); 
    setSelectedImageAlt(image.tags || activeSearchTerm || "selected image");
  };

  const handlePerformCustomSearch = () => {
    if (customSearchQuery.trim()) {
      loadImages(customSearchQuery.trim());
    } else {
      toast({
        title: "검색어 입력 필요",
        description: "이미지를 검색할 키워드를 입력해주세요.",
        variant: "destructive",
      });
    }
  };

  const handleInsert = () => {
    if (!selectedImageUrl || selectedSectionIndex === undefined) {
      toast({
        title: "선택 필요",
        description: "삽입할 이미지와 위치를 모두 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    const sectionIdx = parseInt(selectedSectionIndex, 10);
    if (isNaN(sectionIdx) || sectionIdx < 0 || sectionIdx >= blogSections.length) {
       toast({
        title: "잘못된 항목",
        description: "유효하지 않은 항목이 선택되었습니다.",
        variant: "destructive",
      });
      return;
    }
    
    const altTextForInsertion = selectedImageAlt || "image";
    let imageTag = "";

    if (contentFormat === 'html') {
      imageTag = `\n\n<img src="${selectedImageUrl}" alt="${altTextForInsertion}" data-ai-hint="${aiHintForInsertion}" style="max-width: 100%; height: auto; border-radius: 0.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />\n\n`;
    } else { 
      imageTag = `\n\n![${altTextForInsertion}](${selectedImageUrl})\n\n`;
    }
    
    const updatedSections = blogSections.map((section, index) => {
      if (index === sectionIdx) {
        return section.originalContent + imageTag;
      }
      return section.originalContent;
    });

    onImageInsert(updatedSections.join("\n\n"));
    setSelectedImageUrl(null);
    setSelectedImageAlt("");
    setSelectedSectionIndex(undefined);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[700px] bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon /> 사진 추가 (Pixabay 이미지 검색)
          </DialogTitle>
          <DialogDescription>
            블로그 항목 내용으로 검색어를 자동 완성하거나, 직접 키워드를 입력하여 이미지를 검색하세요. 
            삽입할 사진과 위치를 선택한 후 "사진 삽입" 버튼을 누르세요.
            {activeSearchTerm && <span className="block mt-1">현재 "<span className="font-semibold text-primary">{activeSearchTerm}</span>" 관련 이미지 표시 중</span>}
          </DialogDescription>
        </DialogHeader>
        
        {/* Section to select blog paragraph for search query */}
        {blogSections.length > 0 && (
          <div className="space-y-1 my-3">
            <Label htmlFor="search-by-section-select" className="text-sm text-muted-foreground">또는 블로그 항목에서 검색어 가져오기:</Label>
            <Select
              onValueChange={(sectionId) => {
                if (!sectionId) return;
                const selectedSec = blogSections.find(s => s.id === sectionId);
                if (selectedSec) {
                  const queryFromName = selectedSec.name.replace(/ \.\.\.$/, ''); // Remove ellipsis for cleaner query
                  setCustomSearchQuery(queryFromName);
                  // Optionally auto-search: loadImages(queryFromName); 
                }
              }}
            >
              <SelectTrigger id="search-by-section-select" className="w-full bg-background text-foreground border-input text-sm">
                <SelectValue placeholder="항목 선택하여 검색어 자동 입력..." />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground">
                {blogSections.map((section, index) => (
                  <SelectItem key={`search-sec-${section.id}`} value={section.id} className="hover:bg-accent/50 text-sm">
                    {`항목 ${index + 1}: ${section.name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Custom search input and button */}
        <div className="flex items-center gap-2 my-4">
          <Input 
            type="text"
            placeholder="검색할 이미지 키워드 입력..."
            value={customSearchQuery}
            onChange={(e) => setCustomSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handlePerformCustomSearch(); }}
            className="bg-background focus:ring-primary"
          />
          <Button onClick={handlePerformCustomSearch} disabled={isLoadingImages} variant="outline" className="border-primary text-primary hover:bg-primary/10">
            <Search className="mr-2 h-4 w-4" /> 검색
          </Button>
        </div>

        {isLoadingImages ? (
          <div className="h-[300px] flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-2 text-muted-foreground">"{activeSearchTerm || '키워드'}" 관련 이미지를 Pixabay에서 검색 중...</p>
          </div>
        ) : !selectedImageUrl ? (
          <>
            {fetchedImages.length === 0 && !isLoadingImages && activeSearchTerm && (
              <Alert variant="default" className="my-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>이미지를 찾을 수 없음</AlertTitle>
                <AlertDescription>
                  "{activeSearchTerm}"에 대한 이미지를 Pixabay에서 찾을 수 없었습니다.
                  다른 키워드로 시도해보거나, Pixabay API 키가 `.env` 파일에 `NEXT_PUBLIC_PIXABAY_API_KEY`로 올바르게 설정되었는지 확인해주세요.
                  (API 키가 설정되어 있어도 해당 키워드의 이미지가 없을 수 있습니다.)
                </AlertDescription>
              </Alert>
            )}
             {fetchedImages.length === 0 && !isLoadingImages && !activeSearchTerm && (
                 <Alert variant="default" className="my-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>검색 시작</AlertTitle>
                    <AlertDescription>
                    위 입력창에 키워드를 입력하고 검색 버튼을 누르거나, 블로그 항목을 선택하여 검색어를 자동으로 채워 검색하세요. 
                    Pixabay API 키가 `.env` 파일에 `NEXT_PUBLIC_PIXABAY_API_KEY`로 설정되어 있어야 합니다.
                    </AlertDescription>
                </Alert>
            )}
            <ScrollArea className="h-[300px] p-1 border rounded-md bg-secondary/30">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
                {fetchedImages.map((img) => (
                  <div
                    key={img.id}
                    className="cursor-pointer border-2 border-transparent hover:border-primary rounded-lg overflow-hidden shadow-md transition-all duration-200 aspect-video group relative bg-background"
                    onClick={() => handleImageSelect(img)}
                    data-ai-hint={img.tags.split(',')[0] || aiHintForInsertion} // Use first tag for hint
                  >
                    <Image
                      src={img.previewURL || img.webformatURL} // Prefer previewURL for grid
                      alt={img.tags || `Pixabay image for ${activeSearchTerm || 'search'}`}
                      layout="fill"
                      objectFit="cover"
                      className="transition-transform duration-300 group-hover:scale-105"
                    />
                     <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-1 text-xs truncate backdrop-blur-sm">
                        {img.tags.split(',')[0] || 'Untitled'}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        ) : (
          // Image selected, show preview and section selection for insertion
          <div className="p-4 space-y-4 h-[300px] flex flex-col justify-center">
            <Alert variant="default" className="bg-secondary text-secondary-foreground border-primary/50">
              <CheckCircle className="h-5 w-5 text-primary" />
              <AlertTitle className="text-primary">사진 선택됨</AlertTitle>
              <AlertDescription>
                이제 이 사진을 삽입할 블로그 항목(단락)을 선택해주세요.
                <br /> Alt 텍스트: <span className="font-medium">{selectedImageAlt}</span>
              </AlertDescription>
            </Alert>
            <div className="flex justify-center items-center max-h-[150px]">
              <Image
                src={selectedImageUrl} // Use webformatURL for better quality preview if selected
                alt={selectedImageAlt} 
                width={250}
                height={150}
                className="rounded-md border shadow-md object-contain max-h-[150px] h-auto w-auto"
                data-ai-hint={aiHintForInsertion} 
              />
            </div>
            
            {blogSections.length > 0 ? (
              <div className="space-y-2">
                <Label htmlFor="section-select" className="text-foreground">삽입할 항목 선택:</Label>
                <Select value={selectedSectionIndex} onValueChange={setSelectedSectionIndex}>
                  <SelectTrigger id="section-select" className="w-full bg-background text-foreground border-input">
                    <SelectValue placeholder="항목을 선택하세요..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground">
                    {blogSections.map((section, index) => (
                      <SelectItem key={`insert-sec-${section.id}`} value={section.id} className="hover:bg-accent/50">
                        {`항목 ${index + 1}: ${section.name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
               <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>항목 없음</AlertTitle>
                  <AlertDescription>
                    블로그 내용이 없습니다. 이미지를 삽입할 항목을 찾을 수 없습니다.
                  </AlertDescription>
                </Alert>
            )}
          </div>
        )}

        <DialogFooter className="sm:justify-between mt-4 pt-4 border-t">
            {selectedImageUrl && ( // Show "Select Another Image" only if an image is selected
                 <Button variant="outline" onClick={() => {setSelectedImageUrl(null); setSelectedImageAlt(""); /* Keep customSearchQuery */ }} className="mb-2 sm:mb-0">
                    다른 사진 선택
                </Button>
            )}
           {/* Conditional Spacer or reload button */}
           {!selectedImageUrl && fetchedImages.length > 0 && <div className="hidden sm:block" /> /* Spacer */}
           {!selectedImageUrl && (fetchedImages.length === 0 && !isLoadingImages) && ( // Show reload if no images and not loading
             <Button variant="outline" onClick={() => loadImages(customSearchQuery || selectedKeyword || undefined)} className="mb-2 sm:mb-0">
                이미지 다시 로드
            </Button>
           )}

          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} className="">
              취소
            </Button>
            <Button
              onClick={handleInsert}
              disabled={!selectedImageUrl || selectedSectionIndex === undefined || blogSections.length === 0 || isLoadingImages}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              사진 삽입 ({contentFormat === 'html' ? 'HTML' : '마크다운'})
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    
