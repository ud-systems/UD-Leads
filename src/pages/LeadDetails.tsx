import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLeads, useUpdateLead, useLeadVisitCount } from "@/hooks/useLeads";
import { useStoreTypeOptions, useLeadStatusOptions, useOwnsShopOrWebsiteOptions, useNumberOfStoresOptions } from "@/hooks/useSystemSettings";
import { useUsers } from "@/hooks/useUsers";
import { useTerritories } from "@/hooks/useTerritories";
import { useAuth } from "@/hooks/useAuth";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { formatUKDate, formatUKTime } from "@/utils/timeUtils";
// import { useLeadNotes, useCreateLeadNote } from "@/hooks/useLeadNotes";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/useTheme";
import { LeadPhotoDisplay } from "@/components/leads/LeadPhotoDisplay";
import { DeleteLeadDialog } from "@/components/leads/DeleteLeadDialog";
import { PhotoPreviewDialog } from "@/components/leads/PhotoPreviewDialog";
import { PhotoUploadWithValidation } from "@/components/ui/photo-upload-with-validation";
import { ArrowLeft, Phone, Mail, MapPin, Calendar, User, Building, ShoppingCart, Camera, Image as ImageIcon, Edit, Save, X, Navigation, Loader2, MessageSquare, Send, ExternalLink } from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";
import React, { useCallback, useMemo } from "react";

// Inline edit component moved outside to prevent recreation on every render
interface InlineEditProps {
  field: string;
  value: string;
  type?: "text" | "select" | "textarea" | "date";
  options?: { value: string; label: string }[];
  isEditing: boolean;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onSave: (field: string) => void;
  onCancel: () => void;
  onStartEdit: (field: string, value: string) => void;
  isPending: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  isDark: boolean;
  territories: any[];
}

const InlineEdit = React.memo(({ 
  field, 
  value, 
  type = "text", 
  options = [],
  isEditing,
  editValue,
  onEditValueChange,
  onSave,
  onCancel,
  onStartEdit,
  isPending,
  inputRef,
  textareaRef,
  isDark,
  territories
}: InlineEditProps) => {
  // Helper function to get territory name
  const getTerritoryName = useCallback((territoryId: string) => {
    const territory = territories.find(t => t.id === territoryId);
    return territory?.city || 'Unknown Territory';
  }, [territories]);
  
  if (isEditing) {
    return (
      <div className="flex items-center gap-2 w-full">
        <div className="flex-1">
          {type === "select" ? (
            <Select value={editValue} onValueChange={onEditValueChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : type === "textarea" ? (
            <Textarea
              ref={textareaRef}
              value={editValue}
              onChange={(e) => onEditValueChange(e.target.value)}
              className="w-full"
              rows={3}
            />
          ) : type === "date" ? (
            <Input
              ref={inputRef}
              type="date"
              value={editValue}
              onChange={(e) => onEditValueChange(e.target.value)}
              className="w-full"
            />
          ) : (
            <Input
              ref={inputRef}
              value={editValue}
              onChange={(e) => onEditValueChange(e.target.value)}
              className="w-full"
            />
          )}
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            onClick={() => onSave(field)}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex-1">
        {field === 'status' ? (
          <Badge variant="lead-status" status={value} isDark={isDark}>
            {value || "Not set"}
          </Badge>
        ) : field === 'store_type' ? (
          <Badge variant="store-type" storeType={value} isDark={isDark}>
            {value || "Not set"}
          </Badge>
        ) : field === 'territory_id' ? (
          <span>{value ? getTerritoryName(value) : "Not set"}</span>
        ) : field === 'last_visit' || field === 'next_visit' ? (
          <span>{value ? new Date(value).toLocaleDateString() : "Not set"}</span>
        ) : (
          <span>{value || "Not set"}</span>
        )}
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onStartEdit(field, value || "")}
        className="h-6 w-6 p-0 ml-2"
      >
        <Edit className="h-3 w-3" />
      </Button>
    </div>
  );
});

export default function LeadDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { data: leads, isLoading } = useLeads();
  const { mutate: updateLeadMutation, isPending } = useUpdateLead();
  const { data: users = [] } = useUsers();
  const { data: territories = [] } = useTerritories();
  const { user } = useAuth();
  const { isAdmin, isManager, isSalesperson } = useRoleAccess();
  const { data: storeTypeOptions = [] } = useStoreTypeOptions();
  const { data: leadStatusOptions = [] } = useLeadStatusOptions();
  const { data: ownsShopOrWebsiteOptions = [] } = useOwnsShopOrWebsiteOptions();
  const { data: numberOfStoresOptions = [] } = useNumberOfStoresOptions();
  const { toast } = useToast();
  const [lead, setLead] = useState<any>(null);
  
  // Get visit count for the current lead
  const { data: visitCount = 0 } = useLeadVisitCount(id || '');
  
  // Note: Using existing leads.notes field instead of separate lead_notes table
  
  // Filter users based on role and team assignment
  const salespeople = useMemo(() => {
    if (isAdmin) {
      // Admins can see all salespeople and managers
      return users.filter(user => {
        const role = (user as any).role;
        return role === 'salesperson' || role === 'manager';
      });
    } else if (isManager && user) {
      // Managers can see themselves and their team members
      return users.filter(u => {
        const userRole = (u as any).role;
        const userId = u.id;
        
        // Include themselves (manager)
        if (userId === user.id && userRole === 'manager') {
          return true;
        }
        
        // Include their team members (salespeople assigned to them)
        if (userRole === 'salesperson' && (u as any).manager_id === user.id) {
          return true;
        }
        
        return false;
      });
    } else if (isSalesperson) {
      // Salespeople can only see themselves
      return users.filter(u => u.id === user?.id);
    }
    
    return [];
  }, [users, isAdmin, isManager, isSalesperson, user]);
  
  // State for inline editing
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [newComment, setNewComment] = useState("");
  
  // State for photo editing
  const [editingPhotos, setEditingPhotos] = useState<string | null>(null); // 'exterior' or 'interior'
  const [tempExteriorPhotos, setTempExteriorPhotos] = useState<string[]>([]);
  const [tempInteriorPhotos, setTempInteriorPhotos] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Photo preview dialog state
  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false);
  const [photoPreviewPhotos, setPhotoPreviewPhotos] = useState<string[]>([]);
  const [photoPreviewTitle, setPhotoPreviewTitle] = useState("");
  const [photoPreviewInitialIndex, setPhotoPreviewInitialIndex] = useState(0);

  // Optimized inline editing functions with useCallback
  const startEditing = useCallback((field: string, value: string) => {
    setEditingField(field);
    setEditValue(value);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingField(null);
    setEditValue("");
  }, []);

  const saveField = useCallback(async (field: string) => {
    if (!lead || editValue === lead[field as keyof typeof lead]) {
      cancelEditing();
      return;
    }

    let valueToSave: any = editValue;
    
    // Handle array fields
    if (field === 'top_3_selling_products' || field === 'tags') {
      valueToSave = editValue.split(',').map((item: string) => item.trim()).filter((item: string) => item.length > 0);
    }

    updateLeadMutation(
      { id: lead.id, updates: { [field]: valueToSave } },
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Lead updated successfully.",
          });
          cancelEditing();
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: "Failed to update lead. Please try again.",
            variant: "destructive",
          });
        }
      }
    );
  }, [lead, editValue, updateLeadMutation, toast, cancelEditing]);

  const handleEditValueChange = useCallback((value: string) => {
    setEditValue(value);
  }, []);

  // Photo editing handlers
  const startPhotoEditing = useCallback((photoType: 'exterior' | 'interior') => {
    setEditingPhotos(photoType);
    if (photoType === 'exterior') {
      setTempExteriorPhotos(lead?.exterior_photos || []);
    } else {
      setTempInteriorPhotos(lead?.interior_photos || []);
    }
  }, [lead]);

  const cancelPhotoEditing = useCallback(() => {
    setEditingPhotos(null);
    setTempExteriorPhotos([]);
    setTempInteriorPhotos([]);
  }, []);

  const savePhotoChanges = useCallback(async (photoType: 'exterior' | 'interior') => {
    if (!lead) return;

    try {
      const photos = photoType === 'exterior' ? tempExteriorPhotos : tempInteriorPhotos;
      const fieldName = photoType === 'exterior' ? 'exterior_photos' : 'interior_photos';
      
      await updateLeadMutation({
        id: lead.id,
        updates: { [fieldName]: photos }
      });
      
      setEditingPhotos(null);
      setTempExteriorPhotos([]);
      setTempInteriorPhotos([]);
      
      toast({
        title: "Success",
        description: `${photoType === 'exterior' ? 'Exterior' : 'Interior'} photos updated successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update ${photoType === 'exterior' ? 'exterior' : 'interior'} photos`,
        variant: "destructive",
      });
    }
  }, [lead, tempExteriorPhotos, tempInteriorPhotos, updateLeadMutation, toast]);

  // Helper function to create InlineEdit props
  const createInlineEditProps = useCallback((field: string, value: string, type: "text" | "select" | "textarea" | "date" = "text", options: { value: string; label: string }[] = []) => ({
    field,
    value,
    type,
    options,
    isEditing: editingField === field,
    editValue,
    onEditValueChange: handleEditValueChange,
    onSave: saveField,
    onCancel: cancelEditing,
    onStartEdit: startEditing,
    isPending,
    inputRef,
    textareaRef,
    isDark,
    territories
  }), [editingField, editValue, handleEditValueChange, saveField, cancelEditing, startEditing, isPending, inputRef, textareaRef, isDark, territories]);

  // Function to format duration in milliseconds to human readable format
  const formatDuration = (durationMs: number) => {
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  useEffect(() => {
    if (leads && id) {
      const foundLead = leads.find(l => l.id === id);
      setLead(foundLead);
    }
  }, [leads, id]);

  // Focus management for inline editing
  useEffect(() => {
    if (editingField) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        } else if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.select();
        }
      }, 0);
    }
  }, [editingField]);

  // Comments functions
  const addComment = () => {
    if (newComment.trim() && id && lead) {
      const timestamp = new Date().toLocaleString();
      const updatedNotes = lead.notes 
        ? `${lead.notes}\n\n[${timestamp}] General Note:\n${newComment.trim()}`
        : `[${timestamp}] General Note:\n${newComment.trim()}`;
      
      updateLeadMutation({
        id: id,
        updates: { notes: updatedNotes }
      }, {
        onSuccess: () => {
          setNewComment("");
          toast({
            title: "Note added",
            description: "Your note has been added to the lead.",
          });
        },
        onError: (updateError) => {
          console.error('Error updating lead notes:', updateError);
          toast({
            title: "Error",
            description: "Failed to add note. Please try again.",
            variant: "destructive",
          });
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <h2 className="text-xl font-semibold">Lead not found</h2>
        <Button onClick={() => navigate('/leads')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Leads
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string | null) => {
    if (!status) return "bg-gray-100 text-gray-800";
    switch (status) {
      case "Converted": return "bg-green-100 text-green-800";
      case "In Discussion": return "bg-blue-100 text-blue-800";
      case "Trial Order": return "bg-purple-100 text-purple-800";
      case "Visited - Follow-Up Required": return "bg-yellow-100 text-yellow-800";
      case "New Prospect": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getBuyingPowerColor = (power: string | null) => {
    if (!power) return "bg-gray-100 text-gray-800";
    switch (power) {
      case "High": return "bg-green-100 text-green-800";
      case "Medium": return "bg-yellow-100 text-yellow-800";
      case "Low": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };


  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });
      
      const updates = {
        latitude: position.coords.latitude.toFixed(6),
        longitude: position.coords.longitude.toFixed(6)
      };
      
      updateLeadMutation({
        id: lead.id,
        updates: updates as any
      }, {
        onSuccess: () => {
          setLead(prev => ({ 
            ...prev, 
            latitude: parseFloat(updates.latitude),
            longitude: parseFloat(updates.longitude)
          }));
          toast({
            title: "Location Updated",
            description: "Coordinates have been auto-filled from your current location",
          });
        },
        onError: (error) => {
          toast({
            title: "Location Error",
            description: "Could not update location. Please try again.",
            variant: "destructive",
          });
        },
      });
    } catch (error) {
      toast({
        title: "Location Error",
        description: "Could not get your location. Please enter coordinates manually.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Function to open photo preview dialog
  const openPhotoPreview = (photos: string[], title: string, initialIndex: number = 0) => {
    setPhotoPreviewPhotos(photos);
    setPhotoPreviewTitle(title);
    setPhotoPreviewInitialIndex(initialIndex);
    setPhotoPreviewOpen(true);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 truncate">{lead.store_name}</h1>
          <p className="text-base sm:text-lg text-muted-foreground mt-1">Lead Details</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <Button 
            variant="outline" 
            onClick={() => navigate('/leads')} 
            className="flex items-center gap-2 text-sm sm:text-base"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Leads</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <DeleteLeadDialog lead={lead} />
        </div>
      </div>

      {/* Store Photos Card */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Camera className="h-6 w-6" />
            Store Photos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Exterior Photos */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h4 className="font-semibold text-lg">Exterior Photos</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {lead.exterior_photos?.length || 0} photos
                  </Badge>
                  {editingPhotos !== 'exterior' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startPhotoEditing('exterior')}
                      className="h-6 px-2"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>
              
              {lead.exterior_photos && lead.exterior_photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {lead.exterior_photos.map((photo, index) => (
                    <div 
                      key={index} 
                      className="relative aspect-video bg-muted rounded-lg overflow-hidden shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-200"
                      onClick={() => openPhotoPreview(lead.exterior_photos || [], "Exterior Photos", index)}
                    >
                      <img
                        src={`https://uiprdzdskaqakfwhzssc.supabase.co/storage/v1/object/public/lead-photos/${photo}`}
                        alt={`Store exterior ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden absolute inset-0 flex items-center justify-center bg-muted">
                        <div className="text-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground">Photo unavailable</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="absolute top-2 left-2 text-xs">
                        {index + 1}
                      </Badge>
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
                        <div className="opacity-0 hover:opacity-100 transition-opacity duration-200">
                          <ImageIcon className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden shadow-lg">
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <div className="text-center">
                      <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No exterior photos uploaded</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Photo Upload Component when editing */}
              {editingPhotos === 'exterior' && (
                <div className="space-y-4">
                  <PhotoUploadWithValidation
                    photos={tempExteriorPhotos}
                    onPhotosChange={setTempExteriorPhotos}
                    bucket="lead-photos"
                    maxPhotos={10}
                    className="w-full"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => savePhotoChanges('exterior')}
                      disabled={isPending}
                    >
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Changes
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelPhotoEditing}
                      disabled={isPending}
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Interior Photos */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h4 className="font-semibold text-lg">Interior Photos</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {lead.interior_photos?.length || 0} photos
                  </Badge>
                  {editingPhotos !== 'interior' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startPhotoEditing('interior')}
                      className="h-6 px-2"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>
              
              {lead.interior_photos && lead.interior_photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {lead.interior_photos.map((photo, index) => (
                    <div 
                      key={index} 
                      className="relative aspect-video bg-muted rounded-lg overflow-hidden shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-200"
                      onClick={() => openPhotoPreview(lead.interior_photos || [], "Interior Photos", index)}
                    >
                      <img
                        src={`https://uiprdzdskaqakfwhzssc.supabase.co/storage/v1/object/public/lead-photos/${photo}`}
                        alt={`Store interior ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden absolute inset-0 flex items-center justify-center bg-muted">
                        <div className="text-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground">Photo unavailable</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="absolute top-2 left-2 text-xs">
                        {index + 1}
                      </Badge>
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
                        <div className="opacity-0 hover:opacity-100 transition-opacity duration-200">
                          <ImageIcon className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden shadow-lg">
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <div className="text-center">
                      <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No interior photos uploaded</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Photo Upload Component when editing */}
              {editingPhotos === 'interior' && (
                <div className="space-y-4">
                  <PhotoUploadWithValidation
                    photos={tempInteriorPhotos}
                    onPhotosChange={setTempInteriorPhotos}
                    bucket="lead-photos"
                    maxPhotos={10}
                    className="w-full"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => savePhotoChanges('interior')}
                      disabled={isPending}
                    >
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Changes
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelPhotoEditing}
                      disabled={isPending}
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Information Card */}
      <Card className="overflow-hidden">
        <CardContent className="space-y-6">
          {/* Basic Information Section */}
          <div>
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-primary flex items-center gap-2">
                <Building className="h-6 w-6" />
                Basic Information
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <span className="font-bold text-base w-full sm:w-32 flex-shrink-0">Store:</span>
                <div className="flex-1">
                  <InlineEdit {...createInlineEditProps("store_name", lead.store_name)} />
                </div>
              </div>
              
              <div className="border-t border-border pt-3"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <span className="font-bold text-base w-full sm:w-32 flex-shrink-0">Company:</span>
                <div className="flex-1">
                  <InlineEdit {...createInlineEditProps("company_name", lead.company_name || "")} />
                </div>
              </div>
              
              <div className="border-t border-border pt-3"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <span className="font-bold text-base w-full sm:w-32 flex-shrink-0">Contact:</span>
                <div className="flex-1">
                  <InlineEdit {...createInlineEditProps("contact_person", lead.contact_person || "")} />
                </div>
              </div>
              
              <div className="border-t border-border pt-3"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <span className="font-bold text-base w-full sm:w-32 flex-shrink-0">Phone:</span>
                <div className="flex-1">
                  <InlineEdit {...createInlineEditProps("phone_number", lead.phone_number || "")} />
                </div>
              </div>
              
              <div className="border-t border-border pt-3"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <span className="font-bold text-base w-full sm:w-32 flex-shrink-0">Email:</span>
                <div className="flex-1">
                  <InlineEdit {...createInlineEditProps("email", lead.email || "")} />
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-border"></div>

          {/* Location & Business Section */}
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-primary">Location & Business</h3>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <span className="font-bold text-base w-full sm:w-32 flex-shrink-0">Territory:</span>
                <div className="flex-1">
                  <InlineEdit 
                    {...createInlineEditProps(
                      "territory_id", 
                      lead.territory_id || "", 
                      "select",
                      territories.map(territory => ({ value: territory.id, label: territory.city || 'Unknown' }))
                    )}
                  />
                </div>
              </div>
              
              <div className="border-t border-border pt-3"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <span className="font-bold text-base w-full sm:w-32 flex-shrink-0">Store Type:</span>
                <div className="flex-1">
                  <InlineEdit 
                    {...createInlineEditProps(
                      "store_type", 
                      lead.store_type || "", 
                      "select",
                      [
                        { value: "Vape Shop", label: "Vape Shop" },
                        { value: "Convenience Store", label: "Convenience Store" },
                        { value: "Supermarket", label: "Supermarket" }
                      ]
                    )}
                  />
                </div>
              </div>
              
              <div className="border-t border-border pt-3"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <span className="font-bold text-base w-full sm:w-32 flex-shrink-0">Weekly Spend:</span>
                <div className="flex-1">
                  <InlineEdit 
                    {...createInlineEditProps("weekly_spend", lead.weekly_spend?.toString() || "")}
                  />
                </div>
              </div>
              
              <div className="border-t border-border pt-3"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <span className="font-bold text-base w-full sm:w-32 flex-shrink-0">Coordinates:</span>
                <div className="flex-1 flex items-center gap-2">
                  {lead.latitude && lead.longitude ? (
                    <Button
                      variant="link"
                      className="p-0 h-auto text-sm text-blue-600 hover:text-blue-800 underline"
                      title="Click to open in Google Maps"
                      onClick={() => {
                        const url = `https://www.google.com/maps?q=${lead.latitude},${lead.longitude}`;
                        window.open(url, '_blank');
                      }}
                    >
                      <MapPin className="h-4 w-4 mr-1" />
                      {lead.latitude}, {lead.longitude}
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">Not set</span>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={getCurrentLocation}
                    disabled={isLoadingLocation}
                    className="h-6 w-6 p-0"
                  >
                    {isLoadingLocation ? <Loader2 className="h-3 w-3 animate-spin" /> : <Navigation className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
              
              <div className="border-t border-border pt-3"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <span className="font-bold text-base w-full sm:w-32 flex-shrink-0">Postal Code:</span>
                <div className="flex-1">
                  <InlineEdit {...createInlineEditProps("postal_code", lead.postal_code || "")} />
                </div>
              </div>
              
              <div className="border-t border-border pt-3"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <span className="font-bold text-base w-full sm:w-32 flex-shrink-0">Number of Stores:</span>
                <div className="flex-1">
                  <InlineEdit 
                    {...createInlineEditProps(
                      "number_of_stores", 
                      lead.number_of_stores || "", 
                      "select",
                      numberOfStoresOptions.map(option => ({ value: option, label: option }))
                    )}
                  />
                </div>
              </div>
              
              <div className="border-t border-border pt-3"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <span className="font-bold text-base w-full sm:w-32 flex-shrink-0">Current Supplier:</span>
                <div className="flex-1">
                  <InlineEdit {...createInlineEditProps("current_supplier", lead.current_supplier || "")} />
                </div>
              </div>
              
              <div className="border-t border-border pt-3"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <span className="font-bold text-base w-full sm:w-32 flex-shrink-0">Owns Shop/Website:</span>
                <div className="flex-1">
                  <InlineEdit 
                    {...createInlineEditProps(
                      "owns_shop_or_website", 
                      lead.owns_shop_or_website || "", 
                      "select",
                      ownsShopOrWebsiteOptions.map(option => ({ value: option, label: option }))
                    )}
                  />
                </div>
              </div>
              
              <div className="border-t border-border pt-3"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                <span className="font-bold text-base w-full sm:w-32 flex-shrink-0">Products:</span>
                <div className="flex-1">
                  <InlineEdit 
                    {...createInlineEditProps("top_3_selling_products", lead.top_3_selling_products?.join(', ') || "", "textarea")}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-border"></div>

          {/* Status & Visits Section */}
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-primary">Status & Visits</h3>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <span className="font-bold text-base w-full sm:w-32 flex-shrink-0">Status:</span>
                <div className="flex-1">
                  <InlineEdit 
                    {...createInlineEditProps(
                      "status", 
                      lead.status || "", 
                      "select",
                      leadStatusOptions.map(status => ({ 
                        value: status, 
                        label: status 
                      }))
                    )}
                  />
                </div>
              </div>
              
              <div className="border-t border-border pt-3"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <span className="font-bold text-base w-full sm:w-32 flex-shrink-0">Salesperson:</span>
                <div className="flex-1">
                  <InlineEdit 
                    {...createInlineEditProps(
                      "salesperson", 
                      lead.salesperson || "", 
                      "select",
                      salespeople.map(salesperson => ({ 
                        value: (salesperson as any).name || (salesperson as any).email || "", 
                        label: (salesperson as any).name || (salesperson as any).email || "" 
                      }))
                    )}
                  />
                </div>
              </div>
              
              <div className="border-t border-border pt-3"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <span className="font-bold text-base w-full sm:w-32 flex-shrink-0">Last Visit:</span>
                <div className="flex-1">
                  <InlineEdit {...createInlineEditProps("last_visit", lead.last_visit || "", "date")} />
                </div>
              </div>
              
              <div className="border-t border-border pt-3"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <span className="font-bold text-base w-full sm:w-32 flex-shrink-0">Next Visit:</span>
                <div className="flex-1">
                  <InlineEdit {...createInlineEditProps("next_visit", lead.next_visit || "", "date")} />
                </div>
              </div>
              
              <div className="border-t border-border pt-3"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <span className="font-bold text-base w-full sm:w-32 flex-shrink-0">Total Visits:</span>
                <span className="text-sm">{visitCount} visits</span>
              </div>
              
              {/* Timestamp Tracking Information */}
              {lead.form_start_time && (
                <>
                  <div className="border-t border-border pt-3"></div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <span className="font-bold text-base w-full sm:w-32 flex-shrink-0">Coordinates Filled:</span>
                    <span className="text-sm">{formatUKDate(lead.form_start_time)} {lead.form_start_time.includes('T') ? lead.form_start_time.split('T')[1].split('+')[0] : new Date(lead.form_start_time).toLocaleTimeString("en-GB", { timeZone: "Europe/London", hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                </>
              )}
              
              {lead.form_submit_time && (
                <>
                  <div className="border-t border-border pt-3"></div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <span className="font-bold text-base w-full sm:w-32 flex-shrink-0">Form Submitted:</span>
                    <span className="text-sm">{formatUKDate(lead.form_submit_time)} {lead.form_submit_time.includes('T') ? lead.form_submit_time.split('T')[1].split('+')[0] : new Date(lead.form_submit_time).toLocaleTimeString("en-GB", { timeZone: "Europe/London", hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                </>
              )}
              
              {lead.form_duration_ms && (
                <>
                  <div className="border-t border-border pt-3"></div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <span className="font-bold text-base w-full sm:w-32 flex-shrink-0">Entry Duration:</span>
                    <span className="text-sm">{formatDuration(lead.form_duration_ms)}</span>
                  </div>
                </>
              )}
              
              {lead.created_at && (
                <>
                  <div className="border-t border-border pt-3"></div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <span className="font-bold text-base w-full sm:w-32 flex-shrink-0">Created:</span>
                    <span className="text-sm">{new Date(lead.created_at).toLocaleDateString()}</span>
                  </div>
                </>
              )}
              
              {lead.updated_at && (
                <>
                  <div className="border-t border-border pt-3"></div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <span className="font-bold text-base w-full sm:w-32 flex-shrink-0">Updated:</span>
                    <span className="text-sm">{new Date(lead.updated_at).toLocaleDateString()}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <MessageSquare className="h-6 w-6" />
            Comments & Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Add new comment */}
          <div className="flex gap-3 mb-6">
            <Textarea
              placeholder="Add a comment or note..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 min-h-[80px]"
              rows={3}
            />
            <Button 
              onClick={addComment} 
              disabled={!newComment.trim() || isPending}
              className="self-end h-10 px-4"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {isPending ? 'Adding...' : 'Send'}
            </Button>
          </div>

          {/* Display comments */}
          <div className="space-y-4">
            {lead?.notes ? (
              <div className="border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">S</span>
                    </div>
                    <span className="font-semibold text-sm">System</span>
                    <Badge variant="secondary" className="text-xs">Notes</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatUKDate(lead.created_at || '')} {lead.created_at && lead.created_at.includes('T') ? lead.created_at.split('T')[1].split('.')[0] : new Date(lead.created_at || '').toLocaleTimeString("en-GB", { timeZone: "Europe/London", hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{lead.notes}</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No comments yet. Be the first to add one!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Photo Preview Dialog */}
      <PhotoPreviewDialog
        isOpen={photoPreviewOpen}
        onClose={() => setPhotoPreviewOpen(false)}
        photos={photoPreviewPhotos}
        title={photoPreviewTitle}
        initialIndex={photoPreviewInitialIndex}
      />
    </div>
  );
} 