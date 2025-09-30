
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLeads } from "@/hooks/useLeads";
import { useVisits } from "@/hooks/useVisits";
import { useTerritories } from "@/hooks/useTerritories";
import { useUsers } from "@/hooks/useUsers";
import { useTargetAchievements } from "@/hooks/useTargets";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { SalespersonsSection } from "@/components/dashboard/SalespersonsSection";
import { useAuth } from "@/hooks/useAuth";
import { DatePicker } from "@/components/ui/date-picker";
import { Users, UserCheck, Building, Target } from "lucide-react";

export default function Performance() {
  // Set default date range to current week
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
  
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfWeek,
    to: today
  });
  
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const { data: territories = [], isLoading: territoriesLoading } = useTerritories();
  const { data: visits = [], isLoading: visitsLoading } = useVisits();
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const { userRole, isSalesperson, isManager, isAdmin } = useRoleAccess();
  const { user: currentUser } = useAuth();

  // Determine page title based on user role
  const pageTitle = isSalesperson ? "My Performance" : "Performance";
  const pageDescription = isSalesperson 
    ? "Your sales performance metrics and achievements" 
    : "Sales performance metrics and achievements";

  const currentUserId = currentUser?.id;

  // Get target achievements
  const { data: targetAchievements = [], isLoading: targetsLoading } = useTargetAchievements(currentUserId, 'daily');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mobile-header-stack">
        <div>
          <h1 className="text-2xl font-bold">{pageTitle}</h1>
          <p className="text-muted-foreground">{pageDescription}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mobile-filters-stack">
          <DatePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder="Select date range..."
            className="w-full sm:w-[200px] mobile-filter-full h-10"
          />
        </div>
      </div>

      {/* Role-based Performance Sections */}
      {isAdmin && (
        <>
          {/* Managers Section - Admin Only */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-blue-600" />
                Managers Performance
              </CardTitle>
              <CardDescription>
                Individual manager performance metrics and targets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SalespersonsSection 
                dateRange={dateRange} 
                showOnlyManagers={true}
                title="Managers"
              />
            </CardContent>
          </Card>

          {/* Salespersons Team Performance - Admin Only */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-green-600" />
                Salespersons Team Performance
              </CardTitle>
              <CardDescription>
                All salespeople performance organized by teams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SalespersonsSection 
                dateRange={dateRange} 
                showOnlySalespeople={true}
                title="Salespeople"
              />
            </CardContent>
          </Card>
        </>
      )}

      {isManager && (
        <>
          {/* My Performance - Manager */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                My Performance
              </CardTitle>
              <CardDescription>
                Your individual performance metrics and achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SalespersonsSection 
                dateRange={dateRange} 
                showCurrentUserOnly={true}
                title="My Performance"
              />
            </CardContent>
          </Card>

          {/* Team Performance - Manager */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-600" />
                Team Performance
              </CardTitle>
              <CardDescription>
                Performance metrics for your sales team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SalespersonsSection 
                dateRange={dateRange} 
                showMyTeamOnly={true}
                title="My Team"
              />
            </CardContent>
          </Card>
        </>
      )}

      {isSalesperson && (
        <>
          {/* My Performance - Salesperson */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-indigo-600" />
                My Performance
              </CardTitle>
              <CardDescription>
                Your individual performance metrics and achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SalespersonsSection 
                dateRange={dateRange} 
                showCurrentUserOnly={true}
                title="My Performance"
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
