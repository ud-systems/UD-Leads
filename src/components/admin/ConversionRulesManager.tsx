import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { useLeadStatusOptions } from "@/hooks/useSystemSettings";
import {
  useConversionRules,
  useCreateConversionRule,
  useUpdateConversionRule,
  useDeleteConversionRule,
  useSetDefaultConversionRule,
  ConversionRule,
} from "@/hooks/useConversionRules";
import { Plus, Edit, Trash2, Star, StarOff, Settings, Save, X } from "lucide-react";

export function ConversionRulesManager() {
  const { data: rules = [], isLoading } = useConversionRules();
  const { data: statusOptions = [], isLoading: statusLoading, error: statusError } = useLeadStatusOptions();
  const createRule = useCreateConversionRule();
  const updateRule = useUpdateConversionRule();
  const deleteRule = useDeleteConversionRule();
  const setDefaultRule = useSetDefaultConversionRule();
  const { toast } = useToast();

  // Debug logging
  console.log('ConversionRulesManager - statusOptions:', statusOptions);
  console.log('ConversionRulesManager - statusLoading:', statusLoading);
  console.log('ConversionRulesManager - statusError:', statusError);

  // Use only the status options from the database
  const availableStatusOptions = statusOptions || [];

  const [openDialog, setOpenDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<ConversionRule | null>(null);
  const [formData, setFormData] = useState({
    rule_name: "",
    rule_type: "transition" as "initial" | "transition" | "both",
    from_status: "",
    to_status: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.rule_name.trim()) {
      toast({
        title: "Error",
        description: "Rule name is required.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.to_status.trim()) {
      toast({
        title: "Error",
        description: "Target status is required.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (editingRule) {
        await updateRule.mutateAsync({
          id: editingRule.id,
          rule_name: formData.rule_name,
          rule_type: formData.rule_type,
          from_status: formData.from_status === "any" ? null : formData.from_status || null,
          to_status: formData.to_status,
        });
        
        toast({
          title: "Rule updated",
          description: "Conversion rule has been updated successfully.",
        });
      } else {
        await createRule.mutateAsync({
          rule_name: formData.rule_name,
          rule_type: formData.rule_type,
          from_status: formData.from_status === "any" ? null : formData.from_status || null,
          to_status: formData.to_status,
        });
        
        toast({
          title: "Rule created",
          description: "New conversion rule has been created successfully.",
        });
      }
      
      setOpenDialog(false);
      setEditingRule(null);
      setFormData({ rule_name: "", rule_type: "transition", from_status: "any", to_status: "" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save conversion rule. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (rule: ConversionRule) => {
    setEditingRule(rule);
    setFormData({
      rule_name: rule.rule_name,
      rule_type: rule.rule_type as "initial" | "transition" | "both",
      from_status: rule.from_status || "any",
      to_status: rule.to_status,
    });
    setOpenDialog(true);
  };

  const handleDelete = async (rule: ConversionRule) => {
    if (rule.is_default) {
      toast({
        title: "Cannot delete",
        description: "Cannot delete the default conversion rule.",
        variant: "destructive",
      });
      return;
    }

    try {
      await deleteRule.mutateAsync(rule.id);
      toast({
        title: "Rule deleted",
        description: "Conversion rule has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete conversion rule.",
        variant: "destructive",
      });
    }
  };

  const handleSetDefault = async (rule: ConversionRule) => {
    try {
      await setDefaultRule.mutateAsync(rule.id);
      toast({
        title: "Default rule updated",
        description: "Default conversion rule has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set default conversion rule.",
        variant: "destructive",
      });
    }
  };



  const resetForm = () => {
    setFormData({ rule_name: "", rule_type: "transition", from_status: "any", to_status: "" });
    setEditingRule(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading conversion rules...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Conversion Rules</h2>
          <p className="text-muted-foreground">
            Configure what constitutes a "conversion" based on lead statuses.
          </p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingRule ? "Edit Conversion Rule" : "Create Conversion Rule"}
              </DialogTitle>
              <DialogDescription>
                Define which lead statuses should be considered as conversions.
              </DialogDescription>
            </DialogHeader>
            
                         <form onSubmit={handleSubmit} className="space-y-4">
               <div className="space-y-2">
                 <Label htmlFor="rule_name">Rule Name *</Label>
                 <Input
                   id="rule_name"
                   value={formData.rule_name}
                   onChange={(e) => setFormData(prev => ({ ...prev, rule_name: e.target.value }))}
                   placeholder="e.g., Prospect to Converted, Initial Trial Order"
                 />
               </div>
               
               <div className="space-y-2">
                 <Label htmlFor="rule_type">Rule Type *</Label>
                 <Select
                   value={formData.rule_type}
                   onValueChange={(value) => setFormData(prev => ({ 
                     ...prev, 
                     rule_type: value as "initial" | "transition" | "both" 
                   }))}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="Select rule type" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="initial">Initial Creation</SelectItem>
                     <SelectItem value="transition">Status Transition</SelectItem>
                     <SelectItem value="both">Both</SelectItem>
                   </SelectContent>
                 </Select>
                 <p className="text-xs text-muted-foreground">
                   Initial: Lead created with target status | Transition: Status change to target | Both: Either scenario
                 </p>
               </div>
               
               {formData.rule_type !== "initial" && (
                 <div className="space-y-2">
                   <Label htmlFor="from_status">From Status</Label>
                   <Select
                     value={formData.from_status}
                     onValueChange={(value) => setFormData(prev => ({ ...prev, from_status: value }))}
                   >
                     <SelectTrigger>
                       <SelectValue placeholder="Any status (leave empty) or select specific status" />
                     </SelectTrigger>
                     <SelectContent>
                                               <SelectItem value="any">Any Status</SelectItem>
                       {availableStatusOptions.map((status) => (
                         <SelectItem key={status} value={status}>
                           {status}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                   <p className="text-xs text-muted-foreground">
                     Leave empty for "any status" or select a specific previous status
                   </p>
                 </div>
               )}
               
               <div className="space-y-2">
                 <Label htmlFor="to_status">To Status *</Label>
                 <Select
                   value={formData.to_status}
                   onValueChange={(value) => setFormData(prev => ({ ...prev, to_status: value }))}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="Select target status" />
                   </SelectTrigger>
                   <SelectContent>
                     {availableStatusOptions.map((status) => (
                       <SelectItem key={status} value={status}>
                         {status}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
                 <p className="text-xs text-muted-foreground">
                   The status that triggers a conversion when reached
                 </p>
               </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createRule.isPending || updateRule.isPending}>
                  {createRule.isPending || updateRule.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingRule ? "Update Rule" : "Create Rule"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {rules.map((rule) => (
          <Card key={rule.id} className={rule.is_default ? "border-primary" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CardTitle className="text-lg">{rule.rule_name}</CardTitle>
                  {rule.is_default && (
                    <Badge variant="default" className="bg-primary">
                      <Star className="h-3 w-3 mr-1" />
                      Default
                    </Badge>
                  )}
                  {!rule.is_active && (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {!rule.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(rule)}
                      disabled={setDefaultRule.isPending}
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Set Default
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(rule)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  {!rule.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(rule)}
                      disabled={deleteRule.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
                           </CardHeader>
             <CardContent>
               <div className="space-y-2">
                 <Label className="text-sm font-medium">Conversion Rule:</Label>
                 <div className="flex flex-wrap gap-2">
                   <Badge variant="outline" className="capitalize">
                     {rule.rule_type}
                   </Badge>
                   {rule.from_status && (
                     <>
                       <Badge variant="outline">
                         {rule.from_status}
                       </Badge>
                       <span className="text-muted-foreground">→</span>
                     </>
                   )}
                   <Badge variant="default">
                     {rule.to_status}
                   </Badge>
                 </div>
               </div>
            </CardContent>
          </Card>
        ))}
        
        {rules.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Settings className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No conversion rules configured yet.
                <br />
                Create your first rule to define what constitutes a conversion.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
