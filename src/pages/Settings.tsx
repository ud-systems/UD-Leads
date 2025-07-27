
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { UserManagement } from "@/components/admin/UserManagement";
import { ColorPaletteSelector } from "@/components/admin/ColorPaletteSelector";
import { CompanyLogoManager } from "@/components/admin/CompanyLogoManager";
import { SystemThemeManager } from "@/components/admin/SystemThemeManager";
import { VisitTargetSettings } from "@/components/admin/VisitTargetSettings";
import { DataManagement } from "@/components/data/DataManagement";
import { DataExportImport } from "@/components/data/DataExportImport";
import { PushNotificationSettings } from "@/components/notifications/PushNotificationSettings";
import { useProfile } from "@/hooks/useProfile";

export default function Settings() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  
  const isAdmin = profile?.role === "admin";
  const isManager = profile?.role === "manager";

  return (
    <div className="h-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your system preferences and configuration</p>
      </div>

      <Tabs defaultValue={isAdmin ? "overview" : "appearance"} className="space-y-6">
        <div className="overflow-x-auto mobile-tabs-scroll mobile-tabs-container">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7 min-w-max">
            {isAdmin && <TabsTrigger value="overview">Overview</TabsTrigger>}
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            {isAdmin && <TabsTrigger value="branding">Branding</TabsTrigger>}
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
            {isAdmin && <TabsTrigger value="dataManagement">Data Management</TabsTrigger>}
            {(isAdmin || isManager) && <TabsTrigger value="users">Users</TabsTrigger>}
          </TabsList>
        </div>

        {isAdmin && (
          <TabsContent value="overview" className="space-y-6">
            <AdminDashboard />
          </TabsContent>
        )}

        <TabsContent value="appearance" className="space-y-6">
          <ColorPaletteSelector />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <PushNotificationSettings />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="branding" className="space-y-6">
            <CompanyLogoManager />
            <SystemThemeManager />
          </TabsContent>
        )}

        <TabsContent value="data" className="space-y-6">
          <DataExportImport />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="dataManagement" className="space-y-6">
            <DataManagement />
          </TabsContent>
        )}

        {(isAdmin || isManager) && (
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
