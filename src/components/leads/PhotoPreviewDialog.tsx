import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

interface PhotoPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  photos: string[];
  title: string;
  initialIndex?: number;
}

export function PhotoPreviewDialog({
  isOpen,
  onClose,
  photos,
  title,
  initialIndex = 0,
}: PhotoPreviewDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setScale(1);
      setRotation(0);
    }
  }, [isOpen, initialIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          goToPrevious();
          break;
        case "ArrowRight":
          e.preventDefault();
          goToNext();
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        case "+":
        case "=":
          e.preventDefault();
          setScale(prev => Math.min(prev + 0.25, 3));
          break;
        case "-":
          e.preventDefault();
          setScale(prev => Math.max(prev - 0.25, 0.25));
          break;
        case "r":
          e.preventDefault();
          setRotation(prev => (prev + 90) % 360);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex]);

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : photos.length - 1));
    setScale(1);
    setRotation(0);
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev < photos.length - 1 ? prev + 1 : 0));
    setScale(1);
    setRotation(0);
  };

  const resetView = () => {
    setScale(1);
    setRotation(0);
  };

  if (!photos.length) return null;

  const currentPhoto = photos[currentIndex];
  const photoUrl = `https://uiprdzdskaqakfwhzssc.supabase.co/storage/v1/object/public/lead-photos/${currentPhoto}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95">
        <DialogHeader className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
          <DialogTitle className="text-white text-lg font-semibold">
            {title} - Photo {currentIndex + 1} of {photos.length}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>

        {/* Photo Display */}
        <div className="relative flex-1 flex items-center justify-center p-4">
          <div className="relative max-w-full max-h-full overflow-hidden">
            <img
              src={photoUrl}
              alt={`${title} ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-800 text-white">
              <div className="text-center">
                <p className="text-lg">Photo unavailable</p>
                <p className="text-sm text-gray-400">{currentPhoto}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex items-center justify-between pointer-events-none">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevious}
            disabled={photos.length <= 1}
            className="pointer-events-auto text-white hover:bg-white/20 disabled:opacity-50"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNext}
            disabled={photos.length <= 1}
            className="pointer-events-auto text-white hover:bg-white/20 disabled:opacity-50"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setScale(prev => Math.max(prev - 0.25, 0.25))}
            disabled={scale <= 0.25}
            className="text-white hover:bg-white/20 disabled:opacity-50"
            title="Zoom Out (or press -)"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <Badge variant="secondary" className="text-xs">
            {Math.round(scale * 100)}%
          </Badge>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setScale(prev => Math.min(prev + 0.25, 3))}
            disabled={scale >= 3}
            className="text-white hover:bg-white/20 disabled:opacity-50"
            title="Zoom In (or press +)"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRotation(prev => (prev + 90) % 360)}
            className="text-white hover:bg-white/20"
            title="Rotate (or press R)"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={resetView}
            className="text-white hover:bg-white/20"
            title="Reset View"
          >
            Reset
          </Button>
        </div>

        {/* Photo Counter */}
        <div className="absolute bottom-4 right-4">
          <Badge variant="secondary" className="text-xs">
            {currentIndex + 1} / {photos.length}
          </Badge>
        </div>
      </DialogContent>
    </Dialog>
  );
}
