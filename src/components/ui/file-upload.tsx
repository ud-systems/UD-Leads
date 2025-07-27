import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
}

export function FileUpload({ 
  label, 
  value, 
  onChange, 
  bucket, 
  folder = "", 
  accept = "image/*",
  maxSize = 5 
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value ? `https://uiprdzdskaqakfwhzssc.supabase.co/storage/v1/object/public/${bucket}/${value}` : null);
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

      // Update form value
      onChange(fileName);

      // Create preview URL
      const previewUrl = `https://uiprdzdskaqakfwhzssc.supabase.co/storage/v1/object/public/${bucket}/${fileName}`;
      setPreview(previewUrl);

      toast({
        title: "Upload successful",
        description: "File uploaded successfully",
      });

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
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Click to upload</p>
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