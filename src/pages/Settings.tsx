
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { UserManagement } from "@/components/admin/UserManagement";
import { ColorPaletteSelector } from "@/components/admin/ColorPaletteSelector";
import { CompanyLogoManager } from "@/components/admin/CompanyLogoManager";
import { SystemThemeManager } from "@/components/admin/SystemThemeManager";
import { VisitTargetSettings } from "@/components/admin/VisitTargetSettings";
import { StatusColorManager } from "@/components/admin/StatusColorManager";
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
          <TabsList className="flex w-full min-w-max space-x-1 p-1">
            {isAdmin && <TabsTrigger value="overview" className="flex-shrink-0">Overview</TabsTrigger>}
            <TabsTrigger value="appearance" className="flex-shrink-0">Appearance</TabsTrigger>
            {isAdmin && <TabsTrigger value="branding" className="flex-shrink-0">Branding</TabsTrigger>}
            <TabsTrigger value="notifications" className="flex-shrink-0">Notifications</TabsTrigger>
            <TabsTrigger value="data" className="flex-shrink-0">Data</TabsTrigger>
            {isAdmin && <TabsTrigger value="dataManagement" className="flex-shrink-0">Data Management</TabsTrigger>}
            {isAdmin && <TabsTrigger value="statusColors" className="flex-shrink-0">Status Colors</TabsTrigger>}
            {(isAdmin || isManager) && <TabsTrigger value="users" className="flex-shrink-0">Users</TabsTrigger>}
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

        {isAdmin && (
          <TabsContent value="statusColors" className="space-y-6">
            <StatusColorManager />
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
