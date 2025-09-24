import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { supabase, uploadWithRetry, uploadResumable } from "@/integrations/supabase/client";
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
  maxWidth?: number; // maximum width for compression
  maxHeight?: number; // maximum height for compression
  quality?: number; // compression quality (0.1 to 1.0)
  forceLivePhoto?: boolean; // Force live photo capture, disable gallery
}

export function MultiPhotoUpload({ 
  label, 
  photos, 
  onPhotosChange, 
  bucket, 
  folder = "", 
  accept = "image/*",
  maxSize = 10,
  maxPhotos = 10,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.8,
  forceLivePhoto = false
}: MultiPhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Function to compress image using Canvas API
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress image
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create new file with compressed data
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      // Load image from file
      img.src = URL.createObjectURL(file);
    });
  };

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
      // Compress the image before upload
      const compressedFile = await compressImage(file);
      
      // Check compressed file size
      if (compressedFile.size > maxSize * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `Compressed file size is still too large. Please try a smaller image.`,
          variant: "destructive",
        });
        return;
      }

      // Show compression info
      const originalSize = (file.size / 1024 / 1024).toFixed(2);
      const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2);
      const compressionRatio = ((1 - compressedFile.size / file.size) * 100).toFixed(1);

      // Generate unique filename with user ID folder structure
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Choose upload method based on file size
      const fileSizeMB = compressedFile.size / (1024 * 1024);
      const useResumable = fileSizeMB > 5; // Use resumable for files > 5MB
      
      let uploadResult;
      if (useResumable) {
        // Use resumable upload for large files
        uploadResult = await uploadResumable(bucket, fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false,
          onProgress: (progress, chunk, totalChunks) => {
            setUploadProgress(progress);
            console.log(`Resumable upload progress: ${progress}% (chunk ${chunk}/${totalChunks})`);
          },
          maxRetries: 3
        });
      } else {
        // Use regular upload with retry for smaller files
        uploadResult = await uploadWithRetry(bucket, fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false,
          onProgress: (progress) => setUploadProgress(progress),
          maxRetries: 3,
          resumable: false // Explicitly disable for small files
        });
      }
      
      const { data, error } = uploadResult;

      if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(error.message || 'Upload failed after retries');
      }

      // Add new photo to the array
      const newPhotos = [...photos, fileName];
      onPhotosChange(newPhotos);

      toast({
        title: "Upload successful",
        description: `Photo uploaded successfully! ${useResumable ? '(Resumable upload)' : ''} Compressed from ${originalSize}MB to ${compressedSize}MB (${compressionRatio}% reduction)`,
      });
      
      // Reset progress
      setUploadProgress(0);

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
    if (forceLivePhoto) {
      // Force camera capture on mobile devices
      const input = fileInputRef.current;
      if (input) {
        input.setAttribute('capture', 'environment');
        input.setAttribute('accept', 'image/*');
        input.click();
      }
    } else {
      fileInputRef.current?.click();
    }
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
            accept={forceLivePhoto ? "image/*" : accept}
            capture={forceLivePhoto ? "environment" : undefined}
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Compressing and uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {forceLivePhoto ? "Take Live Photo" : "Add Photo"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {forceLivePhoto 
                    ? "Camera will open to capture a live photo" 
                    : "Images will be automatically compressed to save storage"
                  }
                </p>
                <p className="text-xs text-muted-foreground">
                  Max {maxSize}MB • {maxWidth}x{maxHeight}px
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
