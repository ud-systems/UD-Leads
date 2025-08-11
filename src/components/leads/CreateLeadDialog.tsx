import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useCreateVisit } from "@/hooks/useVisits";
import { useStoreTypeOptions, useWeeklySpendOptions, useOwnsShopOrWebsiteOptions, useNumberOfStoresOptions } from "@/hooks/useSystemSettings";
import { useToast } from "@/hooks/use-toast";
import { useUsers } from "@/hooks/useUsers";
import { useTerritories } from "@/hooks/useTerritories";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { MultiPhotoUpload } from "@/components/ui/multi-photo-upload";
import { Plus, Navigation, Loader2, X } from "lucide-react";

export function CreateLeadDialog() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  
  const { mutate: createLead, isPending } = useCreateLead();
  const { mutate: createVisit } = useCreateVisit();
  const storeTypeOptions = useStoreTypeOptions();
  const weeklySpendOptions = useWeeklySpendOptions();
  const ownsShopOrWebsiteOptions = useOwnsShopOrWebsiteOptions();
  const numberOfStoresOptions = useNumberOfStoresOptions();
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
    products_currently_sold: "",
    
    // Status & Visits
    status: "new",
    salesperson: "",
    last_visit: "",
    next_visit: "",
    
    // Photos - Now arrays for multiple uploads
    exterior_photos: [] as string[],
    interior_photos: [] as string[],
    
    // Notes
    notes: ""
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.store_name.trim()) {
      toast({
        title: "Error",
        description: "Store name is required",
        variant: "destructive",
      });
      return;
    }

    if (formData.exterior_photos.length === 0) {
      toast({
        title: "Error",
        description: "At least one exterior photo is required",
        variant: "destructive",
      });
      return;
    }

    if (formData.interior_photos.length === 0) {
      toast({
        title: "Error",
        description: "At least one interior photo is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.notes.trim()) {
      toast({
        title: "Error",
        description: "Notes are required",
        variant: "destructive",
      });
      return;
    }

    const leadData = {
      ...formData,
      salesperson: isSalesperson ? (currentProfile?.name || user?.email || "Unknown") : formData.salesperson,
      store_type: formData.store_type || undefined,
      weekly_spend: formData.weekly_spend || undefined,
      current_supplier: formData.current_supplier || undefined,
      owns_shop_or_website: formData.owns_shop_or_website || undefined,
      number_of_stores: formData.number_of_stores || undefined,
      territory_id: formData.territory_id || undefined,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      products_currently_sold: formData.products_currently_sold ? formData.products_currently_sold.split(',').map(p => p.trim()) : [],
      last_visit: formData.last_visit || null,
      next_visit: formData.next_visit || null,
      exterior_photo_url: formData.exterior_photos[0] || undefined, // Keep first photo as primary
      interior_photo_url: formData.interior_photos[0] || undefined, // Keep first photo as primary
      exterior_photos: formData.exterior_photos,
      interior_photos: formData.interior_photos
    };

    createLead(leadData as any, {
      onSuccess: (createdLead) => {
        // Automatically create an initial visit for the new lead
        if (createdLead && createdLead.id) {
          const visitData = {
            lead_id: createdLead.id,
            date: new Date().toISOString().split('T')[0], // Today's date
            time: new Date().toLocaleTimeString('en-US', { 
              hour12: false, 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            status: 'completed',
            salesperson: leadData.salesperson,
            notes: `Initial visit - Lead created on ${new Date().toLocaleDateString()}`,
            manager_id: isManager ? user?.id : null
          };

          createVisit(visitData, {
            onSuccess: () => {
              console.log('Initial visit created for lead:', createdLead.id);
            },
            onError: (error) => {
              console.error('Failed to create initial visit:', error);
              // Don't show error to user since lead was created successfully
            }
          });
        }

        toast({
          title: "Success",
          description: "Lead created successfully with initial visit",
        });
        setOpen(false);
        setCurrentStep(1);
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
          products_currently_sold: "",
          status: "new",
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

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    // Validate current step before proceeding
    if (currentStep === 1) {
      if (!formData.store_name.trim()) {
        toast({
          title: "Error",
          description: "Store name is required to continue",
          variant: "destructive",
        });
        return;
      }
    } else if (currentStep === 3) {
      if (formData.exterior_photos.length === 0) {
        toast({
          title: "Error",
          description: "At least one exterior photo is required to continue",
          variant: "destructive",
        });
        return;
      }
      if (formData.interior_photos.length === 0) {
        toast({
          title: "Error",
          description: "At least one interior photo is required to continue",
          variant: "destructive",
        });
        return;
      }
    }

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex space-x-4">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  currentStep >= step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step}
              </div>
              {step < 4 && (
                <div
                  className={`w-12 h-0.5 mx-2 ${
                    currentStep > step ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="text-center">
        <h3 className="text-lg font-semibold">{getStepTitle()}</h3>
        <p className="text-sm text-muted-foreground">{getStepDescription()}</p>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="store_name">Store Name *</Label>
        <Input
          id="store_name"
          value={formData.store_name}
          onChange={(e) => handleInputChange("store_name", e.target.value)}
          placeholder="Enter store name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="company_name">Company Name</Label>
        <Input
          id="company_name"
          value={formData.company_name}
          onChange={(e) => handleInputChange("company_name", e.target.value)}
          placeholder="Enter company name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact_person">Contact Person</Label>
        <Input
          id="contact_person"
          value={formData.contact_person}
          onChange={(e) => handleInputChange("contact_person", e.target.value)}
          placeholder="Enter contact person name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          placeholder="Enter email address"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone_number">Phone Number</Label>
        <Input
          id="phone_number"
          value={formData.phone_number}
          onChange={(e) => handleInputChange("phone_number", e.target.value)}
          placeholder="Enter phone number"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="salesperson">Salesperson</Label>
        {isSalesperson ? (
          <div className="px-3 py-2 text-sm text-muted-foreground bg-muted rounded-md">
            {currentProfile?.name || user?.email || "Unknown"}
          </div>
        ) : (
          <Select
            value={formData.salesperson}
            onValueChange={(value) => handleInputChange("salesperson", value)}
          >
            <SelectTrigger>
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
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="territory_id">Territory</Label>
        <Select value={formData.territory_id} onValueChange={(value) => handleInputChange("territory_id", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select territory" />
          </SelectTrigger>
          <SelectContent>
            {territories.map((territory) => (
              <SelectItem key={territory.id} value={territory.id}>
                {territory.city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="store_type">Store Type</Label>
          <Select value={formData.store_type} onValueChange={(value) => handleInputChange("store_type", value)}>
            <SelectTrigger>
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="weekly_spend">Weekly Spend</Label>
          <Select value={formData.weekly_spend} onValueChange={(value) => handleInputChange("weekly_spend", value)}>
            <SelectTrigger>
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="current_supplier">Current Supplier</Label>
        <Input
          id="current_supplier"
          value={formData.current_supplier}
          onChange={(e) => handleInputChange("current_supplier", e.target.value)}
          placeholder="Enter current supplier information"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="owns_shop_or_website">Do you own shop or website?</Label>
          <Select value={formData.owns_shop_or_website} onValueChange={(value) => handleInputChange("owns_shop_or_website", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select option" />
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

        <div className="space-y-2">
          <Label htmlFor="number_of_stores">Number of Stores</Label>
          <Select value={formData.number_of_stores} onValueChange={(value) => handleInputChange("number_of_stores", value)}>
            <SelectTrigger>
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="products_currently_sold">Products Currently Sold</Label>
        <Textarea
          id="products_currently_sold"
          value={formData.products_currently_sold}
          onChange={(e) => handleInputChange("products_currently_sold", e.target.value)}
          placeholder="Enter products (comma-separated)"
          rows={3}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Location Coordinates</Label>
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
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              value={formData.latitude}
              onChange={(e) => handleInputChange("latitude", e.target.value)}
              placeholder="Enter latitude"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              value={formData.longitude}
              onChange={(e) => handleInputChange("longitude", e.target.value)}
              placeholder="Enter longitude"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="prospect">Prospect</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_visit">Last Visit Date</Label>
          <Input
            id="last_visit"
            type="date"
            value={formData.last_visit}
            onChange={(e) => handleInputChange("last_visit", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="next_visit">Next Visit Date</Label>
        <Input
          id="next_visit"
          type="date"
          value={formData.next_visit}
          onChange={(e) => handleInputChange("next_visit", e.target.value)}
        />
      </div>

      {/* Exterior Photos */}
      <div className="space-y-3">
        <MultiPhotoUpload
          label="Exterior Photos *"
          photos={formData.exterior_photos}
          onPhotosChange={(photos) => handleInputChange("exterior_photos", photos)}
          bucket="lead-photos"
          folder="exterior"
          maxPhotos={5}
        />
      </div>

      {/* Interior Photos */}
      <div className="space-y-3">
        <MultiPhotoUpload
          label="Interior Photos *"
          photos={formData.interior_photos}
          onPhotosChange={(photos) => handleInputChange("interior_photos", photos)}
          bucket="lead-photos"
          folder="interior"
          maxPhotos={5}
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="notes">Notes *</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleInputChange("notes", e.target.value)}
          placeholder="Enter additional notes about this lead"
          rows={6}
        />
      </div>
    </div>
  );

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Basic Information";
      case 2: return "Location & Business";
      case 3: return "Status & Photos";
      case 4: return "Additional Notes";
      default: return "";
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1: return "Enter the basic contact information for this lead";
      case 2: return "Provide location details and business information";
      case 3: return "Set status and upload multiple store photos (exterior and interior)";
      case 4: return "Add required notes or comments about this lead";
      default: return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)] sm:w-full">
        <DialogHeader>
          <DialogTitle>Create New Lead</DialogTitle>
          <DialogDescription>
            Fill in the information below to create a new lead. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {renderStepIndicator()}

          <div className="space-y-4">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
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
              {currentStep < 4 ? (
                <Button type="button" onClick={nextStep}>
                  Next
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
  );
} 