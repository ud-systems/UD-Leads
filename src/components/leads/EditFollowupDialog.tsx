import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateLead } from "@/hooks/useLeads";
import { useLeadStatusOptions } from "@/hooks/useSystemSettings";
import { useToast } from "@/hooks/use-toast";
import { useTerritories } from "@/hooks/useTerritories";
import { useUsers } from "@/hooks/useUsers";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { Calendar, Loader2 } from "lucide-react";
import { Lead } from "@/hooks/useLeads";

interface EditFollowupDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditFollowupDialog({ lead, open, onOpenChange }: EditFollowupDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { mutate: updateLead } = useUpdateLead();
  const { data: statusOptions = [] } = useLeadStatusOptions();
  const { data: territories = [] } = useTerritories();
  const { data: users = [] } = useUsers();
  const { toast } = useToast();
  const { userRole } = useRoleAccess();

  const [formData, setFormData] = useState({
    store_name: "",
    contact_person: "",
    phone_number: "",
    email: "",
    status: "",
    territory_id: "",
    salesperson: "",
    next_visit: "",
    notes: ""
  });

  // Update form data when lead changes
  useEffect(() => {
    if (lead) {
      setFormData({
        store_name: lead.store_name || "",
        contact_person: lead.contact_person || "",
        phone_number: lead.phone_number || "",
        email: lead.email || "",
        status: lead.status || "",
        territory_id: lead.territory_id || "",
        salesperson: lead.salesperson || "",
        next_visit: lead.next_visit || "",
        notes: lead.notes || ""
      });
    }
  }, [lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!lead) return;

    setIsLoading(true);
    
    try {
      await updateLead({
        id: lead.id,
        updates: {
          store_name: formData.store_name,
          contact_person: formData.contact_person,
          phone_number: formData.phone_number,
          email: formData.email,
          status: formData.status,
          territory_id: formData.territory_id || null,
          salesperson: formData.salesperson,
          next_visit: formData.next_visit || null,
          notes: formData.notes
        }
      });
      
      toast({
        title: "Success",
        description: "Followup updated successfully",
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update followup",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] w-[calc(100vw-2rem)] sm:w-full">
        <DialogHeader>
          <DialogTitle>Edit Followup</DialogTitle>
          <DialogDescription>
            Update the followup information for {lead?.store_name}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="store_name">Store Name *</Label>
              <Input
                id="store_name"
                value={formData.store_name}
                onChange={(e) => handleInputChange("store_name", e.target.value)}
                required
                className="border border-input"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => handleInputChange("contact_person", e.target.value)}
                className="border border-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                value={formData.phone_number}
                onChange={(e) => handleInputChange("phone_number", e.target.value)}
                className="border border-input"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="border border-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger className="border border-input">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="territory">Territory</Label>
              <Select value={formData.territory_id} onValueChange={(value) => handleInputChange("territory_id", value)}>
                <SelectTrigger className="border border-input">
                  <SelectValue placeholder="Select territory" />
                </SelectTrigger>
                <SelectContent>
                  {territories.map(territory => (
                    <SelectItem key={territory.id} value={territory.id}>{territory.city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {userRole !== 'salesperson' && (
            <div className="space-y-2">
              <Label htmlFor="salesperson">Salesperson</Label>
              <Select value={formData.salesperson} onValueChange={(value) => handleInputChange("salesperson", value)}>
                <SelectTrigger className="border border-input">
                  <SelectValue placeholder="Select salesperson" />
                </SelectTrigger>
                <SelectContent>
                  {users.filter(user => (user as any).role === 'salesperson').map(user => (
                    <SelectItem key={user.id} value={(user as any).name}>{(user as any).name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="next_visit">Next Followup Date</Label>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                id="next_visit"
                type="date"
                value={formData.next_visit}
                onChange={(e) => handleInputChange("next_visit", e.target.value)}
                className="border border-input"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              rows={3}
              placeholder="Add any additional notes about this followup..."
              className="border border-input"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Followup
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 