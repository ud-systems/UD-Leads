import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLeads } from "@/hooks/useLeads";
import { useCreateVisit } from "@/hooks/useVisits";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

export function ScheduleVisitDialog() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: leads } = useLeads();
  const createVisit = useCreateVisit();
  const { toast } = useToast();
  
  const [visitData, setVisitData] = useState({
    lead_id: "",
    date: "",
    time: "",
    notes: "",
    status: "scheduled",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!visitData.lead_id || !visitData.date || !visitData.time) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await createVisit.mutateAsync({
        lead_id: visitData.lead_id,
        date: visitData.date,
        time: visitData.time,
        notes: visitData.notes,
        status: visitData.status,
        salesperson: profile?.name || user?.email || "Unknown",
      });
      
      toast({
        title: "Success",
        description: "Visit scheduled successfully",
      });
      
      setOpen(false);
      setVisitData({
        lead_id: "",
        date: "",
        time: "",
        notes: "",
        status: "scheduled",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule visit",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Calendar className="h-4 w-4 mr-2" />
          Schedule Visit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Schedule Follow-up Visit</DialogTitle>
          <DialogDescription>
            Schedule a follow-up visit with an existing lead.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lead">Lead *</Label>
            <Select value={visitData.lead_id} onValueChange={(value) => setVisitData({ ...visitData, lead_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select lead" />
              </SelectTrigger>
              <SelectContent>
                {leads?.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.store_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={visitData.date}
                onChange={(e) => setVisitData({ ...visitData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={visitData.time}
                onChange={(e) => setVisitData({ ...visitData, time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={visitData.status} onValueChange={(value) => setVisitData({ ...visitData, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
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

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createVisit.isPending}>
              {createVisit.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Schedule Visit
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 