import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLeads } from "@/hooks/useLeads";
import { useVisits } from "@/hooks/useVisits";
import { useUsers } from "@/hooks/useUsers";
import { useTargetAchievements } from "@/hooks/useTargets";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { SalespersonsSection } from "@/components/dashboard/SalespersonsSection";
import { TeamPerformanceCard } from "@/components/dashboard/TeamPerformanceCard";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Building, 
  Target, 
  BarChart3,
  Award,
  Calendar
} from "lucide-react";

export default function PerformanceEnhanced() {
  // Set default date range to current week (Monday to Friday)
  const today = new Date();
  const startOfWeek = new Date(today);
  const dayOfWeek = today.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startOfWeek.setDate(today.getDate() + daysToMonday);
  
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>(undefined);
  
  const { data: leads = [] } = useLeads();
  const { data: visits = [] } = useVisits();
  const { data: users = [] } = useUsers();
  const { userRole, isSalesperson, isManager, isAdmin } = useRoleAccess();
  const { user: currentUser } = useAuth();

  // Calculate working days in date range
  const calculateWorkingDays = (from: Date, to: Date) => {
    let count = 0;
    const current = new Date(from);
    while (current <= to) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  // Filter data by date range
  const filteredLeads = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return leads;
    return leads.filter(lead => {
      const leadDate = new Date(lead.created_at || '');
      return leadDate >= dateRange.from && leadDate <= dateRange.to;
    });
  }, [leads, dateRange]);

  const filteredVisits = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return visits;
    return visits.filter(visit => {
      const visitDate = new Date(visit.date || '');
      return visitDate >= dateRange.from && visitDate <= dateRange.to;
    });
  }, [visits, dateRange]);

  // Calculate team statistics using the same logic as the original Performance page
  const teamStats = useMemo(() => {
    if (!users.length || !visits.length) return [];
    
    const managers = users.filter(user => (user as any).role === 'manager');
    const isAllTime = !dateRange?.from || !dateRange?.to;
    const workingDays = dateRange?.from && dateRange?.to ? calculateWorkingDays(dateRange.from, dateRange.to) : 5;
    
    return managers.map(manager => {
      const teamMembers = users.filter(user => 
        (user as any).role === 'salesperson' && 
        (user as any).manager_id === manager.id
      );

      // Use the same visit calculation logic as SalespersonsSection
      const startDate = dateRange?.from || new Date();
      const endDate = dateRange?.to || new Date();
      
      // Manager's visits using the same logic as Dashboard "All Time"
      const allManagerVisits = visits.flatMap(visitGroup => 
        visitGroup.allVisits.filter(visit => {
          // Manager matching logic (same as SalespersonsSection)
          const userMatch = visit.salesperson === manager.name || 
                           visit.salesperson === manager.email ||
                           visit.manager_id === manager.id ||
                           visitGroup.lead?.salesperson === manager.name ||
                           visitGroup.lead?.salesperson === manager.email ||
                           visitGroup.lead?.manager_id === manager.id;
          
          // For All Time, return all matching visits. For filtered periods, apply date filter
          if (isAllTime) {
            return userMatch;
          } else {
            const visitDate = new Date(visit.date);
            const visitDateOnly = new Date(visitDate.getFullYear(), visitDate.getMonth(), visitDate.getDate());
            const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
            const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
            
            return userMatch && 
                   visitDateOnly >= startDateOnly && 
                   visitDateOnly <= endDateOnly;
          }
        })
      );

      // Team visits (manager + team members) using Dashboard "All Time" logic
      const allTeamVisits = visits.flatMap(visitGroup => 
        visitGroup.allVisits.filter(visit => {
          // Team matching logic
          const teamMemberNames = [manager.name, ...teamMembers.map(m => m.name)];
          const teamMemberEmails = [manager.email, ...teamMembers.map(m => m.email)];
          const teamMemberIds = [manager.id, ...teamMembers.map(m => m.id)];
          
          const userMatch = teamMemberNames.includes(visit.salesperson) ||
                           teamMemberEmails.includes(visit.salesperson) ||
                           teamMemberIds.includes(visit.manager_id) ||
                           teamMemberNames.includes(visitGroup.lead?.salesperson || '') ||
                           teamMemberEmails.includes(visitGroup.lead?.salesperson || '') ||
                           teamMemberIds.includes(visitGroup.lead?.manager_id || '');
          
          // For All Time, return all matching visits. For filtered periods, apply date filter
          if (isAllTime) {
            return userMatch;
          } else {
            const visitDate = new Date(visit.date);
            const visitDateOnly = new Date(visitDate.getFullYear(), visitDate.getMonth(), visitDate.getDate());
            const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
            const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
            
            return userMatch && 
                   visitDateOnly >= startDateOnly && 
                   visitDateOnly <= endDateOnly;
          }
        })
      );

      // Categorize visits using the same logic as SalespersonsSection
      const managerTotalVisits = allManagerVisits.length;
      const managerInitialDiscovery = allManagerVisits.filter(v => v.notes?.includes('Initial Discovery')).length;
      const managerCompletedFollowups = allManagerVisits.filter(v => v.notes?.includes('Follow-up completed')).length;
      const managerOtherVisits = managerTotalVisits - managerInitialDiscovery - managerCompletedFollowups;

      const teamTotalVisits = allTeamVisits.length;
      const teamInitialDiscovery = allTeamVisits.filter(v => v.notes?.includes('Initial Discovery')).length;
      const teamCompletedFollowups = allTeamVisits.filter(v => v.notes?.includes('Follow-up completed')).length;
      const teamOtherVisits = teamTotalVisits - teamInitialDiscovery - teamCompletedFollowups;

      // Calculate targets and achievements with proper working days calculation
      const managerTarget = (manager as any).daily_visit_target || 15;
      
      // Calculate working days based on selected date range
      let actualWorkingDays = workingDays;
      if (isAllTime) {
        // For All Time, calculate working days from first lead entry to today
        const firstLeadDate = leads.reduce((earliest, lead) => {
          const leadDate = new Date(lead.created_at);
          return !earliest || leadDate < earliest ? leadDate : earliest;
        }, null as Date | null);
        
        if (firstLeadDate) {
          actualWorkingDays = calculateWorkingDays(firstLeadDate, new Date());
        } else {
          actualWorkingDays = 5; // Fallback
        }
      }
      
      const managerExpectedVisits = managerTarget * actualWorkingDays;
      const managerTargetAchievement = managerExpectedVisits > 0 ? (managerTotalVisits / managerExpectedVisits) * 100 : 0;

      const teamTarget = teamMembers.reduce((sum, member) => {
        return sum + ((member as any).daily_visit_target || 15);
      }, managerTarget);
      const teamExpectedVisits = teamTarget * actualWorkingDays;
      const teamTargetAchievement = teamExpectedVisits > 0 ? (teamTotalVisits / teamExpectedVisits) * 100 : 0;

      return {
        manager,
        teamMembers: teamMembers.map(member => {
          // Calculate member visits using Dashboard "All Time" logic
          const allMemberVisits = visits.flatMap(visitGroup => 
            visitGroup.allVisits.filter(visit => {
              const userMatch = visit.salesperson === member.name || 
                               visit.salesperson === member.email ||
                               visitGroup.lead?.salesperson === member.name ||
                               visitGroup.lead?.salesperson === member.email;
              
              // For All Time, return all matching visits. For filtered periods, apply date filter
              if (isAllTime) {
                return userMatch;
              } else {
                const visitDate = new Date(visit.date);
                const visitDateOnly = new Date(visitDate.getFullYear(), visitDate.getMonth(), visitDate.getDate());
                const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
                
                return userMatch && 
                       visitDateOnly >= startDateOnly && 
                       visitDateOnly <= endDateOnly;
              }
            })
          );
          
          const memberVisits = allMemberVisits.length;
          const memberTarget = (member as any).daily_visit_target || 15;
          const memberExpectedVisits = memberTarget * actualWorkingDays;
          const memberAchievement = memberExpectedVisits > 0 ? (memberVisits / memberExpectedVisits) * 100 : 0;
          
          return {
            ...member,
            memberVisits,
            memberTarget,
            memberAchievement,
            memberExpectedVisits: memberExpectedVisits
          };
        }),
        managerStats: {
          totalVisits: managerTotalVisits,
          totalLeads: managerInitialDiscovery + managerCompletedFollowups + managerOtherVisits,
          completedFollowups: managerCompletedFollowups,
          scheduledFollowups: filteredLeads.filter(l => 
            l.salesperson === manager.name && l.next_visit && new Date(l.next_visit) > new Date()
          ).length,
          targetAchievement: managerTargetAchievement,
          teamSize: teamMembers.length
        },
        teamStats: {
          totalVisits: teamTotalVisits,
          totalLeads: teamInitialDiscovery + teamCompletedFollowups + teamOtherVisits,
          totalUniqueLeads: teamInitialDiscovery,
          totalRevisits: teamOtherVisits,
          completedFollowups: teamCompletedFollowups,
          scheduledFollowups: filteredLeads.filter(l => 
            [manager.name, ...teamMembers.map(m => m.name)].includes(l.salesperson) && 
            l.next_visit && new Date(l.next_visit) > new Date()
          ).length,
          targetAchievement: teamTargetAchievement,
          teamSize: teamMembers.length,
          managerTargetAchievement: managerTargetAchievement,
          managerExpectedVisits: managerExpectedVisits,
          teamExpectedVisits: teamExpectedVisits
        }
      };
    });
  }, [users, visits, filteredLeads, dateRange]);

  // Determine page title based on user role
  const pageTitle = isSalesperson ? "My Performance" : "Performance Dashboard";
  const pageDescription = isSalesperson 
    ? "Your sales performance metrics and achievements" 
    : "Comprehensive performance analytics and team management";

  const currentUserId = currentUser?.id;

  // Debug logging
  console.log('PerformanceEnhanced - Users:', users.length);
  console.log('PerformanceEnhanced - Leads:', filteredLeads.length);
  console.log('PerformanceEnhanced - Visits:', filteredVisits.length);
  console.log('PerformanceEnhanced - Team Stats:', teamStats);
  
  // Debug user roles
  console.log('User roles:', users.map(u => ({ name: u.name, role: (u as any).role, id: u.id })));
  
  // Debug sample data
  if (filteredVisits.length > 0) {
    console.log('Sample visit data:', {
      salesperson: filteredVisits[0].salesperson,
      date: filteredVisits[0].date,
      status: filteredVisits[0].status,
      notes: filteredVisits[0].notes
    });
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-card p-6 rounded-xl border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {pageTitle}
                </h1>
                <p className="text-lg text-muted-foreground">{pageDescription}</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={!dateRange ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRange(undefined)}
            >
              All Time
            </Button>
            <Button
              variant={(() => {
                if (!dateRange) return "outline";
                const today = new Date();
                const startOfWeek = new Date(today);
                const dayOfWeek = today.getDay();
                const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                startOfWeek.setDate(today.getDate() + daysToMonday);
                
                // Compare dates by setting time to 0 for accurate comparison
                const rangeFrom = new Date(dateRange.from);
                const rangeTo = new Date(dateRange.to);
                const expectedFrom = new Date(startOfWeek);
                const expectedTo = new Date(today);
                
                rangeFrom.setHours(0, 0, 0, 0);
                rangeTo.setHours(0, 0, 0, 0);
                expectedFrom.setHours(0, 0, 0, 0);
                expectedTo.setHours(0, 0, 0, 0);
                
                const isThisWeek = rangeFrom.getTime() === expectedFrom.getTime() && 
                                 rangeTo.getTime() === expectedTo.getTime();
                return isThisWeek ? "default" : "outline";
              })()}
              size="sm"
              onClick={() => {
                const today = new Date();
                const startOfWeek = new Date(today);
                const dayOfWeek = today.getDay();
                const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                startOfWeek.setDate(today.getDate() + daysToMonday);
                setDateRange({ from: startOfWeek, to: today });
              }}
            >
              This Week
            </Button>
            <Button
              variant={(() => {
                if (!dateRange) return "outline";
                const today = new Date();
                const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
                
                // Compare dates accurately
                const rangeFrom = new Date(dateRange.from);
                const rangeTo = new Date(dateRange.to);
                
                const isToday = rangeFrom.getTime() === todayStart.getTime() && 
                              rangeTo.getTime() === todayEnd.getTime();
                return isToday ? "default" : "outline";
              })()}
              size="sm"
              onClick={() => {
                const today = new Date();
                const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
                setDateRange({ from: todayStart, to: todayEnd });
              }}
            >
              Today
            </Button>
            <Button
              variant={(() => {
                if (!dateRange) return "outline";
                const today = new Date();
                const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                
                // Compare dates accurately
                const rangeFrom = new Date(dateRange.from);
                const rangeTo = new Date(dateRange.to);
                const expectedFrom = new Date(lastWeek);
                const expectedTo = new Date(today);
                
                rangeFrom.setHours(0, 0, 0, 0);
                rangeTo.setHours(0, 0, 0, 0);
                expectedFrom.setHours(0, 0, 0, 0);
                expectedTo.setHours(0, 0, 0, 0);
                
                const isLast7Days = rangeFrom.getTime() === expectedFrom.getTime() && 
                                  rangeTo.getTime() === expectedTo.getTime();
                return isLast7Days ? "default" : "outline";
              })()}
              size="sm"
              onClick={() => {
                const today = new Date();
                const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                setDateRange({ from: lastWeek, to: today });
              }}
            >
              Last 7 Days
            </Button>
            <Button
              variant={(() => {
                if (!dateRange) return "outline";
                const today = new Date();
                const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                
                // Compare dates accurately
                const rangeFrom = new Date(dateRange.from);
                const rangeTo = new Date(dateRange.to);
                const expectedFrom = new Date(lastMonth);
                const expectedTo = new Date(today);
                
                rangeFrom.setHours(0, 0, 0, 0);
                rangeTo.setHours(0, 0, 0, 0);
                expectedFrom.setHours(0, 0, 0, 0);
                expectedTo.setHours(0, 0, 0, 0);
                
                const isLast30Days = rangeFrom.getTime() === expectedFrom.getTime() && 
                                   rangeTo.getTime() === expectedTo.getTime();
                return isLast30Days ? "default" : "outline";
              })()}
              size="sm"
              onClick={() => {
                const today = new Date();
                const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                setDateRange({ from: lastMonth, to: today });
              }}
            >
              Last 30 Days
            </Button>
          </div>
        </div>
      </div>

      {/* Performance Overview - Consistent UI for All Roles */}
      <Card className="border">
        <CardHeader className="bg-muted/50">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Award className="h-6 w-6 text-primary" />
            </div>
            {isAdmin ? "Team Performance Overview" : isManager ? "My Team Performance" : "My Performance"}
          </CardTitle>
          <CardDescription className="text-base">
            {isAdmin 
              ? "Comprehensive view of all teams and their performance metrics"
              : isManager 
                ? "Performance metrics for your team"
                : "Your individual performance metrics and achievements"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Filter team stats based on user role */}
            {(() => {
              let filteredTeamStats = teamStats;
              
              if (isManager) {
                // Manager sees only their own team
                const currentManager = users.find(user => user.id === currentUser?.id);
                filteredTeamStats = teamStats.filter(team => team.manager.id === currentManager?.id);
              } else if (isSalesperson) {
                // Salesperson sees only their team (if they have a manager)
                const currentUserData = users.find(user => user.id === currentUser?.id);
                const managerId = (currentUserData as any)?.manager_id;
                if (managerId) {
                  filteredTeamStats = teamStats.filter(team => team.manager.id === managerId);
                } else {
                  // If no manager, show empty state
                  filteredTeamStats = [];
                }
              }
              
              // If no team data to show, display empty state
              if (filteredTeamStats.length === 0) {
                return (
                  <div className="col-span-full text-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-muted rounded-full">
                        <Users className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {isAdmin ? "No Teams Found" : isManager ? "No Team Data Available" : "No Team Assignment"}
                        </h3>
                        <p className="text-muted-foreground max-w-md">
                          {isAdmin 
                            ? "There are no teams with managers set up yet. Team performance data will appear here once managers are assigned."
                            : isManager 
                              ? "Your team performance data will appear here once team members are assigned and start recording visits."
                              : "You are not currently assigned to a team. Performance data will appear here once you're assigned to a team."
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
              
              return filteredTeamStats.map((team) => (
                <TeamPerformanceCard
                  key={team.manager.id}
                  manager={team.manager}
                  teamMembers={team.teamMembers}
                  teamStats={team.teamStats}
                  dateRange={dateRange}
                />
              ));
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
