import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Conflict } from "@/types/database";

export function useConflicts() {
  return useQuery({
    queryKey: ["conflicts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conflicts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as Conflict[];
    },
  });
}

export function useConflict(id: string) {
  return useQuery({
    queryKey: ["conflict", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conflicts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as unknown as Conflict;
    },
    enabled: !!id,
  });
}
