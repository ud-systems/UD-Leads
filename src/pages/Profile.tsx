import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useUsers } from "@/hooks/useUsers";
import { useTerritories } from "@/hooks/useTerritories";
import { useToast } from "@/hooks/use-toast";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileUpload } from "@/components/ui/file-upload";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Shield, 
  Save, 
  X,
  Edit3,
  UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const updateProfileMutation = useUpdateProfile();
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const { data: territories = [], isLoading: territoriesLoading } = useTerritories();
  const { toast } = useToast();
  const { userRole, isSalesperson, isManager, isAdmin } = useRoleAccess();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    territory_id: "",
    manager_id: "",
    avatar_url: ""
  });

  // Get current user from users array
  const currentUser = users.find(u => u.id === user?.id);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        role: profile.role || "",
        territory_id: profile.territory_id || "",
        manager_id: profile.manager_id || "",
        avatar_url: profile.avatar_url || ""
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    // Convert special values to null/empty for database storage
    let processedValue = value;
    if (value === "no-territory") {
      processedValue = "";
    } else if (value === "no-manager") {
      processedValue = "";
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));
  };

  const handleSave = async () => {
    try {
      if (!user?.id) {
        toast({
          title: "Error",
          description: "User ID not found. Please try again.",
          variant: "destructive",
        });
        return;
      }

      await updateProfileMutation.mutateAsync({
        id: user.id,
        updates: {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          avatar_url: formData.avatar_url
        }
      });
      
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        role: profile.role || "",
        territory_id: profile.territory_id || "",
        manager_id: profile.manager_id || "",
        avatar_url: profile.avatar_url || ""
      });
    }
    setIsEditing(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth");
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (profileLoading || usersLoading || territoriesLoading || !user) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="animate-pulse">
                <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                    <div className="h-10 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Ensure we have the necessary data before rendering
  if (!profile || !users || !territories) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Profile Not Found</CardTitle>
              <CardDescription>
                Unable to load profile data. Please try refreshing the page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'manager': return 'secondary';
      case 'salesperson': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'manager': return <UserCheck className="h-4 w-4" />;
      case 'salesperson': return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-bold">Profile Settings</CardTitle>
                <CardDescription>
                  Manage your account information and preferences
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2 w-full sm:w-auto">
                    <Edit3 className="h-4 w-4" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button onClick={handleSave} className="flex items-center gap-2 flex-1 sm:flex-none">
                      <Save className="h-4 w-4" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={handleCancel} className="flex items-center gap-2 flex-1 sm:flex-none">
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="flex-shrink-0 flex justify-center sm:justify-start">
                <Avatar className="h-20 w-20">
                  <AvatarImage 
                    src={formData.avatar_url ? `https://uiprdzdskaqakfwhzssc.supabase.co/storage/v1/object/public/user-avatars/${formData.avatar_url}` : undefined} 
                    alt={formData.name} 
                  />
                  <AvatarFallback className="text-lg">
                    {formData.name ? formData.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <FileUpload
                    label="Profile Picture"
                    value={formData.avatar_url}
                    onChange={(path) => handleInputChange('avatar_url', path)}
                    bucket="user-avatars"
                    accept="image/*"
                    maxSize={2}
                  />
                ) : (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Profile Picture</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formData.avatar_url ? "Avatar uploaded" : "No avatar uploaded"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!isEditing}
                    className={cn(
                      "transition-colors",
                      !isEditing && "bg-muted/50 border-muted"
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing}
                    className={cn(
                      "transition-colors",
                      !isEditing && "bg-muted/50 border-muted"
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditing}
                    className={cn(
                      "transition-colors",
                      !isEditing && "bg-muted/50 border-muted"
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-medium">
                    Role
                  </Label>
                  {isEditing && !isSalesperson ? (
                    <Select
                      value={formData.role || ""}
                      onValueChange={(value) => handleInputChange('role', value)}
                    >
                      <SelectTrigger className={cn(
                        "transition-colors",
                        !isEditing && "bg-muted/50 border-muted"
                      )}>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {isAdmin && (
                          <>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                          </>
                        )}
                        {isManager && (
                          <SelectItem value="salesperson">Salesperson</SelectItem>
                        )}
                        <SelectItem value="salesperson">Salesperson</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge variant={getRoleBadgeVariant(formData.role || "")} className="flex items-center gap-1">
                        {getRoleIcon(formData.role || "")}
                        {(formData.role || "").charAt(0).toUpperCase() + (formData.role || "").slice(1)}
                      </Badge>
                      {isSalesperson && (
                        <span className="text-xs text-muted-foreground">(Cannot be changed)</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Work Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building className="h-5 w-5" />
                Work Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="territory" className="text-sm font-medium">
                    Territory
                  </Label>
                  {isEditing ? (
                    <Select
                      value={formData.territory_id || "no-territory"}
                      onValueChange={(value) => handleInputChange('territory_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select territory" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-territory">No Territory</SelectItem>
                        {territories?.map(territory => (
                          <SelectItem key={territory.id} value={territory.id}>
                            {territory.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {formData.territory_id 
                          ? territories?.find(t => t.id === formData.territory_id)?.city || "Unknown Territory"
                          : "No Territory Assigned"
                        }
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manager" className="text-sm font-medium">
                    Manager
                  </Label>
                  {isEditing && !isSalesperson ? (
                    <Select
                      value={formData.manager_id || "no-manager"}
                      onValueChange={(value) => handleInputChange('manager_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select manager" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-manager">No Manager</SelectItem>
                        {users
                          ?.filter(u => u.role === 'manager')
                          .map(manager => (
                            <SelectItem key={manager.id} value={manager.id}>
                              {manager.name}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {formData.manager_id 
                          ? users?.find(u => u.id === formData.manager_id)?.name || "Unknown Manager"
                          : "No Manager Assigned"
                        }
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Account Actions */}
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-muted-foreground">
                Last updated: {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'Never'}
              </div>
              <Button variant="outline" onClick={handleSignOut} className="text-destructive hover:text-destructive">
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 