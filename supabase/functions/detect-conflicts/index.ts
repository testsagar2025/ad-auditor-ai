import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topper_name, rank_claimed, exam_year } = await req.json();
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find matching claims
    const { data: claims, error } = await supabase
      .from("topper_claims")
      .select("id, institute_id, topper_name, rank_claimed, exam_year")
      .ilike("topper_name", `%${topper_name}%`)
      .eq("rank_claimed", rank_claimed)
      .eq("exam_year", exam_year);

    if (error) throw error;

    // Check for conflicts (same topper claimed by multiple institutes)
    const instituteIds = [...new Set(claims?.map(c => c.institute_id).filter(Boolean))];
    
    if (instituteIds.length > 1) {
      // Create conflict record
      const { error: conflictError } = await supabase
        .from("conflicts")
        .insert({
          topper_name,
          rank_claimed,
          exam_year,
          claim_ids: claims?.map(c => c.id) || [],
          institute_ids: instituteIds,
          severity: instituteIds.length > 3 ? "critical" : instituteIds.length > 2 ? "high" : "medium",
        });

      if (conflictError) console.error("Conflict insert error:", conflictError);

      // Update claims to mark as conflicted
      await supabase
        .from("topper_claims")
        .update({ has_conflict: true })
        .in("id", claims?.map(c => c.id) || []);

      // Update institute deception scores
      for (const instituteId of instituteIds) {
        const { data: institute } = await supabase
          .from("coaching_institutes")
          .select("conflicted_claims, total_claims")
          .eq("id", instituteId)
          .single();

        if (institute) {
          const newConflicted = (institute.conflicted_claims || 0) + 1;
          const total = institute.total_claims || 1;
          const deceptionScore = Math.min(100, Math.round((newConflicted / total) * 100));

          await supabase
            .from("coaching_institutes")
            .update({ 
              conflicted_claims: newConflicted,
              deception_score: deceptionScore 
            })
            .eq("id", instituteId);
        }
      }
    }

    return new Response(JSON.stringify({ 
      conflicts_found: instituteIds.length > 1,
      institute_count: instituteIds.length 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
