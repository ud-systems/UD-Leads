import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDeleteLead } from "@/hooks/useLeads";
import { useToast } from "@/hooks/use-toast";
import { Lead } from "@/hooks/useLeads";
import { Trash2 } from "lucide-react";

interface DeleteLeadDialogProps {
  lead: Lead;
}

export function DeleteLeadDialog({ lead }: DeleteLeadDialogProps) {
  const [open, setOpen] = useState(false);
  const { mutate: deleteLead, isPending } = useDeleteLead();
  const { toast } = useToast();

  const handleDelete = () => {
    deleteLead(lead.id, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Lead deleted successfully",
        });
        setOpen(false);
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to delete lead",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Lead</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{lead.store_name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Delete Lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 