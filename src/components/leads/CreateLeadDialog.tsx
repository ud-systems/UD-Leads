import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateLead } from "@/hooks/useLeads";
import { useStoreTypeOptions, useWeeklySpendOptions, useOwnsShopOrWebsiteOptions, useNumberOfStoresOptions, useLeadStatusOptions } from "@/hooks/useSystemSettings";
import { useStatusColors } from "@/hooks/useStatusColors";
import { useToast } from "@/hooks/use-toast";
import { useUsers } from "@/hooks/useUsers";
import { useTerritories } from "@/hooks/useTerritories";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { MultiPhotoUpload } from "@/components/ui/multi-photo-upload";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { FormFieldWithValidation, SelectFieldWithValidation } from "@/components/ui/form-field-with-validation";
import { PhotoUploadWithValidation } from "@/components/ui/photo-upload-with-validation";
import { EnhancedTerritorySelect } from "@/components/ui/enhanced-territory-select";
import { Plus, Navigation, Loader2, X, Save, ArrowRight } from "lucide-react";
import { useLeadDraft } from "@/hooks/useLeadDraft";
import { DraftRecoveryDialog } from "./DraftRecoveryDialog";

export function CreateLeadDialog() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [formStartTime, setFormStartTime] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showDraftRecovery, setShowDraftRecovery] = useState(false);
  
  // Draft functionality
  const { 
    draft, 
    hasDraft, 
    saveDraft, 
    clearDraft, 
    updateDraftStep, 
    updateDraftData, 
    setFormStartTime: setDraftFormStartTime 
  } = useLeadDraft();
  
  const { mutate: createLead, isPending } = useCreateLead();
  const storeTypeOptions = useStoreTypeOptions();
  const weeklySpendOptions = useWeeklySpendOptions();
  const ownsShopOrWebsiteOptions = useOwnsShopOrWebsiteOptions();
  const numberOfStoresOptions = useNumberOfStoresOptions();
  const leadStatusOptions = useLeadStatusOptions();
  const { data: statusColors = [] } = useStatusColors();
  const { data: users = [] } = useUsers();
  const { data: territories = [] } = useTerritories();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: currentProfile } = useProfile(user?.id);
  const { isAdmin, isManager, isSalesperson } = useRoleAccess();

  // Filter users with salesperson role
  const salespeople = users.filter(user => (user as any).role === 'salesperson');

  const [formData, setFormData] = useState({
    // Basic Information
    store_name: "",
    company_name: "",
    contact_person: "",
    phone_number: "",
    email: "",
    
    // Location & Business
    store_type: "",
    weekly_spend: "",
    current_supplier: "",
    owns_shop_or_website: "",
    number_of_stores: "",
    territory_id: "",
    latitude: "",
    longitude: "",
    postal_code: "",
    products_currently_sold: "",
    
    // Status & Visits
    status: "New Prospect",
    salesperson: "",
    last_visit: "",
    next_visit: "",
    
    // Photos - Now arrays for multiple uploads
    exterior_photos: [] as string[],
    interior_photos: [] as string[],
    
    // Notes
    notes: ""
  });

  // Load draft data when dialog opens
  const handleDialogOpen = () => {
    if (hasDraft && draft) {
      setShowDraftRecovery(true);
    } else {
      setOpen(true);
    }
  };

  // Continue with draft
  const handleContinueDraft = () => {
    if (draft) {
      setFormData(draft.formData);
      setCurrentStep(draft.step);
      setFormStartTime(draft.formStartTime);
      setShowDraftRecovery(false);
      setOpen(true);
    }
  };

  // Discard draft and start fresh
  const handleDiscardDraft = () => {
    clearDraft();
    setShowDraftRecovery(false);
    setOpen(true);
  };

  // Auto-fill coordinates from user location
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
      
      setFormData(prev => ({
        ...prev,
        latitude: position.coords.latitude.toFixed(6),
        longitude: position.coords.longitude.toFixed(6)
      }));
      
      // Record start time when coordinates are first filled
      if (!formStartTime) {
        const startTime = new Date().toISOString();
        setFormStartTime(startTime);
        setDraftFormStartTime(startTime);
      }
      
      // Save draft when coordinates are filled
      saveDraft(currentStep, formData, formStartTime);
      
      toast({
        title: "Location Updated",
        description: "Coordinates have been auto-filled from your current location",
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

  const handleSaveAndExit = () => {
    // Save current progress and close dialog
    saveDraft(currentStep, formData, formStartTime);
    setOpen(false);
    toast({
      title: "Draft Saved",
      description: "Your progress has been saved. You can continue later.",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all required fields as touched to show validation errors
    setTouched(prev => ({ 
      ...prev, 
      store_name: true,
      contact_person: true,
      company_name: true,
      email: true,
      phone_number: true,
      number_of_stores: true,
      current_supplier: true,
      weekly_spend: true,
      products_currently_sold: true,
      owns_shop_or_website: true,
      territory_id: true,
      store_type: true,
      latitude: true,
      longitude: true,
      postal_code: true,
      status: true,
      notes: true,
      exterior_photos: true,
      interior_photos: true
    }));
    
    // Check for validation errors on all required fields
    const requiredFields = [
      'store_name', 'contact_person', 'company_name', 'email', 'phone_number',
      'number_of_stores', 'current_supplier', 'weekly_spend', 'products_currently_sold',
      'owns_shop_or_website', 'territory_id', 'store_type', 'latitude', 'longitude',
      'postal_code', 'status', 'notes', 'exterior_photos', 'interior_photos'
    ];

    for (const field of requiredFields) {
      if (getFieldError(field)) {
        return;
      }
    }

    const formSubmitTime = new Date().toISOString();
    const formDurationMs = formStartTime ? 
      new Date(formSubmitTime).getTime() - new Date(formStartTime).getTime() : 
      null;

    const leadData = {
      ...formData,
      salesperson: isSalesperson ? (currentProfile?.name || user?.email || "Unknown") : formData.salesperson || "",
      store_type: formData.store_type || undefined,
      weekly_spend: formData.weekly_spend || undefined,
      current_supplier: formData.current_supplier || undefined,
      owns_shop_or_website: formData.owns_shop_or_website || undefined,
      number_of_stores: formData.number_of_stores || undefined,
      territory_id: formData.territory_id || undefined,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      postal_code: formData.postal_code || undefined,
      products_currently_sold: formData.products_currently_sold ? formData.products_currently_sold.split(',').map(p => p.trim()) : [],
      last_visit: formData.last_visit || null,
      next_visit: formData.next_visit || null,
      exterior_photo_url: formData.exterior_photos[0] || undefined, // Keep first photo as primary
      interior_photo_url: formData.interior_photos[0] || undefined, // Keep first photo as primary
      exterior_photos: formData.exterior_photos,
      interior_photos: formData.interior_photos,
      // Add timestamp tracking fields
      form_start_time: formStartTime,
      form_submit_time: formSubmitTime,
      form_duration_ms: formDurationMs
    };

    createLead(leadData as any, {
      onSuccess: (createdLead) => {
        toast({
          title: "Success",
          description: "Lead created successfully with initial visit",
        });
        setOpen(false);
        clearDraft(); // Clear draft after successful submission
        setCurrentStep(1);
        setFormStartTime(null);
        setTouched({});
        setFormData({
          store_name: "",
          company_name: "",
          contact_person: "",
          phone_number: "",
          email: "",
          store_type: "",
          weekly_spend: "",
          current_supplier: "",
          owns_shop_or_website: "",
          number_of_stores: "",
          territory_id: "",
          latitude: "",
          longitude: "",
          postal_code: "",
          products_currently_sold: "",
          status: "New Prospect",
          salesperson: "",
          last_visit: "",
          next_visit: "",
          exterior_photos: [],
          interior_photos: [],
          notes: ""
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to create lead",
          variant: "destructive",
        });
      },
    });
  };

  // Validation helper - only show errors when user tries to proceed
  const getFieldError = (field: string): string | undefined => {
    // Only show validation errors when user has attempted to proceed (touched)
    if (!touched[field]) return undefined;
    
    switch (field) {
      case 'store_name':
        return !formData.store_name.trim() ? 'Store name is required' : undefined;
      case 'contact_person':
        return !formData.contact_person.trim() ? 'Contact person is required' : undefined;
      case 'company_name':
        return !formData.company_name.trim() ? 'Company name is required' : undefined;
      case 'email':
        return !formData.email.trim() ? 'Email is required' : undefined;
      case 'phone_number':
        return !formData.phone_number.trim() ? 'Phone number is required' : undefined;
      case 'number_of_stores':
        return !formData.number_of_stores.trim() ? 'Number of stores is required' : undefined;
      case 'current_supplier':
        return !formData.current_supplier.trim() ? 'Current supplier is required' : undefined;
      case 'weekly_spend':
        return !formData.weekly_spend.trim() ? 'Weekly spend is required' : undefined;
      case 'products_currently_sold':
        return !formData.products_currently_sold.trim() ? 'Products currently sold is required' : undefined;
      case 'owns_shop_or_website':
        return !formData.owns_shop_or_website.trim() ? 'Shop/Website ownership is required' : undefined;
      case 'territory_id':
        return !formData.territory_id.trim() ? 'Territory is required' : undefined;
      case 'store_type':
        return !formData.store_type.trim() ? 'Store type is required' : undefined;
      case 'latitude':
        return !formData.latitude.trim() ? 'Latitude is required' : undefined;
      case 'longitude':
        return !formData.longitude.trim() ? 'Longitude is required' : undefined;
      case 'postal_code':
        return !formData.postal_code.trim() ? 'Postal code is required' : undefined;
      case 'status':
        return !formData.status.trim() ? 'Status is required' : undefined;
      case 'notes':
        return !formData.notes.trim() ? 'Notes are required' : undefined;
      case 'exterior_photos':
        return formData.exterior_photos.length === 0 ? 'At least one exterior photo is required' : undefined;
      case 'interior_photos':
        return formData.interior_photos.length === 0 ? 'At least one interior photo is required' : undefined;
      default:
        return undefined;
    }
  };

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Record start time when coordinates are first filled manually
    if ((field === 'latitude' || field === 'longitude') && value && !formStartTime) {
      if (newFormData.latitude && newFormData.longitude) {
        const startTime = new Date().toISOString();
        setFormStartTime(startTime);
        setDraftFormStartTime(startTime);
      }
    }
    
    // Save draft on every input change
    saveDraft(currentStep, newFormData, formStartTime);
  };

  const nextStep = () => {
    // Mark fields as touched to show validation errors
    if (currentStep === 1) {
      setTouched(prev => ({ 
        ...prev, 
        store_name: true, 
        exterior_photos: true,
        territory_id: true,
        store_type: true,
        latitude: true,
        longitude: true,
        postal_code: true
      }));
      
      // Check validation errors for step 1
      if (!formData.store_name.trim() || 
          formData.exterior_photos.length === 0 ||
          !formData.territory_id.trim() ||
          !formData.store_type.trim() ||
          !formData.latitude.trim() ||
          !formData.longitude.trim() ||
          !formData.postal_code.trim()) {
        return;
      }
    } else if (currentStep === 2) {
      setTouched(prev => ({ 
        ...prev, 
        contact_person: true,
        company_name: true,
        email: true,
        phone_number: true,
        number_of_stores: true,
        current_supplier: true,
        weekly_spend: true,
        products_currently_sold: true,
        owns_shop_or_website: true,
        interior_photos: true
      }));
      
      // Check validation errors for step 2
      if (!formData.contact_person.trim() ||
          !formData.company_name.trim() ||
          !formData.email.trim() ||
          !formData.phone_number.trim() ||
          !formData.number_of_stores.trim() ||
          !formData.current_supplier.trim() ||
          !formData.weekly_spend.trim() ||
          !formData.products_currently_sold.trim() ||
          !formData.owns_shop_or_website.trim() ||
          formData.interior_photos.length === 0) {
        return;
      }
    }

    if (currentStep < 3) {
      const nextStepNumber = currentStep + 1;
      setCurrentStep(nextStepNumber);
      // Save draft with new step
      saveDraft(nextStepNumber, formData, formStartTime);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      const prevStepNumber = currentStep - 1;
      setCurrentStep(prevStepNumber);
      // Save draft with new step
      saveDraft(prevStepNumber, formData, formStartTime);
    }
  };



  const renderStep1 = () => (
    <div className="space-y-4">
      {/* Location Coordinates */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Location Coordinates</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            disabled={isLoadingLocation}
            className="flex items-center gap-2"
          >
            {isLoadingLocation ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
            Get Current Location
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FormFieldWithValidation
              label="Latitude *"
              value={formData.latitude}
              onChange={(e) => handleInputChange("latitude", e.target.value)}
              required={true}
              error={getFieldError('latitude')}
            />
          </div>

          <div>
            <FormFieldWithValidation
              label="Longitude *"
              value={formData.longitude}
              onChange={(e) => handleInputChange("longitude", e.target.value)}
              required={true}
              error={getFieldError('longitude')}
            />
          </div>
        </div>

        <div>
          <FormFieldWithValidation
            label="Postal Code *"
            value={formData.postal_code}
            onChange={(e) => handleInputChange("postal_code", e.target.value)}
            required={true}
            error={getFieldError('postal_code')}
          />
        </div>
      </div>

      {/* Exterior Photo */}
      <div>
        <PhotoUploadWithValidation
          label="Exterior Photo *"
          photos={formData.exterior_photos}
          onPhotosChange={(photos) => handleInputChange("exterior_photos", photos)}
          bucket="lead-photos"
          folder="exterior"
          maxPhotos={5}
          forceLivePhoto={true}
          required={true}
          error={getFieldError('exterior_photos')}
        />
      </div>

      {/* Store Name and Territory */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FormFieldWithValidation
            label="Store Name *"
            value={formData.store_name}
            onChange={(e) => handleInputChange("store_name", e.target.value)}
            required={true}
            error={getFieldError('store_name')}
          />
        </div>

        <div>
          <SelectFieldWithValidation
            label="Territory *"
            value={formData.territory_id}
            onValueChange={(value) => handleInputChange("territory_id", value)}
            placeholder="Select territory"
            required={true}
            error={getFieldError('territory_id')}
          >
            <Select value={formData.territory_id} onValueChange={(value) => handleInputChange("territory_id", value)}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select territory" />
              </SelectTrigger>
              <SelectContent>
                {territories.map((territory) => (
                  <SelectItem key={(territory as any).id} value={(territory as any).id}>
                    {(territory as any).city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SelectFieldWithValidation>
        </div>
      </div>

      {/* Store Type and Salesperson */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <SelectFieldWithValidation
            label="Store Type *"
            value={formData.store_type}
            onValueChange={(value) => handleInputChange("store_type", value)}
            placeholder="Select store type"
            required={true}
            error={getFieldError('store_type')}
          >
            <Select value={formData.store_type} onValueChange={(value) => handleInputChange("store_type", value)}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select store type" />
              </SelectTrigger>
              <SelectContent>
                {storeTypeOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SelectFieldWithValidation>
        </div>

        <div>
          {isSalesperson ? (
            <div className="px-3 py-4 text-sm text-muted-foreground bg-muted rounded-md border border-gray-300 dark:border-gray-600">
              {currentProfile?.name || user?.email || "Unknown"}
            </div>
          ) : (
            <Select
              value={formData.salesperson}
              onValueChange={(value) => handleInputChange("salesperson", value)}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select salesperson" />
              </SelectTrigger>
              <SelectContent>
                {salespeople.map((salesperson) => (
                  <SelectItem key={(salesperson as any).id} value={(salesperson as any).name || (salesperson as any).email || ''}>
                    {(salesperson as any).name || (salesperson as any).email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      {/* Contact Information - 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FloatingLabelInput
            label="Contact Person"
            value={formData.contact_person}
            onChange={(e) => handleInputChange("contact_person", e.target.value)}
          />
        </div>

        <div>
          <FloatingLabelInput
            label="Company Name"
            value={formData.company_name}
            onChange={(e) => handleInputChange("company_name", e.target.value)}
          />
        </div>
      </div>

      {/* Email and Phone - 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FloatingLabelInput
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
          />
        </div>

        <div>
          <FloatingLabelInput
            label="Phone Number"
            value={formData.phone_number}
            onChange={(e) => handleInputChange("phone_number", e.target.value)}
          />
        </div>
      </div>

      {/* Number of Stores and Current Supplier - 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Select value={formData.number_of_stores} onValueChange={(value) => handleInputChange("number_of_stores", value)}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select number of stores" />
            </SelectTrigger>
            <SelectContent>
              {numberOfStoresOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <FloatingLabelInput
            label="Current Supplier"
            value={formData.current_supplier}
            onChange={(e) => handleInputChange("current_supplier", e.target.value)}
          />
        </div>
      </div>

      {/* Weekly Spend and Owns Shop/Website - 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Select value={formData.weekly_spend} onValueChange={(value) => handleInputChange("weekly_spend", value)}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select weekly spend" />
            </SelectTrigger>
            <SelectContent>
              {weeklySpendOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select value={formData.owns_shop_or_website} onValueChange={(value) => handleInputChange("owns_shop_or_website", value)}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Do you own Shop or Website?" />
            </SelectTrigger>
            <SelectContent>
              {ownsShopOrWebsiteOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Currently Sold - Full width */}
      <div>
        <Textarea
          value={formData.products_currently_sold}
          onChange={(e) => handleInputChange("products_currently_sold", e.target.value)}
          placeholder="Products Currently Sold (comma-separated)"
          rows={3}
          className="h-12 min-h-[3rem]"
        />
      </div>

      {/* Interior Photo */}
      <div>
        <PhotoUploadWithValidation
          label="Interior Photo *"
          photos={formData.interior_photos}
          onPhotosChange={(photos) => handleInputChange("interior_photos", photos)}
          bucket="lead-photos"
          folder="interior"
          maxPhotos={5}
          forceLivePhoto={true}
          required={true}
          error={getFieldError('interior_photos')}
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      {/* Status and Visit Dates - 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {leadStatusOptions.map((option) => {
                const statusColor = statusColors.find(sc => sc.status_name === option);
                return (
                  <SelectItem key={option} value={option}>
                    <div className="flex items-center gap-2">
                      {statusColor && (
                        <div
                          className="w-3 h-3 rounded-full border"
                          style={{ backgroundColor: statusColor.color_code }}
                        />
                      )}
                      {option}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div>
          <FloatingLabelInput
            label="Last Visit Date"
            type="date"
            value={formData.last_visit}
            onChange={(e) => handleInputChange("last_visit", e.target.value)}
          />
        </div>

        <div>
          <FloatingLabelInput
            label="Next Visit Date"
            type="date"
            value={formData.next_visit}
            onChange={(e) => handleInputChange("next_visit", e.target.value)}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <Textarea
          value={formData.notes}
          onChange={(e) => handleInputChange("notes", e.target.value)}
          placeholder="Notes * (Enter additional notes about this lead)"
          rows={6}
          className={`min-h-[6rem] ${getFieldError('notes') ? 'border-red-500' : ''}`}
        />
        {getFieldError('notes') && (
          <div className="flex items-center gap-1.5 text-xs px-1 text-red-600 dark:text-red-400">
            <span className="leading-tight">{getFieldError('notes')}</span>
          </div>
        )}
      </div>
    </div>
  );



  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Location & Basic Info";
      case 2: return "Contact & Business Details";
      case 3: return "Status & Notes";
      default: return "";
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1: return "Set location coordinates, upload exterior photo, and enter basic store information";
      case 2: return "Provide contact details and business information, upload interior photo";
      case 3: return "Set lead status and add required notes";
      default: return "";
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="flex items-center gap-2" onClick={handleDialogOpen}>
            <Plus className="h-4 w-4" />
            Add Lead
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)] sm:w-full sm:max-w-2xl mx-auto sm:mx-0 bottom-0 sm:bottom-auto">
          <DialogHeader>
            <DialogTitle className="text-left">{getStepTitle()}</DialogTitle>
            <DialogDescription className="text-left">
              {getStepDescription()}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
            </div>

            <DialogFooter className="flex justify-between">
              <div className="flex gap-2">
                {currentStep > 1 && (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Previous
                  </Button>
                )}
              </div>
              
              <div className="flex gap-2">
                {/* Save & Exit button - shows when form has data */}
                {(formData.store_name || formData.contact_person || formData.latitude) && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleSaveAndExit}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save & Exit
                  </Button>
                )}
                
                {currentStep < 3 ? (
                  <Button type="button" onClick={nextStep} className="flex items-center gap-2">
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isPending}>
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      "Create Lead"
                    )}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Draft Recovery Dialog */}
      {draft && (
        <DraftRecoveryDialog
          isOpen={showDraftRecovery}
          onClose={() => setShowDraftRecovery(false)}
          draft={draft}
          onContinueDraft={handleContinueDraft}
          onDiscardDraft={handleDiscardDraft}
        />
      )}
    </>
  );
} 