import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TopperClaim } from "@/types/database";

export function useClaims(instituteId?: string) {
  return useQuery({
    queryKey: ["claims", instituteId],
    queryFn: async () => {
      let query = supabase
        .from("topper_claims")
        .select("*")
        .order("created_at", { ascending: false });

      if (instituteId) {
        query = query.eq("institute_id", instituteId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TopperClaim[];
    },
  });
}

export function useCreateClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (claim: Omit<TopperClaim, "id" | "created_at" | "is_verified" | "has_conflict">) => {
      const { data, error } = await supabase
        .from("topper_claims")
        .insert(claim)
        .select()
        .single();

      if (error) throw error;
      return data as TopperClaim;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
      queryClient.invalidateQueries({ queryKey: ["institutes"] });
    },
  });
}
