import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useLeadStatusOptions() {
  return useQuery({
    queryKey: ["lead-status-options"],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("leads")
        .select("status")
        .not("status", "is", null)
        .not("status", "eq", "");

      if (error) {
        throw new Error(`Error fetching lead status options: ${error.message}`);
      }

      // Extract unique status values and filter out null/empty values
      const uniqueStatuses = [...new Set(data?.map(lead => lead.status).filter(Boolean))];
      
      // Sort alphabetically
      return uniqueStatuses.sort();
    },
  });
}
