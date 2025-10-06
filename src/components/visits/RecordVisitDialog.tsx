import { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Loader2, Search, X, MapPin, Camera, CheckCircle, AlertCircle, Save, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLeads } from "@/hooks/useLeads";
import { useCreateVisit, useVisits } from "@/hooks/useVisits";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useLocationValidation } from "@/hooks/useLocationValidation";
import { useVisitDraft } from "@/hooks/useVisitDraft";
import { getUKDate, getUKTime, formatUKDate } from "@/utils/timeUtils";
import { PhotoUploadWithValidation } from "@/components/ui/photo-upload-with-validation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { VisitDraftRecoveryDialog } from "./VisitDraftRecoveryDialog";

interface RecordVisitDialogProps {
  children?: React.ReactNode;
}

export function RecordVisitDialog({ children }: RecordVisitDialogProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { isSalesperson } = useRoleAccess();
  const { data: leads } = useLeads();
  const { data: visits } = useVisits();
  const createVisit = useCreateVisit();
  const { validateProximity } = useLocationValidation();
  const { toast } = useToast();
  
  // Draft functionality
  const { 
    draft, 
    hasDraft, 
    saveDraft, 
    clearDraft, 
    updateDraftStep, 
    updateDraftData 
  } = useVisitDraft();
  
  const [showDraftRecovery, setShowDraftRecovery] = useState(false);
  
  // Get current date and time
  const getCurrentDateTime = () => {
    const date = getUKDate(); // YYYY-MM-DD format in UK timezone
    const time = getUKTime(); // HH:MM format in UK timezone
    return { date, time };
  };
  
  const [visitData, setVisitData] = useState({
    lead_id: "",
    date: getCurrentDateTime().date,
    time: getCurrentDateTime().time,
    notes: "",
    status: "completed",
    visit_start_time: "",
    visit_end_time: "",
    visit_latitude: null as number | null,
    visit_longitude: null as number | null,
  });
  
  const [visitStartTime, setVisitStartTime] = useState<string | null>(null);
  
  const [leadSearch, setLeadSearch] = useState("");
  const [showLeadDropdown, setShowLeadDropdown] = useState(false);
  const [exteriorPhotos, setExteriorPhotos] = useState<string[]>([]);
  const [interiorPhotos, setInteriorPhotos] = useState<string[]>([]);
  const [locationValidated, setLocationValidated] = useState<boolean | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isValidatingLocation, setIsValidatingLocation] = useState(false);
  const [showDuplicateVisitDialog, setShowDuplicateVisitDialog] = useState(false);
  const [duplicateVisitData, setDuplicateVisitData] = useState<{leadName: string, date: string} | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLeadDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Check for draft when dialog opens
  useEffect(() => {
    if (open && hasDraft && draft) {
      setShowDraftRecovery(true);
    }
  }, [open, hasDraft, draft]);

  // Filter leads based on search term
  const filteredLeads = useMemo(() => {
    if (!leadSearch.trim()) return leads || [];
    
    const searchTerm = leadSearch.toLowerCase();
    return (leads || []).filter(lead => 
      lead.store_name.toLowerCase().includes(searchTerm) ||
      lead.contact_person.toLowerCase().includes(searchTerm) ||
      lead.company_name.toLowerCase().includes(searchTerm) ||
      lead.postal_code?.toLowerCase().includes(searchTerm) ||
      lead.top_3_selling_products?.some(product => product.toLowerCase().includes(searchTerm))
    );
  }, [leads, leadSearch]);

  // Get selected lead details for display
  const selectedLead = useMemo(() => {
    return leads?.find(lead => lead.id === visitData.lead_id);
  }, [leads, visitData.lead_id]);

  // Handle lead selection from search
  const handleLeadSelection = (leadId: string) => {
    const { date, time } = getCurrentDateTime();
    const selectedLead = leads?.find(lead => lead.id === leadId);
    
    // Auto-log visit start time when lead is selected
    const startTime = new Date().toISOString();
    setVisitStartTime(startTime);
    
    setVisitData(prev => ({
      ...prev,
      lead_id: leadId,
      date: date,
      time: time,
      visit_start_time: startTime
    }));
    
    setLeadSearch(selectedLead?.store_name || "");
    setShowLeadDropdown(false);
    
    // Reset location validation when lead changes
    setLocationValidated(null);
    setLocationError(null);
    setVisitData(prev => ({
      ...prev,
      visit_latitude: null,
      visit_longitude: null
    }));
  };

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setLeadSearch(value);
    setShowLeadDropdown(true);
    
    // Clear selection if search doesn't match selected lead
    if (selectedLead && !value.toLowerCase().includes(selectedLead.store_name.toLowerCase())) {
      setVisitData(prev => ({ ...prev, lead_id: "" }));
      setLocationValidated(null);
      setLocationError(null);
      setVisitData(prev => ({
        ...prev,
        visit_latitude: null,
        visit_longitude: null
      }));
    }
  };

  // Clear selection
  const clearSelection = () => {
    setVisitData(prev => ({ ...prev, lead_id: "" }));
    setLeadSearch("");
    setShowLeadDropdown(false);
    setLocationValidated(null);
    setLocationError(null);
    setExteriorPhotos([]);
    setInteriorPhotos([]);
    setVisitStartTime(null);
    setCurrentStep(1);
  };

  // Draft recovery functions
  const handleRecoverDraft = () => {
    if (!draft) return;
    
    setCurrentStep(draft.step);
    setVisitData(draft.visitData);
    setLeadSearch(draft.leadSearch);
    setExteriorPhotos(draft.exteriorPhotos || []);
    setInteriorPhotos(draft.interiorPhotos || []);
    setLocationValidated(draft.locationValidated);
    setLocationError(draft.locationError);
    setVisitStartTime(draft.visitStartTime);
    
    toast({
      title: "Draft Recovered",
      description: "Your visit draft has been restored. You can continue where you left off.",
    });
  };

  const handleDiscardDraft = () => {
    clearDraft();
    toast({
      title: "Draft Discarded",
      description: "The saved draft has been permanently deleted.",
    });
  };

  // Step navigation functions
  const nextStep = () => {
    if (currentStep === 2) {
      // Enforce at least one exterior photo before moving to Step 3
      const hasExterior = exteriorPhotos.length > 0;
      if (!hasExterior) {
        // Inline validation only, do not use toast
        return;
      }
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      // Save draft when moving to next step
      saveDraft(
        currentStep + 1,
        visitData,
        leadSearch,
        exteriorPhotos,
        interiorPhotos,
        locationValidated,
        locationError,
        visitStartTime
      );
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      // Save draft when moving to previous step
      saveDraft(
        currentStep - 1,
        visitData,
        leadSearch,
        exteriorPhotos,
        interiorPhotos,
        locationValidated,
        locationError,
        visitStartTime
      );
    }
  };

  // Save & Exit functionality
  const handleSaveAndExit = () => {
    // Save current progress and close dialog
    saveDraft(
      currentStep,
      visitData,
      leadSearch,
      exteriorPhotos,
      interiorPhotos,
      locationValidated,
      locationError,
      visitStartTime
    );
    setOpen(false);
    toast({
      title: "Draft Saved",
      description: "Your visit progress has been saved. You can continue later.",
    });
  };

  // Check if current step is valid
  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return visitData.lead_id !== ""; // Only require lead selection, location validation is optional
      case 2:
        // Require at least 1 exterior photo
        return exteriorPhotos.length > 0;
      case 3:
        return true; // Status and notes are optional
      default:
        return false;
    }
  };

  // Get current location
  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  // Validate location proximity
  const handleLocationValidation = async () => {
    if (!selectedLead?.latitude || !selectedLead?.longitude) {
      setLocationError("Lead location not available for validation");
      return;
    }

    setIsValidatingLocation(true);
    setLocationError(null);

    try {
      // Use the proper validation function from the hook
      const validationResult = await validateProximity(
        selectedLead.latitude,
        selectedLead.longitude
      );

      // Get current location for storing in visit data
      const currentLocation = await getCurrentLocation();
      if (currentLocation) {
        setVisitData(prev => ({
          ...prev,
          visit_latitude: currentLocation.latitude,
          visit_longitude: currentLocation.longitude
        }));
      }

      if (validationResult.isValid) {
        setLocationValidated(true);
        setLocationError(null);
        toast({
          title: "Location Validated",
          description: `You are within the allowed distance from the lead location. Distance: ${validationResult.distance}m`,
        });
      } else {
        setLocationValidated(false);
        setLocationError(validationResult.error || "You are too far from the lead location");
        toast({
          title: "Location Validation Failed",
          description: validationResult.error || "You are too far from the lead location",
          variant: "destructive",
        });
      }
    } catch (error) {
      setLocationValidated(false);
      setLocationError("Failed to validate location. Please check your location permissions.");
      toast({
        title: "Location Error",
        description: "Failed to validate location. Please check your location permissions.",
        variant: "destructive",
      });
    } finally {
      setIsValidatingLocation(false);
    }
  };

  // Calculate visit duration
  const calculateDuration = () => {
    if (visitStartTime && visitData.visit_end_time) {
      const start = new Date(visitStartTime);
      const end = new Date(visitData.visit_end_time);
      const diffMs = end.getTime() - start.getTime();
      return Math.round(diffMs / 60000); // Convert to minutes
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only allow submission from Step 3
    if (currentStep !== 3) {
      console.log('Form submission blocked - not on final step');
      return;
    }
    
    // Call the actual submission logic
    await submitVisit();
  };

  const submitVisit = async () => {
    
    if (!visitData.lead_id || !visitData.date || !visitData.time) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Check if visits data is loaded
    if (!visits || visits.length === 0) {
      console.log('Visits data not loaded or empty:', visits);
      // Don't block submission if visits data is not available
      // The server-side validation will catch duplicates
    } else {
      // Check if a visit already exists for this lead on this date
      if (visitData.lead_id && visitData.date) {
        console.log('Checking for existing visits:', {
          leadId: visitData.lead_id,
          date: visitData.date,
          visitsCount: visits.length,
          selectedLeadName: selectedLead?.store_name
        });
        
        const existingVisit = visits.find(visit => {
          const visitDate = visit.date;
          const isSameLead = visit.lead_id === visitData.lead_id;
          const isSameDate = visitDate === visitData.date;
          
          console.log('Checking visit:', {
            visitLeadId: visit.lead_id,
            visitDate: visitDate,
            isSameLead,
            isSameDate,
            visitSalesperson: visit.salesperson
          });
          
          return isSameLead && isSameDate;
        });
        
        if (existingVisit) {
          console.log('Found existing visit:', existingVisit);
          setDuplicateVisitData({
            leadName: selectedLead?.store_name || 'this lead',
            date: formatUKDate(visitData.date)
          });
          setShowDuplicateVisitDialog(true);
          return;
        }
      }
    }

    // Warn if location is not validated but don't block submission
    if (locationValidated === false) {
      const proceed = window.confirm(
        "Location validation failed. You are not near the lead's original location. Do you want to proceed anyway?"
      );
      if (!proceed) return;
    }

    try {
      // Auto-log visit end time when form is submitted
      const endTime = new Date().toISOString();
      
      const duration = visitStartTime ? Math.round((new Date(endTime).getTime() - new Date(visitStartTime).getTime()) / 60000) : null;
      
      // Determine visit type based on existing visits for this lead
      const existingVisitsForLead = visits?.flatMap(visitGroup => 
        visitGroup.allVisits.filter(visit => visit.lead_id === visitData.lead_id)
      ) || [];
      
      const visitType = existingVisitsForLead.length === 0 ? 'initial' : 'revisit';

      await createVisit.mutateAsync({
        lead_id: visitData.lead_id,
        date: visitData.date,
        time: visitData.time,
        notes: visitData.notes,
        status: visitData.status,
        salesperson: profile?.name || user?.email || "Unknown",
        visit_start_time: visitStartTime || null,
        visit_end_time: endTime,
        visit_duration_minutes: duration,
        visit_latitude: visitData.visit_latitude,
        visit_longitude: visitData.visit_longitude,
        location_validated: locationValidated,
        exterior_photos: exteriorPhotos.length > 0 ? exteriorPhotos : null,
        interior_photos: interiorPhotos.length > 0 ? interiorPhotos : null,
        photo_count: exteriorPhotos.length + interiorPhotos.length,
        visit_type: visitType,
      });
      
      toast({
        title: "Success",
        description: "Visit recorded successfully with photos and location data",
      });
      
      // Clear draft on successful submission
      clearDraft();
      
      setOpen(false);
      setVisitData({
        lead_id: "",
        date: getCurrentDateTime().date,
        time: getCurrentDateTime().time,
        notes: "",
        status: "completed",
        visit_start_time: "",
        visit_end_time: "",
        visit_latitude: null,
        visit_longitude: null,
      });
      setLeadSearch("");
      setShowLeadDropdown(false);
      setExteriorPhotos([]);
      setInteriorPhotos([]);
      setLocationValidated(null);
      setLocationError(null);
      setVisitStartTime(null);
      setCurrentStep(1);
    } catch (error: any) {
      console.error("Error creating visit:", error);
      
      // Handle duplicate visit error specifically
      if (error.message && error.message.includes('already exists on this date')) {
        setDuplicateVisitData({
          leadName: selectedLead?.store_name || 'this lead',
          date: formatUKDate(visitData.date)
        });
        setShowDuplicateVisitDialog(true);
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to record visit",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Calendar className="h-4 w-4 mr-2" />
            Record Visit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Visit with Photos & Location</DialogTitle>
          <DialogDescription>
            Record a completed visit with photos, location validation, and duration tracking. Search for leads by store name, contact, company, or postal code.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step Progress Indicator */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : step < currentStep 
                      ? 'bg-green-500 text-white' 
                      : 'bg-muted text-muted-foreground'
                }`}>
                  {step < currentStep ? '✓' : step}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    step < currentStep ? 'bg-green-500' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Lead Selection and Location Validation */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Lead Selection */}
              <div className="space-y-2">
                <Label htmlFor="lead">Lead *</Label>
            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="lead"
                  type="text"
                  placeholder="Search by store name, contact, company, or postal code..."
                  value={leadSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setShowLeadDropdown(true)}
                  className="pl-10 pr-10"
                />
                {leadSearch && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={clearSelection}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              {showLeadDropdown && filteredLeads.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-80 overflow-auto">
                  {filteredLeads.slice(0, 15).map((lead) => (
                    <div
                      key={lead.id}
                      className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                      onClick={() => handleLeadSelection(lead.id)}
                    >
                      <div className="font-medium text-sm">{lead.store_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {lead.contact_person} • {lead.company_name}
                        {lead.postal_code && ` • ${lead.postal_code}`}
                        {lead.top_3_selling_products && lead.top_3_selling_products.length > 0 && ` • ${lead.top_3_selling_products.slice(0, 2).join(', ')}`}
                      </div>
                    </div>
                  ))}
                  {filteredLeads.length > 15 && (
                    <div className="px-4 py-2 text-xs text-muted-foreground text-center">
                      Showing first 15 results. Refine your search for more specific results.
                    </div>
                  )}
                </div>
              )}
              
              {showLeadDropdown && leadSearch && filteredLeads.length === 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    No leads found matching "{leadSearch}"
                  </div>
                </div>
              )}
            </div>
            
            {selectedLead && (
              <div className="mt-2 space-y-2">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                  <div className="text-sm font-medium text-green-800 dark:text-green-200">
                    Selected: {selectedLead.store_name}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-300">
                    {selectedLead.contact_person} • {selectedLead.company_name}
                    {selectedLead.postal_code && ` • ${selectedLead.postal_code}`}
                    {selectedLead.top_3_selling_products && selectedLead.top_3_selling_products.length > 0 && ` • ${selectedLead.top_3_selling_products.slice(0, 2).join(', ')}`}
                  </div>
                </div>
                
                {/* Check if visit already exists for today */}
                {(() => {
                  const today = getUKDate();
                  const existingVisit = visits?.find(visit => 
                    visit.lead_id === selectedLead.id && 
                    visit.date === today
                  );
                  
                  if (existingVisit) {
                    return (
                      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          <div className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            Visit Already Recorded Today
                          </div>
                        </div>
                        <div className="text-xs text-amber-600 dark:text-amber-300 mt-1">
                          A visit for this lead was already recorded today. Only one visit per lead per day is allowed.
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
          </div>


          {/* Step 1: Location Validation */}
          {selectedLead && (
            <div className="space-y-4">
              <div className="text-lg font-semibold">Step 1: Location Validation</div>
              
              {selectedLead.latitude && selectedLead.longitude ? (
                <div className="text-xs text-muted-foreground">
                  Lead Location: {selectedLead.latitude.toFixed(6)}, {selectedLead.longitude.toFixed(6)}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs text-amber-600 dark:text-amber-400">
                    ⚠️ This lead does not have location coordinates. Location validation is not available.
                  </div>
                  <div className="text-xs text-muted-foreground">
                    To enable location validation, edit this lead and add latitude/longitude coordinates.
                  </div>
                </div>
              )}
              
              {selectedLead.latitude && selectedLead.longitude && (
                <div className="flex items-center justify-between">
                  {locationValidated === null ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleLocationValidation}
                      disabled={isValidatingLocation}
                      className="flex-1"
                    >
                      {isValidatingLocation ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Validating Location...
                        </>
                      ) : (
                        <>
                          <MapPin className="h-4 w-4 mr-2" />
                          Validate Current Location
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-medium">Location Status:</span>
                      {locationValidated === true ? (
                        <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-md">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Validated</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 px-3 py-2 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Not Validated</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {selectedLead.latitude && selectedLead.longitude && locationValidated === false && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {locationError}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
            </div>
          )}

          {/* Step 2: Photo Uploads */}
          {currentStep === 2 && selectedLead && (
            <div className="space-y-4">
              <div className="text-lg font-semibold">Photo Uploads</div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>
                    Exterior Photos <span className="text-red-600">*</span>
                  </Label>
                  <PhotoUploadWithValidation
                    onPhotosChange={setExteriorPhotos}
                    maxPhotos={3}
                    storagePath={`visit-photos/${selectedLead.id}/exterior`}
                    forceLivePhoto
                  />
                  {exteriorPhotos.length === 0 && (
                    <div className="text-xs text-red-600">This field is required</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Interior Photos</Label>
                  <PhotoUploadWithValidation
                    onPhotosChange={setInteriorPhotos}
                    maxPhotos={3}
                    storagePath={`visit-photos/${selectedLead.id}/interior`}
                    forceLivePhoto
                  />
                </div>
              </div>
              
              {/* Photo Previews */}
              {(exteriorPhotos.length > 0 || interiorPhotos.length > 0) && (
                <div className="mt-4 space-y-3">
                  <div className="text-sm font-medium">Uploaded Photos</div>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Exterior Photo Previews */}
                    {exteriorPhotos.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">Exterior ({exteriorPhotos.length})</div>
                        <div className="grid grid-cols-2 gap-2">
                          {exteriorPhotos.map((photo, index) => (
                            <div key={index} className="relative aspect-square rounded-md overflow-hidden bg-muted">
                              <img
                                src={`https://uiprdzdskaqakfwhzssc.supabase.co/storage/v1/object/public/visit-photos/${photo}`}
                                alt={`Exterior photo ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Photo unavailable</div>';
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => setExteriorPhotos(prev => prev.filter((_, i) => i !== index))}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Interior Photo Previews */}
                    {interiorPhotos.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">Interior ({interiorPhotos.length})</div>
                        <div className="grid grid-cols-2 gap-2">
                          {interiorPhotos.map((photo, index) => (
                            <div key={index} className="relative aspect-square rounded-md overflow-hidden bg-muted">
                              <img
                                src={`https://uiprdzdskaqakfwhzssc.supabase.co/storage/v1/object/public/visit-photos/${photo}`}
                                alt={`Interior photo ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Photo unavailable</div>';
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => setInteriorPhotos(prev => prev.filter((_, i) => i !== index))}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Status and Notes */}
          {currentStep === 3 && (
            <div className="space-y-4">
            <div className="text-lg font-semibold">Status and Notes</div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={visitData.status} onValueChange={(value) => setVisitData({ ...visitData, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={visitData.notes}
                onChange={(e) => setVisitData({ ...visitData, notes: e.target.value })}
                placeholder="Add any notes for this visit"
                rows={3}
              />
            </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between space-x-2">
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={prevStep}>
                  Previous
                </Button>
              )}
            </div>
            
            <div className="flex space-x-2">
              {/* Save & Exit button - show when there's meaningful progress */}
              {(visitData.lead_id || exteriorPhotos.length > 0 || interiorPhotos.length > 0 || visitData.notes.trim()) && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleSaveAndExit}
                  className="flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save & Exit</span>
                </Button>
              )}
              
              {currentStep < 3 ? (
                <Button 
                  type="button" 
                  onClick={nextStep}
                  disabled={!isStepValid(currentStep)}
                >
                  Next
                </Button>
              ) : (
                <Button 
                  type="button" 
                  onClick={submitVisit}
                  disabled={createVisit.isPending || !visits}
                >
                  {createVisit.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Recording...
                    </>
                  ) : !visits ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 mr-2" />
                      Record Visit
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    {/* Duplicate Visit Dialog */}
    <Dialog open={showDuplicateVisitDialog} onOpenChange={setShowDuplicateVisitDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <span>Visit Already Recorded</span>
          </DialogTitle>
          <DialogDescription>
            A visit has already been logged for this lead on this date.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Duplicate Visit Detected
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  A visit for <strong>{duplicateVisitData?.leadName}</strong> has already been recorded on <strong>{duplicateVisitData?.date}</strong>.
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Only one visit per lead per day is allowed to maintain accurate visit tracking.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDuplicateVisitDialog(false);
                    setDuplicateVisitData(null);
                    // Clear the current form data so user can select a different lead
                    clearSelection();
                  }}
                >
                  Understood
                </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Visit Draft Recovery Dialog */}
    <VisitDraftRecoveryDialog
      open={showDraftRecovery}
      onOpenChange={setShowDraftRecovery}
      onRecover={handleRecoverDraft}
      onDiscard={handleDiscardDraft}
      draft={draft}
    />
    </>
  );
}
