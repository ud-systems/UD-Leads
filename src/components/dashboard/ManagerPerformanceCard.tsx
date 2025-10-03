import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  UserCheck, 
  Target, 
  TrendingUp, 
  Calendar, 
  Building,
  Users,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ManagerPerformanceCardProps {
  manager: any;
  managerStats: {
    totalVisits: number;
    totalLeads: number;
    completedFollowups: number;
    scheduledFollowups: number;
    targetAchievement: number;
    teamSize: number;
  };
  dateRange: { from: Date; to: Date };
}

export function ManagerPerformanceCard({ 
  manager, 
  managerStats, 
  dateRange 
}: ManagerPerformanceCardProps) {
  const navigate = useNavigate();
  
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
    <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-purple-500">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <UserCheck className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold">{manager.name}</CardTitle>
              <p className="text-sm text-muted-foreground">Manager • {managerStats.teamSize} Team Members</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-200">
            Manager
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Manager Performance Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Building className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600">{managerStats.totalVisits}</div>
            <div className="text-xs text-muted-foreground">Personal Visits</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{managerStats.totalLeads}</div>
            <div className="text-xs text-muted-foreground">Personal Leads</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-600">{managerStats.completedFollowups}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-600">{managerStats.scheduledFollowups}</div>
            <div className="text-xs text-muted-foreground">Scheduled</div>
          </div>
        </div>

        {/* Personal Target Achievement */}
        <div className={`p-4 rounded-lg ${getTargetColor(managerStats.targetAchievement)}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span className="font-semibold">Personal Target Achievement</span>
            </div>
            <Badge variant="secondary" className="bg-white/50 dark:bg-black/20">
              {managerStats.targetAchievement.toFixed(1)}%
            </Badge>
          </div>
          <div className="w-full bg-white/30 dark:bg-black/20 rounded-full h-2 mb-2">
            <div 
              className="h-2 rounded-full bg-current transition-all duration-300"
              style={{ width: `${Math.min(managerStats.targetAchievement, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Period: {formatDateRange()}</span>
            <span className="font-medium">
              {managerStats.targetAchievement >= 100 ? "Target Met!" : 
               managerStats.targetAchievement >= 80 ? "On Track" : "Needs Attention"}
            </span>
          </div>
        </div>

        {/* Team Overview */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-800 dark:text-blue-200">Team Overview</span>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200">
              {managerStats.teamSize} Members
            </Badge>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Manages {managerStats.teamSize} sales team members. Click below to view detailed team performance.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/salesperson/${manager.id}`)}
            className="flex-1"
          >
            <UserCheck className="h-4 w-4 mr-2" />
            Personal Details
          </Button>
          <Button 
            variant="default" 
            size="sm"
            className="flex-1"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Team Performance
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
