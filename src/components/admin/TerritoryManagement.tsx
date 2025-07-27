
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTerritories, useCreateTerritory, useUpdateTerritory, useDeleteTerritory } from "@/hooks/useTerritories";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, MapPin, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// UK Cities for selection
const UK_CITIES = [
  "London", "Birmingham", "Leeds", "Glasgow", "Sheffield", "Bradford", "Edinburgh",
  "Liverpool", "Manchester", "Bristol", "Wakefield", "Cardiff", "Coventry", "Nottingham",
  "Leicester", "Sunderland", "Belfast", "Newcastle upon Tyne", "Brighton", "Hull",
  "Plymouth", "Stoke-on-Trent", "Wolverhampton", "Derby", "Swansea", "Southampton",
  "Aberdeen", "Westminster", "Portsmouth", "York", "Peterborough", "Dundee",
  "Lancaster", "Oxford", "Newport", "Preston", "St Albans", "Norwich", "Chester",
  "Salisbury", "Exeter", "Gloucester", "Bath", "Cambridge", "Lincoln", "Canterbury",
  "Durham", "Carlisle", "Worcester", "Wells", "Ripon", "Truro", "Bangor", "Lichfield",
  "Newry", "Lisburn", "Armagh", "Derry", "Inverness", "Perth", "Dunfermline",
  "Stirling", "Paisley", "East Kilbride", "Livingston", "Hamilton", "Kirkcaldy",
  "Ayr", "Kilmarnock", "Greenock", "Clydebank", "Motherwell", "Wishaw", "Coatbridge",
  "Bearsden", "Bishopbriggs", "Cumbernauld", "Kirkintilloch"
];

export function TerritoryManagement() {
  const { data: territories, isLoading } = useTerritories();
  const createTerritory = useCreateTerritory();
  const updateTerritory = useUpdateTerritory();
  const deleteTerritory = useDeleteTerritory();
  const { toast } = useToast();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTerritory, setEditingTerritory] = useState<any>(null);
  const [formData, setFormData] = useState({
    city: "",
    country: "United Kingdom",
    status: "active"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingTerritory) {
        await updateTerritory.mutateAsync({
          id: editingTerritory.id,
          updates: formData
        });
        toast({
          title: "Territory updated",
          description: "Territory has been updated successfully.",
        });
        setEditingTerritory(null);
      } else {
        await createTerritory.mutateAsync(formData);
        toast({
          title: "Territory created",
          description: "Territory has been created successfully.",
        });
        setIsCreateDialogOpen(false);
      }
      
      setFormData({ city: "", country: "United Kingdom", status: "active" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save territory. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (territory: any) => {
    setEditingTerritory(territory);
    setFormData({
      city: territory.city,
      country: territory.country,
      status: territory.status
    });
  };

  const handleDelete = async (territory: any) => {
    try {
      await deleteTerritory.mutateAsync(territory.id);
      toast({
        title: "Territory deleted",
        description: "Territory has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete territory. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Territory Management</h3>
          <p className="text-sm text-muted-foreground">Manage sales territories and assignments</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-button hover:bg-gradient-button-hover text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Territory
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Territory</DialogTitle>
              <DialogDescription>
                Add a new territory to your system for better organization.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Select value={formData.city} onValueChange={(value) => setFormData({ ...formData, city: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                  <SelectContent>
                    {UK_CITIES.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createTerritory.isPending} className="bg-gradient-button hover:bg-gradient-button-hover text-white">
                  Create Territory
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {territories?.map((territory) => (
          <Card key={territory.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">{territory.city}</CardTitle>
                </div>
                <Badge variant={territory.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                  {territory.status}
                </Badge>
              </div>
              <CardDescription>{territory.country}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(territory)}
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
                        Are you sure you want to delete {territory.city}? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(territory)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editingTerritory} onOpenChange={() => setEditingTerritory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Territory</DialogTitle>
            <DialogDescription>
              Update territory information and settings.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-city">City</Label>
              <Select value={formData.city} onValueChange={(value) => setFormData({ ...formData, city: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a city" />
                </SelectTrigger>
                <SelectContent>
                  {UK_CITIES.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-country">Country</Label>
              <Input
                id="edit-country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingTerritory(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateTerritory.isPending} className="bg-gradient-button hover:bg-gradient-button-hover text-white">
                Update Territory
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
