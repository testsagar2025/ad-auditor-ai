import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CoachingInstitute } from "@/types/database";

export function useInstitutes() {
  return useQuery({
    queryKey: ["institutes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coaching_institutes")
        .select("*")
        .order("deception_score", { ascending: false });

      if (error) throw error;
      return data as CoachingInstitute[];
    },
  });
}

export function useInstitute(id: string) {
  return useQuery({
    queryKey: ["institute", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coaching_institutes")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as CoachingInstitute;
    },
    enabled: !!id,
  });
}
