import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Palette } from "lucide-react";
import { useStatusColors, useCreateStatusColor, useUpdateStatusColor, useDeleteStatusColor, type StatusColor } from "@/hooks/useStatusColors";
import { useToast } from "@/hooks/use-toast";

export function StatusColorManager() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<StatusColor | null>(null);
  const [formData, setFormData] = useState({
    status_name: "",
    color_code: "#3B82F6",
    background_color: "#DBEAFE",
    text_color: "#1E40AF",
  });

  const { data: statusColors = [], isLoading } = useStatusColors();
  const { mutate: createStatusColor, isPending: isCreating } = useCreateStatusColor();
  const { mutate: updateStatusColor, isPending: isUpdating } = useUpdateStatusColor();
  const { mutate: deleteStatusColor, isPending: isDeleting } = useDeleteStatusColor();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingStatus) {
      updateStatusColor(
        {
          id: editingStatus.id,
          updates: formData,
        },
        {
          onSuccess: () => {
            toast({
              title: "Status color updated",
              description: "The status color has been updated successfully.",
            });
            setIsCreateDialogOpen(false);
            setEditingStatus(null);
            resetForm();
          },
          onError: (error) => {
            toast({
              title: "Error",
              description: error.message,
              variant: "destructive",
            });
          },
        }
      );
    } else {
      createStatusColor(formData, {
        onSuccess: () => {
          toast({
            title: "Status color created",
            description: "The status color has been created successfully.",
          });
          setIsCreateDialogOpen(false);
          resetForm();
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        },
      });
    }
  };

  const handleEdit = (statusColor: StatusColor) => {
    setEditingStatus(statusColor);
    setFormData({
      status_name: statusColor.status_name,
      color_code: statusColor.color_code,
      background_color: statusColor.background_color,
      text_color: statusColor.text_color,
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this status color?")) {
      deleteStatusColor(id, {
        onSuccess: () => {
          toast({
            title: "Status color deleted",
            description: "The status color has been deleted successfully.",
          });
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        },
      });
    }
  };

  const resetForm = () => {
    setFormData({
      status_name: "",
      color_code: "#3B82F6",
      background_color: "#DBEAFE",
      text_color: "#1E40AF",
    });
    setEditingStatus(null);
  };

  const handleDialogClose = () => {
    setIsCreateDialogOpen(false);
    resetForm();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status Color Management</CardTitle>
          <CardDescription>Manage colors for different lead statuses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Status Color Management</CardTitle>
            <CardDescription>Manage colors for different lead statuses</CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Status Color
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingStatus ? "Edit Status Color" : "Add New Status Color"}
                </DialogTitle>
                <DialogDescription>
                  {editingStatus 
                    ? "Update the status color settings below."
                    : "Create a new status color with custom styling."
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status_name">Status Name</Label>
                  <Input
                    id="status_name"
                    value={formData.status_name}
                    onChange={(e) => setFormData({ ...formData, status_name: e.target.value })}
                    placeholder="e.g., New Prospect - Not Registered"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="color_code">Primary Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="color_code"
                        type="color"
                        value={formData.color_code}
                        onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={formData.color_code}
                        onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
                        placeholder="#3B82F6"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="background_color">Background Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="background_color"
                        type="color"
                        value={formData.background_color}
                        onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={formData.background_color}
                        onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                        placeholder="#DBEAFE"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="text_color">Text Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="text_color"
                        type="color"
                        value={formData.text_color}
                        onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={formData.text_color}
                        onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                        placeholder="#1E40AF"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="p-4 border rounded-lg">
                    <Badge
                      style={{
                        backgroundColor: formData.background_color,
                        color: formData.text_color,
                        borderColor: formData.color_code,
                      }}
                    >
                      {formData.status_name || "Sample Status"}
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating || isUpdating}>
                    {editingStatus ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status Name</TableHead>
              <TableHead>Preview</TableHead>
              <TableHead>Colors</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {statusColors.map((statusColor) => (
              <TableRow key={statusColor.id}>
                <TableCell className="font-medium">{statusColor.status_name}</TableCell>
                <TableCell>
                  <Badge
                    style={{
                      backgroundColor: statusColor.background_color,
                      color: statusColor.text_color,
                      borderColor: statusColor.color_code,
                    }}
                  >
                    {statusColor.status_name}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: statusColor.color_code }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {statusColor.color_code}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(statusColor)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(statusColor.id)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
