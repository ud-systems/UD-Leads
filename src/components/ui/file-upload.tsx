import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { supabase, uploadWithRetry } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface FileUploadProps {
  label: string;
  value?: string;
  onChange: (path: string) => void;
  bucket: string;
  folder?: string;
  accept?: string;
  maxSize?: number; // in MB
  maxWidth?: number; // maximum width for compression
  maxHeight?: number; // maximum height for compression
  quality?: number; // compression quality (0.1 to 1.0)
}

export function FileUpload({ 
  label, 
  value, 
  onChange, 
  bucket, 
  folder = "", 
  accept = "image/*",
  maxSize = 10,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.8
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(value ? `https://uiprdzdskaqakfwhzssc.supabase.co/storage/v1/object/public/${bucket}/${value}` : null);
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

      // Upload compressed file with retry logic
      const { data, error } = await uploadWithRetry(bucket, fileName, compressedFile, {
        cacheControl: '3600',
        upsert: false,
        onProgress: (progress) => setUploadProgress(progress),
        maxRetries: 3
      });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(error.message || 'Upload failed after retries');
      }

      // Update form value
      onChange(fileName);

      // Create preview URL
      const previewUrl = `https://uiprdzdskaqakfwhzssc.supabase.co/storage/v1/object/public/${bucket}/${fileName}`;
      setPreview(previewUrl);

      toast({
        title: "Upload successful",
        description: `File uploaded successfully! Compressed from ${originalSize}MB to ${compressedSize}MB (${compressionRatio}% reduction)`,
      });
      
      // Reset progress
      setUploadProgress(0);

    } catch (error) {
      console.error('Upload error:', error);
      console.error('Upload error details:', {
        error,
        bucket,
        fileName: `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${file.name.split('.').pop()}`,
        fileSize: file.size,
        fileType: file.type,
        userId: user.id
      });
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!value) return;

    try {
      // Delete file from storage
      const { error } = await supabase.storage
        .from(bucket)
        .remove([value]);

      if (error) {
        throw error;
      }

      // Clear form value and preview
      onChange("");
      setPreview(null);

      toast({
        title: "File removed",
        description: "File removed successfully",
      });

    } catch (error) {
      console.error('Remove error:', error);
      toast({
        title: "Remove failed",
        description: "Failed to remove file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-32 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
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
            <div className="flex flex-col items-center space-y-2 w-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Compressing and uploading...</p>
              {uploadProgress > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Click to upload</p>
                <p className="text-xs text-muted-foreground">
                  Images will be automatically compressed to save storage
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