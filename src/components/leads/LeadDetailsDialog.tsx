import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Lead } from "@/hooks/useLeads";
import { useLeadVisitCount } from "@/hooks/useLeads";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Building, 
  Calendar, 
  Store, 
  User, 
  FileText,
  TrendingUp,
  Edit,
  RefreshCw
} from "lucide-react";
import React from "react";

interface LeadDetailsDialogProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
}

export function LeadDetailsDialog({ lead, open, onOpenChange, onEdit }: LeadDetailsDialogProps) {
  const { data: visitCount = 0, refetch: refetchVisitCount } = useLeadVisitCount(lead.id);

  // Force refetch visit count when dialog opens
  React.useEffect(() => {
    if (open && lead.id) {
      refetchVisitCount();
    }
  }, [open, lead.id, refetchVisitCount]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New Prospect":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "In Discussion":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "Trial Order":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "Converted":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Visited - Follow-Up Required":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "Visited - No Interest":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getBuyingPowerColor = (power: string) => {
    switch (power) {
      case "Low":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "High":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)] sm:w-full">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{lead.store_name}</DialogTitle>
              <DialogDescription>
                Lead details and visit information
              </DialogDescription>
            </div>
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status and Visit Count */}
          <div className="flex items-center justify-between">
            <Badge className={getStatusColor(lead.status || "New Prospect")}>
              {lead.status || "New Prospect"}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{visitCount} visit{visitCount !== 1 ? 's' : ''}</span>
              {process.env.NODE_ENV === 'development' && (
                <>
                  <span className="text-xs">(ID: {lead.id})</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => refetchVisitCount()}
                    className="h-6 w-6 p-0"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Store Name</p>
                  <p className="text-sm text-muted-foreground">{lead.store_name}</p>
                </div>
              </div>

              {lead.company_name && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Company</p>
                    <p className="text-sm text-muted-foreground">{lead.company_name}</p>
                  </div>
                </div>
              )}

              {lead.contact_person && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Contact Person</p>
                    <p className="text-sm text-muted-foreground">{lead.contact_person}</p>
                  </div>
                </div>
              )}

              {lead.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{lead.email}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {lead.phone_number && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{lead.phone_number}</p>
                  </div>
                </div>
              )}

              {(lead.latitude && lead.longitude) && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{lead.latitude}, {lead.longitude}</p>
                  </div>
                </div>
              )}

              {lead.store_type && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Store Type</p>
                    <p className="text-sm text-muted-foreground">{lead.store_type}</p>
                  </div>
                </div>
              )}

              {lead.weekly_spend && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Weekly Spend</p>
                    <Badge className={getBuyingPowerColor(lead.weekly_spend)}>
                      {lead.weekly_spend}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Location Coordinates */}
          {(lead.latitude && lead.longitude) && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Coordinates</p>
              <p className="text-sm text-muted-foreground">Lat: {lead.latitude}, Long: {lead.longitude}</p>
            </div>
          )}

          {/* Notes */}
          {lead.notes && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Notes</p>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lead.notes}</p>
              </div>
            </div>
          )}

          {/* Created Date */}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Created: {new Date(lead.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 