import { useLeads } from "@/hooks/useLeads";
import { useVisits } from "@/hooks/useVisits";
import { useUsers } from "@/hooks/useUsers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function DatabaseDebug() {
  const { data: leads } = useLeads();
  const { data: visits } = useVisits();
  const { data: users } = useUsers();

  return (
    <div className="space-y-4">
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">All Leads Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leads?.map(lead => (
              <div key={lead.id} className="flex items-center gap-2 p-2 bg-white rounded border">
                <span className="font-medium">{lead.store_name}</span>
                <Badge variant="outline">{lead.salesperson || 'No salesperson'}</Badge>
                <Badge variant="secondary">{lead.status || 'No status'}</Badge>
              </div>
            ))}
            {(!leads || leads.length === 0) && (
              <p className="text-gray-500">No leads found</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800">All Visits Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {visits?.map(groupedVisit => (
              <div key={groupedVisit.leadId} className="flex items-center gap-2 p-2 bg-white rounded border">
                <span className="font-medium">{groupedVisit.lead.store_name}</span>
                <Badge variant="outline">{groupedVisit.lastVisit.salesperson || 'No salesperson'}</Badge>
                <Badge variant="secondary">{groupedVisit.lastVisit.status || 'No status'}</Badge>
                <span className="text-sm text-gray-500">({groupedVisit.visitCount} visits)</span>
              </div>
            ))}
            {(!visits || visits.length === 0) && (
              <p className="text-gray-500">No visits found</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="text-purple-800">All Users Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {users?.map(user => (
              <div key={user.id} className="flex items-center gap-2 p-2 bg-white rounded border">
                <span className="font-medium">{(user as any).name || user.email}</span>
                <Badge variant="outline">{(user as any).role || 'No role'}</Badge>
                <Badge variant="secondary">{user.email}</Badge>
              </div>
            ))}
            {(!users || users.length === 0) && (
              <p className="text-gray-500">No users found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 