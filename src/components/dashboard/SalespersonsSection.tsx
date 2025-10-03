import { useUsers } from "@/hooks/useUsers";
import { useVisits } from "@/hooks/useVisits";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useAuth } from "@/hooks/useAuth";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Target, Users, UserPlus, Shield } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface SalespersonData {
  id: string;
  name: string;
  avatar_url?: string;
  dailyVisits: number;
  visitTarget: number;
  lastVisit?: string;
}

interface SalespersonsSectionProps {
  dateRange?: { from: Date; to: Date };
  showOnlyManagers?: boolean;
  showOnlySalespeople?: boolean;
  showCurrentUserOnly?: boolean;
  showMyTeamOnly?: boolean;
  title?: string;
}

export function SalespersonsSection({ 
  dateRange, 
  showOnlyManagers = false,
  showOnlySalespeople = false,
  showCurrentUserOnly = false,
  showMyTeamOnly = false,
  title
}: SalespersonsSectionProps) {
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: visits, isLoading: visitsLoading } = useVisits();
  const { data: systemSettings } = useSystemSettings();
  const { isSalesperson, isManager, isAdmin } = useRoleAccess();
  const { user } = useAuth();

  const navigate = useNavigate();
  const { toast } = useToast();

  // Determine section title based on user role
  const sectionTitle = useMemo(() => {
    if (isSalesperson) {
      return "My Team Performance";
    } else if (isManager || isAdmin) {
      return "Sales Team Performance";
    } else {
      return "Team Performance";
    }
  }, [isSalesperson, isManager, isAdmin]);

  // Function to count working days (excluding weekends)
  const countWorkingDays = (startDate: Date, endDate: Date): number => {
    let count = 0;
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      // 0 = Sunday, 6 = Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return count;
  };

  const salespersonsData = useMemo(() => {
    if (!users || !visits || !dateRange) return [];
    
    console.log('SalespersonsSection - Users:', users);
    console.log('SalespersonsSection - Visits:', visits);
    console.log('SalespersonsSection - DateRange:', dateRange);

    const startDate = dateRange.from;
    const endDate = dateRange.to;
    const workingDays = countWorkingDays(startDate, endDate);
    const dailyTargetSetting = systemSettings?.find(s => s.setting_key === 'daily_visit_target');
    const dailyTarget = dailyTargetSetting ? parseInt(dailyTargetSetting.setting_value) : 15;

    // Filter users based on props and role
    let filteredUsers = users.filter((user: any) => user.role === 'salesperson' || user.role === 'manager');
    
    // Apply specific filtering based on props
    if (showOnlyManagers) {
      filteredUsers = filteredUsers.filter((u: any) => u.role === 'manager');
    } else if (showOnlySalespeople) {
      filteredUsers = filteredUsers.filter((u: any) => u.role === 'salesperson');
    } else if (showCurrentUserOnly) {
      // Show only the current user
      const currentUser = users.find((u: any) => u.id === user?.id);
      if (currentUser) {
        filteredUsers = filteredUsers.filter((u: any) => u.id === currentUser.id);
      }
    } else if (showMyTeamOnly) {
      // Show only team members for managers
      const currentUser = users.find((u: any) => u.id === user?.id);
      if (currentUser) {
        filteredUsers = filteredUsers.filter((u: any) => (u as any).manager_id === currentUser.id);
      }
    } else {
      // Default role-based filtering
      if (isSalesperson) {
        // Salespeople only see their own data
        const currentUser = users.find((u: any) => u.id === user?.id);
        if (currentUser) {
          filteredUsers = filteredUsers.filter((u: any) => u.id === currentUser.id);
        }
      } else if (isManager) {
        // Managers see their team members (only salespeople, not other managers)
        const currentUser = users.find((u: any) => u.id === user?.id);
        if (currentUser) {
          filteredUsers = filteredUsers.filter((u: any) => (u as any).manager_id === currentUser.id);
        }
      }
      // Admins see all salespeople and managers
    }

    return filteredUsers
      .map((user: any) => {
        // Count visits for this user within the date range using new categorization logic
        const allUserVisits = visits.flatMap(visitGroup => 
          visitGroup.allVisits.filter(visit => {
            const visitDate = new Date(visit.date);
            const visitDateOnly = new Date(visitDate.getFullYear(), visitDate.getMonth(), visitDate.getDate());
            const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
            const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
            
            let userMatch = false;
            
            if (user.role === 'manager') {
              // For managers, count both their own visits AND team visits
              userMatch = visit.salesperson === user.name || 
                         visit.salesperson === user.email ||
                         visit.manager_id === user.id ||
                         visitGroup.lead?.salesperson === user.name ||
                         visitGroup.lead?.salesperson === user.email ||
                         visitGroup.lead?.manager_id === user.id;
            } else {
              // For salespeople, count only their own visits
              userMatch = visit.salesperson === user.name || 
                         visit.salesperson === user.email ||
                         visitGroup.lead?.salesperson === user.name ||
                         visitGroup.lead?.salesperson === user.email;
            }
            
            return userMatch && 
                   visitDateOnly >= startDateOnly && 
                   visitDateOnly <= endDateOnly;
          })
        );
        
        // Categorize visits by their notes to get accurate counts (matching Dashboard logic)
        const totalVisits = allUserVisits.length;
        const initialDiscoveryVisits = allUserVisits.filter(v => v.notes?.includes('Initial Discovery')).length;
        const completedFollowupVisits = allUserVisits.filter(v => v.notes?.includes('Follow-up completed')).length;
        const otherVisits = totalVisits - initialDiscoveryVisits - completedFollowupVisits;
        
        // Calculate total period visits using new categorization system
        const periodVisits = totalVisits;

        // Get the most recent visit for this user
        const lastVisit = visits
          .filter(visitGroup => {
            let userMatch = false;
            
            if (user.role === 'manager') {
              // For managers, find visits from both their own work AND team work
              userMatch = visitGroup.lastVisit.salesperson === user.name || 
                         visitGroup.lastVisit.salesperson === user.email ||
                         visitGroup.lastVisit.manager_id === user.id ||
                         visitGroup.lead?.salesperson === user.name ||
                         visitGroup.lead?.salesperson === user.email ||
                         visitGroup.lead?.manager_id === user.id;
            } else {
              // For salespeople, find only their own visits
              userMatch = visitGroup.lastVisit.salesperson === user.name || 
                         visitGroup.lastVisit.salesperson === user.email ||
                         visitGroup.lead?.salesperson === user.name ||
                         visitGroup.lead?.salesperson === user.email;
            }
            
            return userMatch;
          })
          .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())[0];

        // Calculate target based on date range
        const isWeeklyView = workingDays > 1;
        const periodTarget = isWeeklyView ? dailyTarget * workingDays : dailyTarget;
        
        return {
          id: user.id,
          name: user.name,
          avatar_url: user.avatar_url,
          dailyVisits: periodVisits,
          visitTarget: periodTarget,
          lastVisit: lastVisit?.lastModified,
          isWeeklyView
        };
      })
      .sort((a, b) => (b.dailyVisits) - (a.dailyVisits));
  }, [users, visits, systemSettings, isSalesperson, isManager, isAdmin, dateRange, user, showOnlyManagers, showOnlySalespeople, showCurrentUserOnly, showMyTeamOnly]);

  if (usersLoading || visitsLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-card animate-pulse">
            <div className="w-10 h-10 bg-muted rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-muted rounded w-20" />
              <div className="h-2 bg-muted rounded w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {salespersonsData.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">
            {(() => {
              if (showOnlyManagers) return "No managers found";
              if (showOnlySalespeople) return "No salespeople found";
              if (showCurrentUserOnly) return "No performance data found";
              if (showMyTeamOnly) return "No team members found";
              if (isSalesperson) return "No performance data found";
              return "No team members found";
            })()}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {salespersonsData.map((salesperson) => {
            const visitProgress = Math.min((salesperson.dailyVisits / salesperson.visitTarget) * 100, 100);
            const isOnTarget = salesperson.dailyVisits >= salesperson.visitTarget;
            const isCloseToTarget = salesperson.dailyVisits >= salesperson.visitTarget * 0.8;

            return (
              <div 
                key={salesperson.id} 
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group cursor-pointer"
                onClick={() => navigate(`/salesperson/${salesperson.id}`)}
                title="Click to view detailed performance"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={salesperson.avatar_url} alt={salesperson.name} />
                  <AvatarFallback className="text-sm font-medium">
                    {salesperson.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-sm truncate">
                      {salesperson.name}
                    </h4>
                    <div className="flex gap-1">
                      {/* Role Badge */}
                      {(() => {
                        const user = users?.find((u: any) => u.id === salesperson.id);
                        if (user?.role === 'manager') {
                          return (
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                              <Shield className="h-3 w-3 mr-1" />
                              Manager
                            </Badge>
                          );
                        }
                        return null;
                      })()}
                      <Badge 
                        variant={isOnTarget ? "default" : isCloseToTarget ? "secondary" : "outline"}
                        className="text-xs px-1.5 py-0.5"
                      >
                        {salesperson.dailyVisits}/{salesperson.visitTarget} visits
                        {salesperson.isWeeklyView && " (weekly)"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Visit Progress</span>
                      <span>{Math.round((salesperson.dailyVisits / salesperson.visitTarget) * 100)}%</span>
                    </div>
                    <Progress 
                      value={(salesperson.dailyVisits / salesperson.visitTarget) * 100} 
                      className="h-2"
                      style={{
                        '--progress-background': 'linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)'
                      } as React.CSSProperties}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {salespersonsData.length > 0 && (
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              <span>
                {(() => {
                  if (!dateRange) return "Target: 15 visits (daily)";
                  const baseTarget = systemSettings?.find(s => s.setting_key === 'default_daily_visit_target')?.setting_value || '15';
                  const workingDays = countWorkingDays(dateRange.from, dateRange.to);
                  const fromDate = dateRange.from.toLocaleDateString();
                  const toDate = dateRange.to.toLocaleDateString();
                  return `Target: ${baseTarget} visits (daily, ${workingDays} working days, ${fromDate} - ${toDate})`;
                })()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 