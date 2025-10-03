import { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { MultiPhotoUpload } from "./multi-photo-upload";

interface PhotoUploadWithValidationProps {
  label?: string;
  photos?: string[];
  onPhotosChange: (photos: string[]) => void;
  bucket?: string;
  folder?: string;
  storagePath?: string;
  maxPhotos: number;
  forceLivePhoto?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
}

export function PhotoUploadWithValidation({
  label,
  photos = [],
  onPhotosChange,
  bucket = "lead-photos",
  folder,
  storagePath,
  maxPhotos,
  forceLivePhoto = false,
  required = false,
  error,
  className,
}: PhotoUploadWithValidationProps) {
  // Only show validation errors when explicitly provided (not auto-validating)
  const finalError = error;

  // Extract bucket and folder from storagePath if provided
  const finalBucket = storagePath ? "visit-photos" : bucket;
  const finalFolder = storagePath || folder || "general";

  return (
    <div className={cn("space-y-1", className)}>
      <MultiPhotoUpload
        label={label}
        photos={photos}
        onPhotosChange={onPhotosChange}
        bucket={finalBucket}
        folder={finalFolder}
        maxPhotos={maxPhotos}
        forceLivePhoto={forceLivePhoto}
      />
      
      {finalError && (
        <div className="flex items-center gap-1.5 text-xs px-1 text-red-600 dark:text-red-400">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          <span className="leading-tight">{finalError}</span>
        </div>
      )}
    </div>
  );
}
