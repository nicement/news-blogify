
"use client";

import type * as React from "react";
import { useState, useMemo } from "react";
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
import { AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ContentFormat } from "@/app/page"; // Import ContentFormat

interface ImageSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentContent: string;
  onImageInsert: (updatedContent: string) => void;
  selectedKeyword: string | null;
  contentFormat: ContentFormat; // Added contentFormat prop
}

const MOCK_IMAGES_COUNT = 6;

export function ImageSelectionDialog({
  isOpen,
  onClose,
  currentContent,
  onImageInsert,
  selectedKeyword,
  contentFormat, // Destructure contentFormat
}: ImageSelectionDialogProps) {
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedSectionIndex, setSelectedSectionIndex] = useState<string | undefined>(undefined); // Store index as string for Select

  const blogSections = useMemo(() => {
    if (!currentContent) return [];
    return currentContent.split("\n\n").map((content, index) => ({
      id: index.toString(),
      // Display first 50 chars as preview, or "Paragraph X"
      name: content.substring(0, 50).trim() + (content.length > 50 ? "..." : "") || `Paragraph ${index + 1}`,
      originalContent: content,
    }));
  }, [currentContent]);

  const aiHint = useMemo(() => selectedKeyword ? selectedKeyword.split(" ").slice(0, 2).join(" ") : "relevant image", [selectedKeyword]);

  const placeholderImages = useMemo(() => {
    return Array.from({ length: MOCK_IMAGES_COUNT }, (_, i) => {
      const size = 300 + i * 20; // Vary image sizes slightly
      return {
        src: `https://placehold.co/${size}x${size}.png`,
        alt: `Placeholder image ${i + 1}`,
        aiHint: aiHint // Each image will carry the general aiHint
      };
    });
  }, [aiHint]);


  const handleInsert = () => {
    if (!selectedImageUrl || selectedSectionIndex === undefined) {
      return;
    }

    const sectionIdx = parseInt(selectedSectionIndex, 10);
    if (isNaN(sectionIdx) || sectionIdx < 0 || sectionIdx >= blogSections.length) {
      return; 
    }
    
    const altText = selectedKeyword || "image";
    let imageTag = "";

    if (contentFormat === 'html') {
      imageTag = `\n\n<img src="${selectedImageUrl}" alt="${altText}" data-ai-hint="${aiHint}" style="max-width: 100%; height: auto; border-radius: 0.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />\n\n`;
    } else { // Default to markdown
      imageTag = `\n\n![${altText}](${selectedImageUrl})\n\n`;
    }
    
    const updatedSections = blogSections.map((section, index) => {
      if (index === sectionIdx) {
        // Insert image at the end of the selected paragraph
        return section.originalContent + imageTag;
      }
      return section.originalContent;
    });

    onImageInsert(updatedSections.join("\n\n"));
    setSelectedImageUrl(null);
    setSelectedSectionIndex(undefined);
    onClose();
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle>사진 추가 (Add Photo)</DialogTitle>
          <DialogDescription>
            항목에 추가할 사진을 선택하고, 사진을 삽입할 위치를 지정해주세요. 
            선택한 형식({contentFormat === 'html' ? 'HTML' : '마크다운'})으로 사진이 삽입됩니다.
          </DialogDescription>
        </DialogHeader>
        
        {!selectedImageUrl ? (
          <ScrollArea className="h-[400px] p-1">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
              {placeholderImages.map((img, index) => (
                <div
                  key={index}
                  className="cursor-pointer border-2 border-transparent hover:border-primary rounded-lg overflow-hidden shadow-md transition-all duration-200"
                  onClick={() => setSelectedImageUrl(img.src)}
                  data-ai-hint={img.aiHint}
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    width={200}
                    height={200}
                    className="object-cover w-full h-full aspect-square"
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="p-4 space-y-4">
            <Alert variant="default" className="bg-secondary text-secondary-foreground border-primary/50">
              <CheckCircle className="h-5 w-5 text-primary" />
              <AlertTitle className="text-primary">사진 선택됨</AlertTitle>
              <AlertDescription>
                이제 이 사진을 삽입할 블로그 항목(단락)을 선택해주세요.
              </AlertDescription>
            </Alert>
            <Image
              src={selectedImageUrl}
              alt="Selected image"
              width={150}
              height={150}
              className="rounded-md border shadow-md mx-auto"
              data-ai-hint={aiHint}
            />
            
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

        <DialogFooter className="sm:justify-between mt-4">
            {selectedImageUrl && (
                 <Button variant="outline" onClick={() => setSelectedImageUrl(null)} className="mb-2 sm:mb-0">
                    다른 사진 선택
                </Button>
            )}
           {!selectedImageUrl && <div />} {/* Placeholder for spacing if no image selected */}
          <div>
            <Button variant="ghost" onClick={onClose} className="mr-2">
              취소
            </Button>
            <Button
              onClick={handleInsert}
              disabled={!selectedImageUrl || selectedSectionIndex === undefined || blogSections.length === 0}
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
