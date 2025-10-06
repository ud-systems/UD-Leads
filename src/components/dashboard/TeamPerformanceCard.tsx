import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Target, 
  Calendar, 
  UserCheck,
  Building,
  Clock,
  CheckCircle,
  RefreshCw
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TeamPerformanceCardProps {
  manager: any;
  teamMembers: any[];
  teamStats: {
    totalVisits: number;
    totalLeads: number;
    totalUniqueLeads?: number;
    totalRevisits?: number;
    completedFollowups: number;
    scheduledFollowups: number;
    targetAchievement: number;
    teamSize: number;
    managerTargetAchievement: number;
    managerExpectedVisits?: number;
    teamExpectedVisits?: number;
  };
  dateRange: { from: Date; to: Date };
}

export function TeamPerformanceCard({ 
  manager, 
  teamMembers, 
  teamStats, 
  dateRange 
}: TeamPerformanceCardProps) {
  const navigate = useNavigate();
  
  // Debug logging
  console.log('TeamPerformanceCard - Manager:', manager.name);
  console.log('TeamPerformanceCard - Team Members:', teamMembers);
  console.log('TeamPerformanceCard - Team Stats:', teamStats);
  
  const formatDateRange = () => {
    const from = dateRange.from.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short' 
    });
    const to = dateRange.to.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short' 
    });
    return `${from} - ${to}`;
  };

  const getTargetColor = (achievement: number) => {
    if (achievement >= 100) return "text-green-600 bg-green-50 dark:bg-green-900/20";
    if (achievement >= 80) return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20";
    return "text-red-600 bg-red-50 dark:bg-red-900/20";
  };

  return (
    <Card className="border-l-4 border-l-primary bg-gradient-to-br from-primary/5 via-primary/3 to-transparent">
      <CardHeader className="pb-4 bg-primary text-primary-foreground">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-foreground/10 rounded-lg">
              <UserCheck className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold text-primary-foreground">{manager.name}</CardTitle>
              <p className="text-sm text-primary-foreground/80">Team Manager</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20">
            {teamStats.teamSize} Members
          </Badge>
        </div>
        
        {/* Team Overview Stats moved into header */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
          <div className="text-center p-3 bg-primary-foreground/10 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="text-2xl font-bold text-primary-foreground">{teamStats.totalUniqueLeads || 0}</div>
            <div className="text-xs text-primary-foreground/80">Total Unique Leads</div>
          </div>
          <div className="text-center p-3 bg-primary-foreground/10 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <RefreshCw className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="text-2xl font-bold text-primary-foreground">{teamStats.totalRevisits || 0}</div>
            <div className="text-xs text-primary-foreground/80">Total Revisits</div>
          </div>
          <div className="text-center p-3 bg-primary-foreground/10 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="text-2xl font-bold text-primary-foreground">{teamStats.completedFollowups}</div>
            <div className="text-xs text-primary-foreground/80">Completed Followups</div>
          </div>
          <div className="text-center p-3 bg-primary-foreground/10 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="text-2xl font-bold text-primary-foreground">{teamStats.scheduledFollowups}</div>
            <div className="text-xs text-primary-foreground/80">Scheduled Followups</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Manager Progress moved below header and named dynamically */}
        <div 
          className="p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors mt-4"
          onClick={() => navigate(`/salesperson/${manager.id}`)}
          title="Click to view manager's detailed performance"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{manager.name}</span>
            <span className="text-sm text-muted-foreground">
              {teamStats.managerExpectedVisits ? 
                `${Math.round((teamStats.managerTargetAchievement || 0) * (teamStats.managerExpectedVisits || 0) / 100)}/${teamStats.managerExpectedVisits}` :
                '0/0'
              }
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all duration-300 bg-primary"
              style={{ width: `${Math.min(teamStats.managerTargetAchievement || 0, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
            <span>{(teamStats.managerTargetAchievement || 0).toFixed(1)}%</span>
            <span>Target Achievement</span>
          </div>
        </div>

        {/* Team Members */}
        <div>
          <h4 className="font-semibold mb-3">
            Team ({teamMembers.length}) - Unique Leads + Revisits
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {teamMembers.map((member) => {
              // Use the calculated member stats
              const memberVisits = (member as any).memberVisits || 0;
              const memberTarget = (member as any).memberTarget || 15;
              const memberAchievement = (member as any).memberAchievement || 0;
              
              return (
                <div 
                  key={member.id}
                  className="p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer"
                  onClick={() => navigate(`/salesperson/${member.id}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {member.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-sm">{member.name}</div>
                      </div>
                    </div>
                           <div className="text-right">
                             <div className="text-sm font-medium">{memberVisits}/{(member as any).memberExpectedVisits || memberTarget}</div>
                             <div className="text-xs text-muted-foreground">
                               {memberAchievement.toFixed(1)}%
                             </div>
                           </div>
                  </div>
                         <div className="w-full bg-muted rounded-full h-2">
                           <div
                             className="h-2 rounded-full transition-all duration-300"
                             style={{ 
                               width: `${Math.min(memberAchievement, 100)}%`,
                               background: memberAchievement >= 100 ? 
                                 'linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)' :
                                 memberAchievement >= 80 ? 
                                 'linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)' :
                                 'linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)'
                             }}
                           />
                         </div>
                </div>
              );
            })}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
