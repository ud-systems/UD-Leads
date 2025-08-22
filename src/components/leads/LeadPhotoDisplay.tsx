import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store, Building2, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadPhotoDisplayProps {
  exteriorPhotos?: string[] | null;
  interiorPhotos?: string[] | null;
  storeName?: string | null;
  storeType?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LeadPhotoDisplay({
  exteriorPhotos,
  interiorPhotos,
  storeName,
  storeType,
  size = "md",
  className
}: LeadPhotoDisplayProps) {
  const [currentPhotoType, setCurrentPhotoType] = useState<"exterior" | "interior">("exterior");
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-20 h-20",
    lg: "w-full h-full"
  };

  const hasExteriorPhotos = exteriorPhotos && exteriorPhotos.length > 0;
  const hasInteriorPhotos = interiorPhotos && interiorPhotos.length > 0;
  const hasPhotos = hasExteriorPhotos || hasInteriorPhotos;

  if (!hasPhotos) {
    return (
      <div className={cn(
        "bg-muted rounded-lg flex items-center justify-center",
        sizeClasses[size],
        className
      )}>
        <div className="text-center">
          <Store className={cn(
            "mx-auto text-muted-foreground",
            size === "sm" ? "h-6 w-6" : size === "md" ? "h-8 w-8" : "h-12 w-12"
          )} />
          {size !== "sm" && (
            <p className={cn(
              "text-xs text-muted-foreground mt-1",
              size === "lg" && "text-sm"
            )}>
              No photos
            </p>
          )}
        </div>
      </div>
    );
  }

  // Get current photo arrays
  const currentPhotos = currentPhotoType === "exterior" ? exteriorPhotos : interiorPhotos;
  const currentPhoto = currentPhotos?.[currentPhotoIndex];
  const currentPhotoUrl = currentPhoto ? 
    `https://uiprdzdskaqakfwhzssc.supabase.co/storage/v1/object/public/lead-photos/${currentPhoto}` : null;

  // Handle photo switching
  const nextPhoto = () => {
    if (currentPhotos && currentPhotoIndex < currentPhotos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
      setImageError(false);
    }
  };

  const prevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
      setImageError(false);
    }
  };

  // Switch photo type if current type has no photos
  const switchPhotoType = () => {
    if (currentPhotoType === "exterior" && hasInteriorPhotos) {
      setCurrentPhotoType("interior");
      setCurrentPhotoIndex(0);
      setImageError(false);
    } else if (currentPhotoType === "interior" && hasExteriorPhotos) {
      setCurrentPhotoType("exterior");
      setCurrentPhotoIndex(0);
      setImageError(false);
    }
  };

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      {imageError ? (
        <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Building2 className={cn(
              "mx-auto text-muted-foreground",
              size === "sm" ? "h-4 w-4" : size === "md" ? "h-6 w-6" : "h-8 w-8"
            )} />
            {size !== "sm" && (
              <p className={cn(
                "text-xs text-muted-foreground mt-1",
                size === "lg" && "text-sm"
              )}>
                Photo unavailable
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          <img
            src={currentPhotoUrl || ""}
            alt={`${currentPhotoType} photo ${currentPhotoIndex + 1} of ${storeName || 'store'}`}
            className="w-full h-full object-cover rounded-lg"
            onError={() => setImageError(true)}
          />
          
          {/* Photo type indicator */}
          {size !== "sm" && (
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="text-xs">
                {currentPhotoType === "exterior" ? "Exterior" : "Interior"}
              </Badge>
            </div>
          )}

          {/* Photo counter */}
          {size !== "sm" && currentPhotos && currentPhotos.length > 1 && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="text-xs">
                {currentPhotoIndex + 1}/{currentPhotos.length}
              </Badge>
            </div>
          )}

          {/* Navigation controls */}
          {size !== "sm" && (
            <>
              {/* Previous/Next buttons for multiple photos */}
              {currentPhotos && currentPhotos.length > 1 && (
                <>
                  {currentPhotoIndex > 0 && (
                    <button
                      onClick={prevPhoto}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                  {currentPhotoIndex < currentPhotos.length - 1 && (
                    <button
                      onClick={nextPhoto}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </>
              )}

              {/* Photo type switcher */}
              {hasExteriorPhotos && hasInteriorPhotos && (
                <div className="absolute bottom-2 right-2 flex gap-1">
                  <button
                    onClick={() => {
                      setCurrentPhotoType("exterior");
                      setCurrentPhotoIndex(0);
                      setImageError(false);
                    }}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      currentPhotoType === "exterior" 
                        ? "bg-primary" 
                        : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    )}
                  />
                  <button
                    onClick={() => {
                      setCurrentPhotoType("interior");
                      setCurrentPhotoIndex(0);
                      setImageError(false);
                    }}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      currentPhotoType === "interior" 
                        ? "bg-primary" 
                        : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    )}
                  />
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
} 