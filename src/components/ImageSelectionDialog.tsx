
"use client";

import type * as React from "react";
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
import { AlertCircle, CheckCircle, Image as ImageIcon, Loader2 } from "lucide-react";
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
  selectedKeyword: string | null;
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
  const { toast } = useToast();

  const blogSections = useMemo(() => {
    if (!currentContent) return [];
    return currentContent.split("\n\n").map((content, index) => ({
      id: index.toString(),
      name: content.substring(0, 50).trim() + (content.length > 50 ? "..." : "") || `Paragraph ${index + 1}`,
      originalContent: content,
    }));
  }, [currentContent]);

  const aiHint = useMemo(() => selectedKeyword ? selectedKeyword.split(" ").slice(0, 2).join(" ") : "image", [selectedKeyword]);

  const loadImages = useCallback(async () => {
    if (!isOpen || !selectedKeyword) {
      setFetchedImages([]);
      return;
    }
    setIsLoadingImages(true);
    setSelectedImageUrl(null); // Reset selection when new images are loaded
    try {
      const result = await fetchPixabayImages({ query: selectedKeyword, count: 6 });
      if (result.images.length === 0) {
        toast({
          title: "이미지 없음",
          description: `"${selectedKeyword}" 관련 이미지를 Pixabay에서 찾을 수 없습니다. 다른 키워드로 시도해보세요. (Pixabay API 키가 .env에 PIXABAY_API_KEY로 설정되어 있는지 확인해주세요.)`,
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
  }, [isOpen, selectedKeyword, toast]);

  useEffect(() => {
    if (isOpen) {
      loadImages();
    } else {
      // Reset state when dialog is closed
      setFetchedImages([]);
      setSelectedImageUrl(null);
      setSelectedSectionIndex(undefined);
      setIsLoadingImages(false);
    }
  }, [isOpen, loadImages]);

  const handleImageSelect = (image: PixabayImage) => {
    setSelectedImageUrl(image.webformatURL); // Use webformatURL for insertion
    setSelectedImageAlt(image.tags || aiHint); // Use image tags or aiHint as alt text
  };

  const handleInsert = () => {
    if (!selectedImageUrl || selectedSectionIndex === undefined) {
      return;
    }

    const sectionIdx = parseInt(selectedSectionIndex, 10);
    if (isNaN(sectionIdx) || sectionIdx < 0 || sectionIdx >= blogSections.length) {
      return;
    }
    
    const altTextForInsertion = selectedImageAlt || "image";
    let imageTag = "";

    if (contentFormat === 'html') {
      imageTag = `\n\n<img src="${selectedImageUrl}" alt="${altTextForInsertion}" data-ai-hint="${aiHint}" style="max-width: 100%; height: auto; border-radius: 0.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />\n\n`;
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
            <ImageIcon /> 사진 추가 (Add Photo from Pixabay)
          </DialogTitle>
          <DialogDescription>
            항목에 추가할 사진을 선택하고, 사진을 삽입할 위치를 지정해주세요. 
            선택한 형식({contentFormat === 'html' ? 'HTML' : '마크다운'})으로 사진이 삽입됩니다.
            {selectedKeyword && <span className="block mt-1">현재 검색어: <span className="font-semibold text-primary">{selectedKeyword}</span></span>}
          </DialogDescription>
        </DialogHeader>
        
        {isLoadingImages ? (
          <div className="h-[400px] flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-2 text-muted-foreground">"{selectedKeyword}" 관련 이미지를 Pixabay에서 검색 중...</p>
          </div>
        ) : !selectedImageUrl ? (
          <>
            {fetchedImages.length === 0 && !isLoadingImages && (
              <Alert variant="default" className="my-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>이미지를 찾을 수 없음</AlertTitle>
                <AlertDescription>
                  "{selectedKeyword}"에 대한 이미지를 Pixabay에서 찾을 수 없었습니다.
                  다른 키워드로 시도해보거나, Pixabay API 키가 `.env` 파일에 `PIXABAY_API_KEY`로 올바르게 설정되었는지 확인해주세요.
                  API 키가 없다면 자리 표시자 이미지가 사용됩니다. (이 메시지는 API 키가 있고 이미지가 없을 때만 표시됩니다.)
                </AlertDescription>
              </Alert>
            )}
            <ScrollArea className="h-[400px] p-1">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
                {fetchedImages.map((img) => (
                  <div
                    key={img.id}
                    className="cursor-pointer border-2 border-transparent hover:border-primary rounded-lg overflow-hidden shadow-md transition-all duration-200 aspect-video group relative"
                    onClick={() => handleImageSelect(img)}
                    data-ai-hint={img.tags || aiHint}
                  >
                    <Image
                      src={img.previewURL || img.webformatURL} // Prefer previewURL for listing
                      alt={img.tags || `Image from Pixabay: ${img.id}`}
                      layout="fill"
                      objectFit="cover"
                      className="transition-transform duration-300 group-hover:scale-105"
                    />
                     <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-1 text-xs truncate">
                        {img.tags || 'Untitled'}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="p-4 space-y-4">
            <Alert variant="default" className="bg-secondary text-secondary-foreground border-primary/50">
              <CheckCircle className="h-5 w-5 text-primary" />
              <AlertTitle className="text-primary">사진 선택됨</AlertTitle>
              <AlertDescription>
                이제 이 사진을 삽입할 블로그 항목(단락)을 선택해주세요.
                <br /> Alt 텍스트: <span className="font-medium">{selectedImageAlt}</span>
              </AlertDescription>
            </Alert>
            <div className="flex justify-center">
              <Image
                src={selectedImageUrl}
                alt={selectedImageAlt} 
                width={250}
                height={150}
                className="rounded-md border shadow-md object-contain max-h-[200px]"
                data-ai-hint={aiHint} 
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
                      <SelectItem key={section.id} value={section.id} className="hover:bg-accent/50">
                        {`항목 ${index + 1}: ${section.name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
               <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>오류</AlertTitle>
                  <AlertDescription>
                    블로그 내용이 없습니다. 이미지를 삽입할 항목을 찾을 수 없습니다.
                  </AlertDescription>
                </Alert>
            )}
          </div>
        )}

        <DialogFooter className="sm:justify-between mt-4 pt-4 border-t">
            {selectedImageUrl && (
                 <Button variant="outline" onClick={() => setSelectedImageUrl(null)} className="mb-2 sm:mb-0">
                    다른 사진 선택
                </Button>
            )}
           {!selectedImageUrl && fetchedImages.length > 0 && <div />} {/* Placeholder for spacing */}
           {!selectedImageUrl && fetchedImages.length === 0 && !isLoadingImages && (
             <Button variant="outline" onClick={loadImages} className="mb-2 sm:mb-0">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
