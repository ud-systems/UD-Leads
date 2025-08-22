import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useLeads } from "@/hooks/useLeads";
import { useVisits } from "@/hooks/useVisits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SalespersonDebug() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { userRole, isSalesperson } = useRoleAccess();
  const { data: leads } = useLeads();
  const { data: visits } = useVisits();

  if (!isSalesperson) {
    return null; // Only show for salespeople
  }

  const salespersonName = profile?.name || user?.email || 'Unknown';
  const salespersonEmail = user?.email;

  const matchingLeads = leads?.filter(lead => 
    lead.salesperson === salespersonName || lead.salesperson === salespersonEmail
  ) || [];

  const matchingVisits = visits?.filter(groupedVisit => 
    groupedVisit.lastVisit.salesperson === salespersonName || 
    groupedVisit.lastVisit.salesperson === salespersonEmail
  ) || [];

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-orange-800">Salesperson Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <strong>User Info:</strong>
          <ul className="ml-4 mt-1">
            <li>ID: {user?.id}</li>
            <li>Email: {user?.email}</li>
            <li>Role: {userRole}</li>
          </ul>
        </div>
        
        <div>
          <strong>Profile Info:</strong>
          <ul className="ml-4 mt-1">
            <li>Name: {profile?.name || 'Not set'}</li>
            <li>Email: {profile?.email || 'Not set'}</li>
          </ul>
        </div>
        
        <div>
          <strong>Filtering Values:</strong>
          <ul className="ml-4 mt-1">
            <li>Salesperson Name: {salespersonName}</li>
            <li>Salesperson Email: {salespersonEmail}</li>
          </ul>
        </div>
        
        <div>
          <strong>Data Counts:</strong>
          <ul className="ml-4 mt-1">
            <li>Total Leads: {leads?.length || 0}</li>
            <li>Matching Leads: {matchingLeads.length}</li>
            <li>Total Visits: {visits?.length || 0}</li>
            <li>Matching Visits: {matchingVisits.length}</li>
          </ul>
        </div>
        
        {matchingLeads.length > 0 && (
          <div>
            <strong>Matching Leads:</strong>
            <ul className="ml-4 mt-1">
              {matchingLeads.slice(0, 3).map(lead => (
                <li key={lead.id}>
                  {lead.store_name} - Salesperson: {lead.salesperson}
                </li>
              ))}
              {matchingLeads.length > 3 && <li>... and {matchingLeads.length - 3} more</li>}
            </ul>
          </div>
        )}
        
        {matchingVisits.length > 0 && (
          <div>
            <strong>Matching Visits:</strong>
            <ul className="ml-4 mt-1">
              {matchingVisits.slice(0, 3).map(groupedVisit => (
                <li key={groupedVisit.leadId}>
                  {groupedVisit.lead.store_name} - Salesperson: {groupedVisit.lastVisit.salesperson}
                </li>
              ))}
              {matchingVisits.length > 3 && <li>... and {matchingVisits.length - 3} more</li>}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 