import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CoachingInstitute, TopperClaim } from "@/types/database";

export function useInstitute(id: string | undefined) {
  return useQuery({
    queryKey: ["institute", id],
    queryFn: async () => {
      if (!id) throw new Error("Institute ID is required");
      
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

export function useInstituteClaims(instituteId: string | undefined) {
  return useQuery({
    queryKey: ["institute-claims", instituteId],
    queryFn: async () => {
      if (!instituteId) throw new Error("Institute ID is required");
      
      const { data, error } = await supabase
        .from("topper_claims")
        .select("*")
        .eq("institute_id", instituteId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TopperClaim[];
    },
    enabled: !!instituteId,
  });
}
