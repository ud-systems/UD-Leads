import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLeads } from "@/hooks/useLeads";
import { useTerritories, useCreateTerritory, useUpdateTerritory, useDeleteTerritory, useBulkUpdateTerritories, useBulkDeleteTerritories } from "@/hooks/useTerritories";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useSystemSettings, useUpdateSystemSetting } from "@/hooks/useSystemSettings";
import { useLeadStatusOptions, useBuyingPowerOptions, useStoreTypeOptions } from "@/hooks/useSystemSettings";
import { MultiSelect } from "@/components/ui/multi-select";
import { Plus, Edit, Trash2, Store, MapPin, DollarSign, Search, Filter, Users, CheckSquare, Square, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export function DataManagement() {
  const { data: leads } = useLeads();
  const { data: territories } = useTerritories();
  const createTerritory = useCreateTerritory();
  const updateTerritory = useUpdateTerritory();
  const deleteTerritory = useDeleteTerritory();
  const bulkUpdateTerritories = useBulkUpdateTerritories();
  const bulkDeleteTerritories = useBulkDeleteTerritories();
  const { toast } = useToast();
  const { canBulkOperations } = useRoleAccess();
  const updateSystemSetting = useUpdateSystemSetting();

  // Get database-driven options
  const leadStatuses = useLeadStatusOptions();
  const buyingPowerLevels = useBuyingPowerOptions();
  const storeTypeOptions = useStoreTypeOptions();

  const [activeTab, setActiveTab] = useState("statuses");
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [dialogType, setDialogType] = useState<string>("");
  const [selectedTerritories, setSelectedTerritories] = useState<any[]>([]);
  const [showTerritoryMultiSelect, setShowTerritoryMultiSelect] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "default",
    city: "",
    country: "United Kingdom",
    status: "Active"
  });

  // Use system settings for store types instead of extracting from leads
  const storeTypes = storeTypeOptions;

  const handleSave = async () => {
    try {
      switch (dialogType) {
        case "status":
          // Update system settings for lead statuses
          const newStatuses = [...leadStatuses, formData.name];
          await updateSystemSetting.mutateAsync({
            key: 'lead_status_options',
            value: JSON.stringify(newStatuses),
            description: 'Available lead status options'
          });
          break;
        case "weeklySpend":
          // Update system settings for weekly spend levels
          const newWeeklySpend = [...buyingPowerLevels, formData.name];
          await updateSystemSetting.mutateAsync({
            key: 'weekly_spend_options',
            value: JSON.stringify(newWeeklySpend),
            description: 'Available weekly spend levels'
          });
          break;
        case "storeType":
          // Update system settings for store types
          const newStoreTypes = [...storeTypeOptions, formData.name];
          await updateSystemSetting.mutateAsync({
            key: 'store_type_options',
            value: JSON.stringify(newStoreTypes),
            description: 'Available store type options'
          });
          break;
        case "territory":
          await createTerritory.mutateAsync({
            city: formData.city,
            country: formData.country,
            status: formData.status
          });
          break;
      }
      
      toast({
        title: "Success",
        description: "Item saved successfully",
      });
      
      setOpenDialog(false);
      setFormData({
        name: "",
        description: "",
        color: "default",
        city: "",
        country: "United Kingdom",
        status: "Active"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save item",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: any, type: string) => {
    setEditingItem(item);
    setDialogType(type);
    if (type === "territory") {
      setFormData({
        name: "",
        description: "",
        color: "default",
        city: item.city || "",
        country: item.country || "United Kingdom",
        status: item.status || "Active"
      });
    } else {
      setFormData({
        name: item.name || item,
        description: item.description || "",
        color: item.color || "default",
        city: "",
        country: "United Kingdom",
        status: "Active"
      });
    }
    setOpenDialog(true);
  };

  const handleDelete = async (item: any, type: string) => {
    try {
      switch (type) {
        case "status":
          const newStatuses = leadStatuses.filter((_, index) => index !== item.index);
          await updateSystemSetting.mutateAsync({
            key: 'lead_status_options',
            value: JSON.stringify(newStatuses),
            description: 'Available lead status options'
          });
          break;
        case "weeklySpend":
          const newWeeklySpend = buyingPowerLevels.filter((_, index) => index !== item.index);
          await updateSystemSetting.mutateAsync({
            key: 'weekly_spend_options',
            value: JSON.stringify(newWeeklySpend),
            description: 'Available weekly spend levels'
          });
          break;
        case "storeType":
          const newStoreTypes = storeTypeOptions.filter((_, index) => index !== item.index);
          await updateSystemSetting.mutateAsync({
            key: 'store_type_options',
            value: JSON.stringify(newStoreTypes),
            description: 'Available store type options'
          });
          break;
        case "territory":
          await deleteTerritory.mutateAsync(item.id);
          break;
      }
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const filteredStatuses = leadStatuses.filter(status =>
    status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStoreTypes = storeTypes.filter(type =>
    type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBuyingPower = buyingPowerLevels.filter(level =>
    level.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTerritories = territories?.filter(territory =>
    territory.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    territory.country.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Management</h1>
          <p className="text-muted-foreground">
            Manage system-wide data and configurations
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="overflow-x-auto mobile-tabs-scroll mobile-tabs-container">
          <TabsList className="flex w-full min-w-max space-x-1 p-1">
            <TabsTrigger value="statuses" className="flex-shrink-0">Statuses</TabsTrigger>
            <TabsTrigger value="storeTypes" className="flex-shrink-0">Store Types</TabsTrigger>
            <TabsTrigger value="buyingPower" className="flex-shrink-0">Buying Power</TabsTrigger>
            <TabsTrigger value="territories" className="flex-shrink-0">Territories</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add {activeTab.slice(0, -1)}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add {activeTab.slice(0, -1)}</DialogTitle>
                <DialogDescription>
                  Add a new {activeTab.slice(0, -1)} to the system
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {dialogType === "territory" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Enter city name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        placeholder="Enter country name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={`Enter ${activeTab.slice(0, -1)} name`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Enter description (optional)"
                      />
                    </div>
                  </>
                )}
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setOpenDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>Save</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="statuses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lead Statuses</CardTitle>
              <CardDescription>
                Manage available status options for leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredStatuses.map((status, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{status}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit({ name: status, index }, "status")}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Status</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{status}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete({ name: status, index }, "status")}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storeTypes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Store Types</CardTitle>
              <CardDescription>
                Manage available store type options for leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredStoreTypes.map((type, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{type}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit({ name: type, index }, "storeType")}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Store Type</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{type}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete({ name: type, index }, "storeType")}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
                {filteredStoreTypes.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No store types found. Add your first store type to get started.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="buyingPower" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Buying Power Levels</CardTitle>
              <CardDescription>
                Manage available buying power levels for leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredBuyingPower.map((level, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{level}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit({ name: level, index }, "buyingPower")}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Buying Power Level</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{level}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete({ name: level, index }, "buyingPower")}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>



        <TabsContent value="territories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Territories</CardTitle>
              <CardDescription>
                Manage territories and locations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredTerritories.map((territory) => (
                  <div key={territory.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="font-medium">{territory.city}</span>
                        <span className="text-muted-foreground ml-2">({territory.country})</span>
                      </div>
                      <Badge variant={territory.status === 'active' ? 'default' : 'secondary'}>
                        {territory.status}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(territory, "territory")}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Territory</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{territory.city}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(territory, "territory")}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 