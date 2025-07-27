import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteLead } from "@/hooks/useLeads";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle } from "lucide-react";
import { Lead } from "@/hooks/useLeads";

interface DeleteFollowupDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteFollowupDialog({ lead, open, onOpenChange }: DeleteFollowupDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { mutate: deleteLead } = useDeleteLead();
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!lead) return;

    setIsLoading(true);
    
    try {
      await deleteLead(lead.id);
      
      toast({
        title: "Success",
        description: "Followup deleted successfully",
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete followup",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Followup
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the followup for <strong>{lead?.store_name}</strong>? 
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Followup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 