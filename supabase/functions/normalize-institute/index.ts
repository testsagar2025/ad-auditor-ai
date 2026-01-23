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
    const { institute_name } = await req.json();
    
    if (!institute_name) {
      return new Response(JSON.stringify({ error: "institute_name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all existing institutes
    const { data: existingInstitutes, error: fetchError } = await supabase
      .from("coaching_institutes")
      .select("id, name");

    if (fetchError) throw fetchError;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use AI to match or normalize the institute name
    const instituteList = existingInstitutes?.map((i) => i.name).join("\n") || "None";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert at normalizing coaching institute names. Given an input name and a list of existing institutes, determine if the input matches any existing institute (considering variations, abbreviations, branches, etc.).

Common variations to consider:
- "ALLEN Career Institute" = "ALLEN" = "Allen Institute"
- "Resonance" = "Resonance Eduventures" = "Resonance Kota"
- "Aakash Institute" = "Aakash" = "Aakash Byju's"
- "Physics Wallah" = "PW" = "Alakh Pandey's Physics Wallah"
- "FIITJEE" = "FIIT JEE" = "FIITJEE Ltd"
- Branch names like "ALLEN Delhi", "Resonance Mumbai" should map to parent institute

Return ONLY valid JSON:
{
  "matched": true or false,
  "matched_id": "uuid if matched, null if not",
  "matched_name": "The exact matched name from list, or null",
  "normalized_name": "The proper normalized name to use (clean, standardized)",
  "confidence": 0.0 to 1.0
}`
          },
          {
            role: "user",
            content: `Input institute name: "${institute_name}"

Existing institutes in database:
${instituteList}

Determine if this matches any existing institute, or provide a clean normalized name for a new entry.`
          }
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI Gateway error:", response.status);
      // Fallback to simple matching
      const simpleMatch = existingInstitutes?.find(
        (i) => i.name.toLowerCase().trim() === institute_name.toLowerCase().trim()
      );
      
      return new Response(JSON.stringify({
        matched: !!simpleMatch,
        matched_id: simpleMatch?.id || null,
        matched_name: simpleMatch?.name || null,
        normalized_name: institute_name.trim(),
        confidence: simpleMatch ? 1.0 : 0.5
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      matched: false,
      matched_id: null,
      matched_name: null,
      normalized_name: institute_name.trim(),
      confidence: 0.5
    };

    console.log("Normalization result:", result);

    return new Response(JSON.stringify(result), {
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
