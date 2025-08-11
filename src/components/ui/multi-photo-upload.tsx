import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface MultiPhotoUploadProps {
  label: string;
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  bucket: string;
  folder?: string;
  accept?: string;
  maxSize?: number; // in MB
  maxPhotos?: number; // maximum number of photos allowed
}

export function MultiPhotoUpload({ 
  label, 
  photos, 
  onPhotosChange, 
  bucket, 
  folder = "", 
  accept = "image/*",
  maxSize = 5,
  maxPhotos = 10
}: MultiPhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!user?.id) {
      toast({
        title: "Authentication error",
        description: "Please log in to upload files",
        variant: "destructive",
      });
      return;
    }

    // Check if we've reached the maximum number of photos
    if (photos.length >= maxPhotos) {
      toast({
        title: "Maximum photos reached",
        description: `You can only upload up to ${maxPhotos} photos`,
        variant: "destructive",
      });
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `File size must be less than ${maxSize}MB`,
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique filename with user ID folder structure
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload file
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(error.message || 'Upload failed');
      }

      // Add new photo to the array
      const newPhotos = [...photos, fileName];
      onPhotosChange(newPhotos);

      toast({
        title: "Upload successful",
        description: "Photo uploaded successfully",
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async (photoIndex: number) => {
    const photoToRemove = photos[photoIndex];
    if (!photoToRemove) return;

    try {
      // Delete file from storage
      const { error } = await supabase.storage
        .from(bucket)
        .remove([photoToRemove]);

      if (error) {
        throw error;
      }

      // Remove photo from array
      const newPhotos = photos.filter((_, index) => index !== photoIndex);
      onPhotosChange(newPhotos);

      toast({
        title: "Photo removed",
        description: "Photo removed successfully",
      });

    } catch (error) {
      console.error('Remove error:', error);
      toast({
        title: "Remove failed",
        description: "Failed to remove photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-xs text-muted-foreground">
          {photos.length}/{maxPhotos} photos
        </span>
      </div>
      
      {/* Existing Photos Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map((photo, index) => (
            <div key={index} className="relative">
              <img
                src={`https://uiprdzdskaqakfwhzssc.supabase.co/storage/v1/object/public/${bucket}/${photo}`}
                alt={`Photo ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-1 right-1 h-6 w-6 p-0"
                onClick={() => handleRemove(index)}
                disabled={isUploading}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      {/* Upload Button */}
      {photos.length < maxPhotos && (
        <div
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Add Photo</p>
                <p className="text-xs text-muted-foreground">
                  {accept === "image/*" ? "Image files" : "Files"} up to {maxSize}MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
