
import { useState } from "react";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/hooks/useUsers";
import { useUserPreferences, useUpsertUserPreferences } from "@/hooks/useUserPreferences";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Users, Plus, Edit, Trash2, Target, Mail, Phone, MapPin, Shield, User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const userFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "manager", "salesperson"]),
  manager_id: z.string().optional(),
  daily_visit_target: z.number().min(1, "Target must be at least 1").max(50, "Target cannot exceed 50"),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserWithPreferences {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  manager_id: string | null;
  created_at: string | null;
  user_preferences?: {
    daily_visit_target: number | null;
  } | null;
}

export function UserManagement() {
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: systemSettings } = useSystemSettings();
  const { user } = useAuth();
  const { data: currentProfile } = useProfile(user?.id);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const upsertPreferences = useUpsertUserPreferences();
  const { toast } = useToast();
  
  const isManager = currentProfile?.role === 'manager';
  const isAdmin = currentProfile?.role === 'admin';

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithPreferences | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserWithPreferences | null>(null);

  const defaultTarget = parseInt(systemSettings?.find(s => s.setting_key === 'default_daily_visit_target')?.setting_value || '15');

  const createForm = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: isManager ? "salesperson" : "salesperson",
      manager_id: isManager ? user?.id : undefined,
      daily_visit_target: defaultTarget,
    },
  });

  const editForm = useForm<Omit<UserFormData, 'password'>>({
    resolver: zodResolver(userFormSchema.omit({ password: true })),
    defaultValues: {
      name: "",
      email: "",
      role: "salesperson",
      daily_visit_target: defaultTarget,
    },
  });

  const handleCreateUser = async (data: UserFormData) => {
    try {
      console.log('Starting user creation process...', { email: data.email, name: data.name, role: data.role });
      
      // Create user using the new interface
      const newUser = await createUser.mutateAsync({
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role,
        manager_id: isManager ? user?.id : (data.manager_id === "none" ? null : data.manager_id || null),
        daily_visit_target: data.daily_visit_target,
      });

      console.log('User created successfully:', newUser);

      console.log('User preferences created successfully');

      setIsCreateDialogOpen(false);
      createForm.reset();
      
      toast({
        title: "Success",
        description: `User ${data.name} created successfully.`,
      });
    } catch (error) {
      console.error('Error creating user:', error);
      
      // More detailed error handling
      let errorMessage = 'Failed to create user.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleEditUser = async (data: Omit<UserFormData, 'password'>) => {
    if (!editingUser) return;

    try {
      await updateUser.mutateAsync({
        id: editingUser.id,
        updates: {
          name: data.name,
          email: data.email,
          role: data.role,
          manager_id: isManager ? user?.id : (data.manager_id === "none" ? null : data.manager_id || null),
        },
      });

      // Update user preferences with visit target
      await upsertPreferences.mutateAsync({
        userId: editingUser.id,
        updates: {
          daily_visit_target: data.daily_visit_target,
        },
      });

      setIsEditDialogOpen(false);
      setEditingUser(null);
      editForm.reset();
      toast({
        title: "User updated",
        description: `${data.name} has been updated successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      await deleteUser.mutateAsync(deletingUser.id);
      setDeletingUser(null);
      toast({
        title: "User deleted",
        description: `${deletingUser.name} has been deleted successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (user: UserWithPreferences) => {
    setEditingUser(user);
    editForm.reset({
      name: user.name || "",
      email: user.email || "",
      role: (user.role as "admin" | "manager" | "salesperson") || "salesperson",
      manager_id: isManager ? user?.id : (user.manager_id || "none"),
      daily_visit_target: user.user_preferences?.daily_visit_target || defaultTarget,
    });
    setIsEditDialogOpen(true);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-3 w-3" />;
      case "manager":
        return <Users className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200";
      case "manager":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-green-100 text-green-800 border-green-200";
    }
  };

  if (usersLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage users, roles, and individual visit targets
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Add a new user to the system with their role and visit target.
                  </DialogDescription>
                </DialogHeader>
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(handleCreateUser)} className="space-y-4">
                    <FormField
                      control={createForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter email address" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter password" type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={isManager}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {isAdmin && (
                                <>
                                  <SelectItem value="salesperson">Salesperson</SelectItem>
                                  <SelectItem value="manager">Manager</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </>
                              )}
                              {isManager && (
                                <SelectItem value="salesperson">Salesperson</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          {isManager && (
                            <FormDescription>
                              Managers can only create salesperson accounts
                            </FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {isAdmin && (
                      <FormField
                        control={createForm.control}
                        name="manager_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Manager</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || "none"}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a manager (optional)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">No Manager</SelectItem>
                                {users?.filter(user => user.role === 'manager').map((manager) => (
                                  <SelectItem key={manager.id} value={manager.id}>
                                    {manager.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Assign a manager to oversee this user (only for salespersons)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    {isManager && (
                      <FormItem>
                        <FormLabel>Manager</FormLabel>
                        <div className="px-3 py-2 text-sm text-muted-foreground bg-muted rounded-md">
                          {currentProfile?.name} (You will be automatically assigned as manager)
                        </div>
                        <FormDescription>
                          New salespersons will be automatically assigned to you
                        </FormDescription>
                      </FormItem>
                    )}
                    <FormField
                      control={createForm.control}
                      name="daily_visit_target"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Daily Visit Target</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              max="50"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Number of visits this user should complete per day
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createUser.isPending}>
                        {createUser.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        Create User
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Visit Target</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={undefined} alt={user.name || ""} />
                          <AvatarFallback className="text-xs">
                            {user.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${getRoleColor(user.role || '')} flex items-center gap-1 w-fit`}>
                        {getRoleIcon(user.role || '')}
                        <span className="capitalize">{user.role || 'salesperson'}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.manager_id ? (
                        users?.find(manager => manager.id === user.manager_id)?.name || 'Unknown Manager'
                      ) : (
                        <span className="text-muted-foreground">No Manager</span>
                      )}
                    </TableCell>
                                         <TableCell>
                       <div className="flex items-center gap-1">
                         <Target className="h-3 w-3 text-muted-foreground" />
                         <span className="text-sm">{user.user_preferences?.daily_visit_target || defaultTarget} visits</span>
                       </div>
                     </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingUser(user)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {user.name}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setDeletingUser(null)}>
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteUser}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and visit target.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditUser)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email address" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isManager}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isAdmin && (
                          <>
                            <SelectItem value="salesperson">Salesperson</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </>
                        )}
                        {isManager && (
                          <SelectItem value="salesperson">Salesperson</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {isManager && (
                      <FormDescription>
                        Managers can only edit salesperson accounts
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
                            {isAdmin && (
                <FormField
                  control={editForm.control}
                  name="manager_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manager</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "none"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a manager (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No Manager</SelectItem>
                          {users?.filter(user => user.role === 'manager').map((manager) => (
                            <SelectItem key={manager.id} value={manager.id}>
                              {manager.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Assign a manager to oversee this user (only for salespersons)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {isManager && (
                <FormItem>
                  <FormLabel>Manager</FormLabel>
                  <div className="px-3 py-2 text-sm text-muted-foreground bg-muted rounded-md">
                    {currentProfile?.name} (You are the assigned manager)
                  </div>
                  <FormDescription>
                    This salesperson is assigned to you
                  </FormDescription>
                </FormItem>
              )}
              <FormField
                control={editForm.control}
                name="daily_visit_target"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Visit Target</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="50"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Number of visits this user should complete per day
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateUser.isPending}>
                  {updateUser.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Edit className="h-4 w-4 mr-2" />
                  )}
                  Update User
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
