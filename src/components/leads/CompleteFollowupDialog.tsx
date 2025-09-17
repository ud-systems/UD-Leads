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
} from "@/components/ui/dialog";
import { useUpdateLead } from "@/hooks/useLeads";
import { useCreateVisit } from "@/hooks/useVisits";
import { useToast } from "@/hooks/use-toast";
import { getUKDateTime } from "@/utils/timeUtils";
import { Calendar, CheckCircle, Loader2 } from "lucide-react";
import { Lead } from "@/hooks/useLeads";
import { format } from "date-fns";

interface CompleteFollowupDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompleteFollowupDialog({ lead, open, onOpenChange }: CompleteFollowupDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { mutate: updateLead } = useUpdateLead();
  const { mutate: createVisit } = useCreateVisit();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    followup_notes: "",
    visit_notes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!lead) return;

    setIsLoading(true);
    
    try {
      // Use UK timezone for follow-up completion
      const ukDateTime = getUKDateTime();
      
      // Update lead with follow-up completion
      await updateLead({
        id: lead.id,
        updates: {
          followup_status: 'completed',
          followup_completed_date: ukDateTime.iso,
          followup_completed_time: ukDateTime.iso,
          followup_notes: formData.followup_notes,
          last_visit: ukDateTime.date, // Set today as last visit
          next_visit: null // Clear next visit since it's completed
        }
      });

      // Create a visit record from the completed follow-up
      await createVisit({
        lead_id: lead.id,
        date: ukDateTime.date,
        time: ukDateTime.time,
        status: 'completed',
        notes: `Follow-up completed: ${formData.visit_notes || formData.followup_notes || 'No additional notes'}`,
        salesperson: lead.salesperson || 'Unknown'
      });
      
      toast({
        title: "Success",
        description: "Follow-up completed and converted to visit",
      });
      
      onOpenChange(false);
      setFormData({ followup_notes: "", visit_notes: "" });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete follow-up",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Complete Follow-up
          </DialogTitle>
          <DialogDescription>
            Complete the follow-up for {lead.store_name} and convert it to a visit.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Store</Label>
            <div className="px-3 py-2 text-sm bg-muted rounded-md">
              {lead.store_name}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Original Follow-up Date</Label>
            <div className="px-3 py-2 text-sm bg-muted rounded-md flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {lead.next_visit ? format(new Date(lead.next_visit), 'MMM dd, yyyy') : 'Not set'}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="followup_notes">Follow-up Notes</Label>
            <Textarea
              id="followup_notes"
              value={formData.followup_notes}
              onChange={(e) => handleInputChange("followup_notes", e.target.value)}
              placeholder="Enter follow-up completion notes..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visit_notes">Visit Notes (Optional)</Label>
            <Textarea
              id="visit_notes"
              value={formData.visit_notes}
              onChange={(e) => handleInputChange("visit_notes", e.target.value)}
              placeholder="Enter additional visit notes..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Complete Follow-up
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
