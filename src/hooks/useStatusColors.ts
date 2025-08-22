import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type StatusColor = Tables<"status_colors">;
export type StatusColorInsert = TablesInsert<"status_colors">;
export type StatusColorUpdate = TablesUpdate<"status_colors">;

export function useStatusColors() {
  return useQuery({
    queryKey: ["status-colors"],
    queryFn: async (): Promise<StatusColor[]> => {
      const { data, error } = await supabase
        .from("status_colors")
        .select("*")
        .eq("is_active", true)
        .order("status_name");

      if (error) {
        throw new Error(`Error fetching status colors: ${error.message}`);
      }

      return data || [];
    },
  });
}

export function useCreateStatusColor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (statusColor: StatusColorInsert): Promise<StatusColor> => {
      const { data, error } = await supabase
        .from("status_colors")
        .insert(statusColor)
        .select()
        .single();

      if (error) {
        throw new Error(`Error creating status color: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["status-colors"] });
    },
  });
}

export function useUpdateStatusColor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: number;
      updates: StatusColorUpdate;
    }): Promise<StatusColor> => {
      const { data, error } = await supabase
        .from("status_colors")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw new Error(`Error updating status color: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["status-colors"] });
    },
  });
}

export function useDeleteStatusColor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const { error } = await supabase
        .from("status_colors")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        throw new Error(`Error deleting status color: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["status-colors"] });
    },
  });
}

export function useStatusColorByName(statusName: string | null) {
  return useQuery({
    queryKey: ["status-color", statusName],
    queryFn: async (): Promise<StatusColor | null> => {
      if (!statusName) return null;

      const { data, error } = await supabase
        .from("status_colors")
        .select("*")
        .eq("status_name", statusName)
        .eq("is_active", true)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          return null;
        }
        throw new Error(`Error fetching status color: ${error.message}`);
      }

      return data;
    },
    enabled: !!statusName,
  });
}

// Helper function to get color for a status
export function getStatusColor(statusColors: StatusColor[], statusName: string | null) {
  if (!statusName) {
    return {
      color_code: "#6B7280",
      background_color: "#F3F4F6",
      text_color: "#374151",
    };
  }

  const statusColor = statusColors.find(
    (sc) => sc.status_name.toLowerCase() === statusName.toLowerCase()
  );

  return statusColor || {
    color_code: "#6B7280",
    background_color: "#F3F4F6",
    text_color: "#374151",
  };
}
