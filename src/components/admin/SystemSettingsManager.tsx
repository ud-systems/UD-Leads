import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useSystemSettings, useUpdateSystemSetting } from "@/hooks/useSystemSettings";
import { Plus, Edit, Trash2, Settings, Save, X } from "lucide-react";

export function SystemSettingsManager() {
  const { data: settings, isLoading } = useSystemSettings();
  const updateSetting = useUpdateSystemSetting();
  const { toast } = useToast();

  const [openDialog, setOpenDialog] = useState(false);
  const [editingSetting, setEditingSetting] = useState<any>(null);
  const [formData, setFormData] = useState({
    key: "",
    value: "",
    description: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateSetting.mutateAsync({
        key: formData.key,
        value: formData.value,
        description: formData.description
      });
      
      toast({
        title: "Setting updated",
        description: "System setting has been updated successfully.",
      });
      
      setOpenDialog(false);
      setEditingSetting(null);
      setFormData({ key: "", value: "", description: "" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update setting. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (setting: any) => {
    setEditingSetting(setting);
    setFormData({
      key: setting.setting_key,
      value: setting.setting_value,
      description: setting.description || ""
    });
    setOpenDialog(true);
  };

  const handleDelete = async (setting: any) => {
    try {
      // For now, we'll just show a message since we don't have a delete mutation
      toast({
        title: "Cannot delete",
        description: "System settings cannot be deleted for data integrity.",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete setting",
        variant: "destructive",
      });
    }
  };

  const statusOptions = settings?.find(s => s.setting_key === 'retailer_status_options');
  const buyingPowerOptions = settings?.find(s => s.setting_key === 'buying_power_options');

  const parseJsonSetting = (setting: any) => {
    try {
      return JSON.parse(setting.setting_value);
    } catch (error) {
      return [];
    }
  };

  const statusList = statusOptions ? parseJsonSetting(statusOptions) : [];
  const buyingPowerList = buyingPowerOptions ? parseJsonSetting(buyingPowerOptions) : [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">System Settings Management</h3>
        <p className="text-sm text-muted-foreground">
          Manage system-wide settings and configuration options
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="statuses">Retailer Statuses</TabsTrigger>
          <TabsTrigger value="buying-power">Buying Power</TabsTrigger>
          <TabsTrigger value="all-settings">All Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Retailer Status Options
                </CardTitle>
                <CardDescription>
                  {statusList.length} status options configured
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {statusList.map((status: string, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span>{status}</span>
                    </div>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => handleEdit(statusOptions)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Status Options
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Buying Power Options
                </CardTitle>
                <CardDescription>
                  {buyingPowerList.length} buying power levels configured
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {buyingPowerList.map((power: string, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span>{power}</span>
                    </div>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => handleEdit(buyingPowerOptions)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Buying Power Options
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="statuses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Retailer Status Options</CardTitle>
              <CardDescription>
                Manage the available status options for leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current Status Options:</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEdit(statusOptions)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {statusList.map((status: string, index: number) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <span>{status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="buying-power" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Buying Power Options</CardTitle>
              <CardDescription>
                Manage the available buying power levels for leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current Buying Power Options:</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEdit(buyingPowerOptions)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {buyingPowerList.map((power: string, index: number) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <span>{power}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all-settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All System Settings</CardTitle>
              <CardDescription>
                View and manage all system configuration settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Setting Key</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings?.map((setting) => (
                    <TableRow key={setting.id}>
                      <TableCell className="font-mono text-sm">{setting.setting_key}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {setting.setting_value.length > 50 
                          ? `${setting.setting_value.substring(0, 50)}...` 
                          : setting.setting_value
                        }
                      </TableCell>
                      <TableCell>{setting.description || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(setting)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSetting ? 'Edit System Setting' : 'Add System Setting'}
            </DialogTitle>
            <DialogDescription>
              {editingSetting ? 'Update the system setting values' : 'Create a new system setting'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key">Setting Key</Label>
              <Input
                id="key"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="e.g., retailer_status_options"
                disabled={!!editingSetting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Setting Value (JSON)</Label>
              <Textarea
                id="value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder='e.g., ["Option 1", "Option 2", "Option 3"]'
                rows={6}
              />
              <p className="text-sm text-muted-foreground">
                Enter valid JSON format. For arrays, use: ["item1", "item2"]
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this setting"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpenDialog(false);
                  setEditingSetting(null);
                  setFormData({ key: "", value: "", description: "" });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateSetting.isPending}>
                {updateSetting.isPending ? (
                  <>
                    <Save className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Setting
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 