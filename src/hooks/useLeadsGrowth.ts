import { useQuery } from '@tanstack/react-query';
import { supabase, withRetry } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';
import { useRoleAccess } from './useRoleAccess';

export interface LeadsGrowthData {
  date: string;
  cumulative: number;
  daily: number;
}

interface UseLeadsGrowthParams {
  selectedSalesperson?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  timeGranularity: 'day' | 'week' | 'month' | 'year';
}

export const useLeadsGrowth = ({ 
  selectedSalesperson, 
  dateRange, 
  timeGranularity 
}: UseLeadsGrowthParams) => {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { userRole, isAdmin, isManager, isSalesperson } = useRoleAccess();

  return useQuery({
    queryKey: ['leads-growth', selectedSalesperson, dateRange, timeGranularity, user?.id, userRole],
    queryFn: async (): Promise<LeadsGrowthData[]> => {
      if (!user?.id) return [];

      try {
        // Build the query
        let query = supabase
          .from('leads')
          .select('created_at, salesperson')
          .order('created_at', { ascending: true });

        // Apply role-based filtering
        if (isSalesperson) {
          // Salespeople can only see their own leads
          query = query.eq('salesperson', profile?.name || user?.email || 'Unknown');
        } else if (isManager) {
          // Managers can see leads from their team (if selectedSalesperson is specified)
          if (selectedSalesperson && selectedSalesperson !== 'all') {
            query = query.eq('salesperson', selectedSalesperson);
          }
          // If no specific salesperson selected, managers see all leads (their team)
        } else if (isAdmin) {
          // Admins can see all leads or filter by specific salesperson
          if (selectedSalesperson && selectedSalesperson !== 'all') {
            query = query.eq('salesperson', selectedSalesperson);
          }
        } else {
          // Other roles (analyst, viewer) - apply same logic as managers
          if (selectedSalesperson && selectedSalesperson !== 'all') {
            query = query.eq('salesperson', selectedSalesperson);
          }
        }

        // Apply date range filter
        if (dateRange?.from && dateRange?.to) {
          // If both dates are the same (single day selection)
          if (dateRange.from.toDateString() === dateRange.to.toDateString()) {
            const startOfDay = new Date(dateRange.from);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(dateRange.from);
            endOfDay.setHours(23, 59, 59, 999);
            query = query.gte('created_at', startOfDay.toISOString())
                      .lte('created_at', endOfDay.toISOString());
          } else {
            // Date range selection
            query = query.gte('created_at', dateRange.from.toISOString())
                      .lte('created_at', dateRange.to.toISOString());
          }
        }

        const { data: leads, error } = await withRetry(async () => {
          return await query;
        });

        if (error) {
          console.error('Error fetching leads for growth chart:', error);
          return [];
        }

        if (!leads || leads.length === 0) {
          return [];
        }

        // Process data based on time granularity
        return processLeadsData(leads, timeGranularity);
      } catch (error) {
        console.error('Error in useLeadsGrowth:', error);
        return [];
      }
    },
    enabled: !!user?.id,
  });
};

function processLeadsData(leads: any[], granularity: 'day' | 'week' | 'month' | 'year'): LeadsGrowthData[] {
  // Group leads by time period
  const groupedData = new Map<string, number>();

  leads.forEach(lead => {
    const date = new Date(lead.created_at);
    let key: string;

    switch (granularity) {
      case 'day': {
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD
        break;
      }
      case 'week': {
        const weekStart = getWeekStart(date);
        key = weekStart.toISOString().split('T')[0];
        break;
      }
      case 'month': {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
        break;
      }
      case 'year': {
        key = date.getFullYear().toString();
        break;
      }
      default: {
        key = date.toISOString().split('T')[0];
      }
    }

    groupedData.set(key, (groupedData.get(key) || 0) + 1);
  });

  // Convert to array and sort by date
  const sortedKeys = Array.from(groupedData.keys()).sort();
  
  // Calculate cumulative values
  let cumulative = 0;
  const result: LeadsGrowthData[] = [];

  sortedKeys.forEach(key => {
    const daily = groupedData.get(key) || 0;
    cumulative += daily;

    // Format the date for display
    let displayDate: string;
    switch (granularity) {
      case 'day': {
        displayDate = key; // Keep as YYYY-MM-DD
        break;
      }
      case 'week': {
        displayDate = key; // Keep as YYYY-MM-DD (start of week)
        break;
      }
      case 'month': {
        displayDate = key; // Keep as YYYY-MM
        break;
      }
      case 'year': {
        displayDate = key; // Keep as YYYY
        break;
      }
      default: {
        displayDate = key;
      }
    }

    result.push({
      date: displayDate,
      cumulative,
      daily
    });
  });

  return result;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
} 