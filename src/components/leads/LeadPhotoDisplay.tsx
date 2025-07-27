import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadPhotoDisplayProps {
  exteriorPhotoUrl?: string | null;
  interiorPhotoUrl?: string | null;
  storeName?: string | null;
  storeType?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LeadPhotoDisplay({
  exteriorPhotoUrl,
  interiorPhotoUrl,
  storeName,
  storeType,
  size = "md",
  className
}: LeadPhotoDisplayProps) {
  const [currentPhoto, setCurrentPhoto] = useState<"exterior" | "interior">("exterior");
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-20 h-20",
    lg: "w-full h-full"
  };

  const hasPhotos = (exteriorPhotoUrl && exteriorPhotoUrl.trim()) || (interiorPhotoUrl && interiorPhotoUrl.trim());

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

  const currentPhotoUrl = currentPhoto === "exterior" ? 
    (exteriorPhotoUrl ? `https://uiprdzdskaqakfwhzssc.supabase.co/storage/v1/object/public/lead-photos/${exteriorPhotoUrl}` : null) : 
    (interiorPhotoUrl ? `https://uiprdzdskaqakfwhzssc.supabase.co/storage/v1/object/public/lead-photos/${interiorPhotoUrl}` : null);

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
            alt={`${currentPhoto} photo of ${storeName || 'store'}`}
            className="w-full h-full object-cover rounded-lg"
            onError={() => setImageError(true)}
          />
          
          {/* Photo type indicator */}
          {size !== "sm" && (
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="text-xs">
                {currentPhoto === "exterior" ? "Exterior" : "Interior"}
              </Badge>
            </div>
          )}

          {/* Photo switcher */}
          {(exteriorPhotoUrl && exteriorPhotoUrl.trim()) && (interiorPhotoUrl && interiorPhotoUrl.trim()) && size !== "sm" && (
            <div className="absolute bottom-2 right-2 flex gap-1">
              <button
                onClick={() => setCurrentPhoto("exterior")}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  currentPhoto === "exterior" 
                    ? "bg-primary" 
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
              />
              <button
                onClick={() => setCurrentPhoto("interior")}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  currentPhoto === "interior" 
                    ? "bg-primary" 
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
} 