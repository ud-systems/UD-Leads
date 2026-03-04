
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { UserManagement } from "@/components/admin/UserManagement";
import { ColorPaletteSelector } from "@/components/admin/ColorPaletteSelector";
import { CompanyLogoManager } from "@/components/admin/CompanyLogoManager";
import { SystemThemeManager } from "@/components/admin/SystemThemeManager";
import { VisitTargetSettings } from "@/components/admin/VisitTargetSettings";
import { ConversionRulesManager } from "@/components/admin/ConversionRulesManager";

import { DataManagement } from "@/components/data/DataManagement";
import { DataExportImport } from "@/components/data/DataExportImport";
import { PushNotificationSettings } from "@/components/notifications/PushNotificationSettings";
import { CacheManager } from "@/components/debug/CacheManager";
import { BackupManager } from "@/components/backup/BackupManager";
import { MobileHeaderMenuButton } from "@/components/layout/MobileHeaderMenuButton";
import { useProfile } from "@/hooks/useProfile";

export default function Settings() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  
  const isAdmin = profile?.role === "admin";
  const isManager = profile?.role === "manager";

  return (
    <div className="h-full space-y-6 mobile-content">
      <div className="flex items-center justify-between gap-2 max-md:border-b max-md:border-border max-md:pb-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-[1.625rem] md:text-2xl font-bold truncate">Settings</h1>
          <p className="text-muted-foreground max-md:hidden">Manage your system preferences and configuration</p>
        </div>
        <MobileHeaderMenuButton />
      </div>

      <Tabs defaultValue={isAdmin ? "overview" : "appearance"} className="space-y-6">
        <div className="overflow-x-auto mobile-tabs-scroll mobile-tabs-container">
          <TabsList className="flex w-full min-w-max justify-start space-x-1 px-1 py-2">
            {isAdmin && <TabsTrigger value="overview" className="flex-shrink-0">Overview</TabsTrigger>}
            <TabsTrigger value="appearance" className="flex-shrink-0">Appearance</TabsTrigger>
            {isAdmin && <TabsTrigger value="branding" className="flex-shrink-0">Branding</TabsTrigger>}
            <TabsTrigger value="notifications" className="flex-shrink-0">Notifications</TabsTrigger>
            <TabsTrigger value="data" className="flex-shrink-0">Data</TabsTrigger>
            {isAdmin && <TabsTrigger value="targets" className="flex-shrink-0">Targets</TabsTrigger>}
            <TabsTrigger value="backups" className="flex-shrink-0">Backups</TabsTrigger>
            {isAdmin && <TabsTrigger value="dataManagement" className="flex-shrink-0">Data Management</TabsTrigger>}
            {isAdmin && <TabsTrigger value="conversionRules" className="flex-shrink-0">Conversion Rules</TabsTrigger>}
            <TabsTrigger value="debug" className="flex-shrink-0">Debug</TabsTrigger>

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
          <TabsContent value="targets" className="space-y-6">
            <VisitTargetSettings />
          </TabsContent>
        )}

        <TabsContent value="backups" className="space-y-6">
          <BackupManager />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="dataManagement" className="space-y-6">
            <DataManagement />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="conversionRules" className="space-y-6">
            <ConversionRulesManager />
          </TabsContent>
        )}

        <TabsContent value="debug" className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Debug Tools</h2>
            <p className="text-muted-foreground">Tools for troubleshooting and cache management</p>
          </div>
          <CacheManager />
        </TabsContent>

        {(isAdmin || isManager) && (
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
