
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, Building, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [usersResult, retailersResult, territoriesResult, visitsResult] = await Promise.all([
        supabase.from('profiles').select('role'),
        supabase.from('leads').select('id, status'),
        supabase.from('territories').select('id'),
        supabase.from('visits').select('status, date')
      ]);

      const users = usersResult.data || [];
      const leads = retailersResult.data || [];
      const territories = territoriesResult.data || [];
      const visits = visitsResult.data || [];

      const usersByRole = users.reduce((acc: any, user: any) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {});

      const leadsByStatus = leads.reduce((acc: any, lead: any) => {
        acc[lead.status || 'unknown'] = (acc[lead.status || 'unknown'] || 0) + 1;
        return acc;
      }, {});

      const recentVisits = visits.filter(visit => {
        const visitDate = new Date(visit.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return visitDate >= weekAgo;
      }).length;

      return {
        totalUsers: users.length,
        totalLeads: leads.length,
        totalTerritories: territories.length,
        totalVisits: visits.length,
        recentVisits,
        usersByRole,
        leadsByStatus,
      };
    },
  });

  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      description: "Active system users",
      color: "text-blue-600",
    },
    {
      title: "Total Leads",
      value: stats?.totalLeads || 0,
      icon: Building,
      description: "Registered leads",
      color: "text-green-600",
    },
    {
      title: "Territories",
      value: stats?.totalTerritories || 0,
      icon: MapPin,
      description: "Sales territories",
      color: "text-purple-600",
    },
    {
      title: "Recent Visits",
      value: stats?.recentVisits || 0,
      icon: Calendar,
      description: "Last 7 days",
      color: "text-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Overview</h2>
        <p className="text-muted-foreground">System overview and key metrics</p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Users by Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats?.usersByRole || {}).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between">
                    <span className="capitalize">{role}</span>
                    <Badge variant="outline">{count as number}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Leads by Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats?.leadsByStatus || {}).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="capitalize">{status}</span>
                    <Badge variant="outline">{count as number}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
