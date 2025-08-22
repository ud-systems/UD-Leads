import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCompanyLogo, useUpdateCompanyLogo } from "@/hooks/useCompanyLogo";
import { useToast } from "@/hooks/use-toast";
import { Building, Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function CompanyLogoManager() {
  const { data: logoUrl, isLoading } = useCompanyLogo();
  const updateLogo = useUpdateCompanyLogo();
  const { toast } = useToast();
  const [newLogoUrl, setNewLogoUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPEG, PNG, GIF, etc.)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const fileName = `company-logo-${Date.now()}-${selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw new Error(uploadError.message || 'Upload failed');
      }

      if (!uploadData?.path) {
        throw new Error('Upload succeeded but no path returned');
      }

      const { data: urlData } = supabase.storage
        .from('company-assets')
        .getPublicUrl(uploadData.path);

      await updateLogo.mutateAsync(urlData.publicUrl);
      
      setSelectedFile(null);
      setNewLogoUrl("");
      
      toast({
        title: "Success",
        description: "Company logo updated successfully",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload company logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlUpdate = async () => {
    if (!newLogoUrl.trim()) return;

    try {
      await updateLogo.mutateAsync(newLogoUrl.trim());
      setNewLogoUrl("");
      toast({
        title: "Success",
        description: "Company logo updated successfully",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update company logo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await updateLogo.mutateAsync("");
      toast({
        title: "Success",
        description: "Company logo removed successfully",
      });
    } catch (error) {
      toast({
        title: "Remove failed",
        description: "Failed to remove company logo. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Company Logo
          </CardTitle>
          <CardDescription>Manage your company logo for the sidebar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Company Logo
        </CardTitle>
        <CardDescription>
          Upload or set a URL for your company logo. Recommended size: 150x150px
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Logo Display */}
        <div>
          <Label className="text-sm font-medium">Current Logo</Label>
          <div className="mt-2 flex items-center gap-4">
            {logoUrl ? (
              <>
                <img
                  src={logoUrl}
                  alt="Company Logo"
                  className="w-[150px] h-[150px] object-contain border rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveLogo}
                  disabled={updateLogo.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </>
            ) : (
              <div className="w-[150px] h-[150px] bg-muted border rounded-lg flex items-center justify-center">
                <Building className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Upload Section */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Upload New Logo</Label>
            <div className="mt-2 flex items-center gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="flex-1"
                disabled={isUploading}
              />
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                size="sm"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </Button>
            </div>
            {selectedFile && (
              <p className="text-sm text-muted-foreground mt-1">
                Selected: {selectedFile.name}
              </p>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or enter URL
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="logo-url" className="text-sm font-medium">
              Logo URL
            </Label>
            <div className="mt-2 flex items-center gap-2">
              <Input
                id="logo-url"
                type="url"
                placeholder="https://example.com/logo.png"
                value={newLogoUrl}
                onChange={(e) => setNewLogoUrl(e.target.value)}
                className="flex-1"
                disabled={updateLogo.isPending}
              />
              <Button
                onClick={handleUrlUpdate}
                disabled={!newLogoUrl.trim() || updateLogo.isPending}
                size="sm"
              >
                {updateLogo.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Update"
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <p className="font-medium mb-1">Tips:</p>
          <ul className="space-y-1">
            <li>• Recommended size: 150x150 pixels</li>
            <li>• Supported formats: JPEG, PNG, GIF, WebP</li>
            <li>• Maximum file size: 5MB</li>
            <li>• Logo will appear in the sidebar when expanded</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 