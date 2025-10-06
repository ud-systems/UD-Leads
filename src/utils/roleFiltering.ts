/**
 * Centralized role filtering utilities
 * These functions standardize how role-based access control is implemented across the application
 * while maintaining backward compatibility with existing logic patterns.
 */

export interface UserIdentifiers {
  id: string;
  name: string;
  email: string;
}

/**
 * Extract consistent user identifiers from profile and current user data
 * This ensures consistent matching across all components
 */
export const getSalespersonIdentifier = (profile: any, currentUser: any): UserIdentifiers => {
  return {
    id: currentUser?.id || '',
    name: profile?.name || currentUser?.email || 'Unknown',
    email: currentUser?.email || ''
  };
};

/**
 * Check if a lead is accessible to the current user based on their role
 * Uses the same logic patterns as your existing components but centralized
 */
export const isLeadAccessibleToUser = (
  lead: any, 
  userRole: string, 
  identifiers: UserIdentifiers
): boolean => {
  // Admins can see everything
  if (userRole === 'admin') return true;
  
  // Salesperson can see their own leads
  if (userRole === 'salesperson') {
    return lead.salesperson === identifiers.name || 
           lead.salesperson === identifiers.email;
  }
  
  // Manager can see both their historical leads AND team leads
  if (userRole === 'manager') {
    return lead.manager_id === identifiers.id || 
           lead.salesperson === identifiers.name || 
           lead.salesperson === identifiers.email;
  }
  
  // Default: no access
  return false;
};

/**
 * Check if a visit is accessible to the current user based on their role
 * Uses the same logic patterns as your existing components
 */
export const isVisitAccessibleToUser = (
  visit: any, 
  userRole: string, 
  identifiers: UserIdentifiers
): boolean => {
  // Admins can see everything
  if (userRole === 'admin') return true;
  
  // Salesperson can see their own visits
  if (userRole === 'salesperson') {
    return visit.salesperson === identifiers.name || 
           visit.salesperson === identifiers.email;
  }
  
  // Manager can see both their historical visits AND team visits
  if (userRole === 'manager') {
    return visit.manager_id === identifiers.id || 
           visit.salesperson === identifiers.name || 
           visit.salesperson === identifiers.email;
  }
  
  // Default: no access
  return false;
};

/**
 * Get Supabase query filters for role-based data fetching
 * Returns the appropriate filter strings for different data types
 */
export const getRoleBasedQueryFilters = (
  userRole: string, 
  identifiers: UserIdentifiers
): { leads: string; visits: string; users: string } => {
  const filters = {
    leads: '',
    visits: '',
    users: ''
  };

  if (userRole === 'salesperson') {
    const name = identifiers.name;
    const email = identifiers.email;
    filters.leads = `salesperson.eq.${name},salesperson.eq.${email}`;
    filters.visits = `salesperson.eq.${name},salesperson.eq.${email}`;
  } else if (userRole === 'manager') {
    const name = identifiers.name;
    const id = identifiers.id;
    filters.leads = `manager_id.eq.${id},salesperson.eq.${name}`;
    filters.visits = `manager_id.eq.${id},salesperson.eq.${name}`;
    filters.users = `manager_id.eq.${id},id.eq.${id}`;
  }
  // Admins get no filters (can see everything)

  return filters;
};

/**
 * Filter leads array based on user role and identifiers
 * Useful for client-side filtering when you already have all the data
 */
export const filterLeadsByRole = (
  leads: any[], 
  userRole: string, 
  identifiers: UserIdentifiers
): any[] => {
  if (!leads || leads.length === 0) return [];
  
  return leads.filter(lead => isLeadAccessibleToUser(lead, userRole, identifiers));
};

/**
 * Filter visits array based on user role and identifiers
 * Handles both flat visit arrays and grouped visit structures
 */
export const filterVisitsByRole = (
  visits: any[], 
  userRole: string, 
  identifiers: UserIdentifiers
): any[] => {
  if (!visits || visits.length === 0) return [];
  
  // Handle grouped visits (from useVisits hook)
  if (visits[0] && visits[0].lastVisit) {
    return visits.filter(groupedVisit => 
      isVisitAccessibleToUser(groupedVisit.lastVisit, userRole, identifiers)
    );
  }
  
  // Handle flat visit arrays
  return visits.filter(visit => isVisitAccessibleToUser(visit, userRole, identifiers));
};

/**
 * Get salesperson options for dropdowns based on user role
 * Maintains your existing logic for who can see whom in dropdowns
 */
export const getSalespersonOptions = (
  users: any[], 
  userRole: string, 
  identifiers: UserIdentifiers
): any[] => {
  if (!users || users.length === 0) return [];
  
  let roleFilter: string[] = ['salesperson'];
  
  // Admins can see both salespeople and managers
  if (userRole === 'admin') {
    roleFilter = ['salesperson', 'manager'];
  }
  
  let filteredUsers = users.filter(user => roleFilter.includes((user as any).role));
  
  // Managers can see themselves + their team members
  if (userRole === 'manager') {
    filteredUsers = users.filter(user => 
      (user as any).manager_id === identifiers.id || 
      user.id === identifiers.id
    );
  }
  
  return filteredUsers.map(user => ({
    id: user.id,
    name: (user as any).name || user.email,
    role: (user as any).role,
    daily_visit_target: user.user_preferences?.daily_visit_target || 15
  }));
};

