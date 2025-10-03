import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Camera, 
  CheckCircle, 
  AlertCircle, 
  ChevronDown, 
  ChevronRight,
  User,
  MessageSquare,
  Timer,
  Image as ImageIcon
} from "lucide-react";
import { formatUKDate, formatUKTime } from "@/utils/timeUtils";
import { Lead, Visit } from "@/integrations/supabase/types";
import { PhotoPreviewDialog } from "@/components/leads/PhotoPreviewDialog";

interface VisitHistorySectionProps {
  lead: Lead;
  visits: Visit[];
}

export function VisitHistorySection({ lead, visits }: VisitHistorySectionProps) {
  const [expandedVisits, setExpandedVisits] = useState<Set<string>>(new Set());
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [previewPhotos, setPreviewPhotos] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  // Sort visits by date and time (most recent first)
  const sortedVisits = useMemo(() => {
    return [...visits].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
      const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
      return dateB.getTime() - dateA.getTime();
    });
  }, [visits]);

  // Get visit type badge color
  const getVisitTypeBadge = (visitType: string | null) => {
    switch (visitType) {
      case 'initial':
        return <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Initial</Badge>;
      case 'revisit':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">Revisit</Badge>;
      default:
        return <Badge variant="outline">Visit</Badge>;
    }
  };

  // Get status badge color
  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed</Badge>;
      case 'scheduled':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Scheduled</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>;
    }
  };

  // Toggle visit expansion
  const toggleVisitExpansion = (visitId: string) => {
    const newExpanded = new Set(expandedVisits);
    if (newExpanded.has(visitId)) {
      newExpanded.delete(visitId);
    } else {
      newExpanded.add(visitId);
    }
    setExpandedVisits(newExpanded);
  };

  // Handle photo preview
  const handlePhotoPreview = (photoFilename: string, allPhotos: string[], index: number, photoType: 'exterior' | 'interior', exteriorPhotosCount: number) => {
    // Construct full URLs for all photos
    const fullPhotoUrls = allPhotos.map((photo, idx) => {
      if (photo.startsWith('http')) return photo; // Already a full URL
      const folder = idx < exteriorPhotosCount ? 'exterior' : 'interior';
      return `https://uiprdzdskaqakfwhzssc.supabase.co/storage/v1/object/public/visit-photos/${lead.id}/${folder}/${photo}`;
    });
    
    const currentPhotoUrl = `https://uiprdzdskaqakfwhzssc.supabase.co/storage/v1/object/public/visit-photos/${lead.id}/${photoType}/${photoFilename}`;
    
    setPreviewPhotos(fullPhotoUrls);
    setPreviewIndex(index);
    setPreviewPhoto(currentPhotoUrl);
  };

  // Format duration
  const formatDuration = (minutes: number | null) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  // Get location validation status
  const getLocationValidationStatus = (visit: Visit) => {
    if (visit.location_validated === true) {
      return (
        <div className="flex items-center text-green-600 dark:text-green-400">
          <CheckCircle className="h-3 w-3 mr-1" />
          <span className="text-xs">Location Validated</span>
        </div>
      );
    } else if (visit.location_validated === false) {
      return (
        <div className="flex items-center text-red-600 dark:text-red-400">
          <AlertCircle className="h-3 w-3 mr-1" />
          <span className="text-xs">Location Not Validated</span>
        </div>
      );
    }
    return null;
  };

  if (sortedVisits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Visit History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No visits recorded yet</p>
            <p className="text-sm">Visit records will appear here once visits are logged</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Visit History ({sortedVisits.length} visits)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedVisits.map((visit) => {
          const isExpanded = expandedVisits.has(visit.id);
          const hasPhotos = (visit.exterior_photos?.length || 0) + (visit.interior_photos?.length || 0) > 0;
          const allPhotos = [...(visit.exterior_photos || []), ...(visit.interior_photos || [])];

          return (
            <Collapsible key={visit.id} open={isExpanded} onOpenChange={() => toggleVisitExpansion(visit.id)}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                    
                    <div className="text-left">
                      <div className="font-medium">
                        {formatUKDate(visit.date)} at {formatUKTime(visit.time)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Visit #{visit.visit_number} • {visit.salesperson}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getVisitTypeBadge(visit.visit_type)}
                    {getStatusBadge(visit.status)}
                    {hasPhotos && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                        <Camera className="h-3 w-3 mr-1" />
                        {allPhotos.length}
                      </Badge>
                    )}
                  </div>
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-4">
                <div className="pl-12 border-l-2 border-muted ml-4">
                  <div className="space-y-4">
                    {/* Visit Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Salesperson:</span>
                          <span className="text-sm">{visit.salesperson}</span>
                        </div>
                        
                        {visit.visit_start_time && visit.visit_end_time && (
                          <div className="flex items-center space-x-2">
                            <Timer className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Duration:</span>
                            <span className="text-sm">
                              {formatUKTime(visit.visit_start_time)} - {formatUKTime(visit.visit_end_time)}
                              {formatDuration(visit.visit_duration_minutes) && (
                                <span className="text-muted-foreground ml-1">
                                  ({formatDuration(visit.visit_duration_minutes)})
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                        
                        {visit.visit_latitude && visit.visit_longitude && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Location:</span>
                            <span className="text-sm">
                              {visit.visit_latitude.toFixed(6)}, {visit.visit_longitude.toFixed(6)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        {getLocationValidationStatus(visit)}
                        
                        {visit.photo_count && visit.photo_count > 0 && (
                          <div className="flex items-center space-x-2">
                            <Camera className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Photos:</span>
                            <span className="text-sm">{visit.photo_count} uploaded</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    {visit.notes && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Notes:</span>
                        </div>
                        <div className="text-sm bg-muted/50 p-3 rounded-md">
                          {visit.notes}
                        </div>
                      </div>
                    )}

                    {/* Photos */}
                    {hasPhotos && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Photos:</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          {/* Exterior Photos */}
                          {visit.exterior_photos && visit.exterior_photos.length > 0 && (
                            <div className="space-y-2">
                              <div className="text-xs font-medium text-muted-foreground">Exterior ({visit.exterior_photos.length})</div>
                              <div className="grid grid-cols-2 gap-2">
                                {visit.exterior_photos.map((photo, index) => (
                                  <div
                                    key={index}
                                    className="relative aspect-square rounded-md overflow-hidden cursor-pointer group"
                                    onClick={() => handlePhotoPreview(photo, allPhotos, allPhotos.indexOf(photo), 'exterior', visit.exterior_photos?.length || 0)}
                                  >
                                    <img
                                      src={`https://uiprdzdskaqakfwhzssc.supabase.co/storage/v1/object/public/visit-photos/${lead.id}/exterior/${photo}`}
                                      alt={`Exterior photo ${index + 1}`}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Interior Photos */}
                          {visit.interior_photos && visit.interior_photos.length > 0 && (
                            <div className="space-y-2">
                              <div className="text-xs font-medium text-muted-foreground">Interior ({visit.interior_photos.length})</div>
                              <div className="grid grid-cols-2 gap-2">
                                {visit.interior_photos.map((photo, index) => (
                                  <div
                                    key={index}
                                    className="relative aspect-square rounded-md overflow-hidden cursor-pointer group"
                                    onClick={() => handlePhotoPreview(photo, allPhotos, allPhotos.indexOf(photo), 'interior', visit.exterior_photos?.length || 0)}
                                  >
                                    <img
                                      src={`https://uiprdzdskaqakfwhzssc.supabase.co/storage/v1/object/public/visit-photos/${lead.id}/interior/${photo}`}
                                      alt={`Interior photo ${index + 1}`}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </CardContent>

      {/* Photo Preview Dialog */}
      <PhotoPreviewDialog
        isOpen={!!previewPhoto}
        onClose={() => setPreviewPhoto(null)}
        photos={previewPhotos}
        currentIndex={previewIndex}
        onIndexChange={setPreviewIndex}
      />
    </Card>
  );
}
