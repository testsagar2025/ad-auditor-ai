import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert at extracting information from Indian coaching institute newspaper advertisements. These ads often feature MULTIPLE students. Extract ALL students shown in the ad and return ONLY valid JSON in this format:
{
  "institute_name": "Name of the coaching institute",
  "students": [
    {
      "topper_name": "Full name of the student",
      "rank_claimed": "The rank claimed (e.g., AIR 5, Rank 1, 100%ile)",
      "exam_name": "Name of the exam (e.g., IIT-JEE, NEET, UPSC)",
      "exam_year": 2024,
      "fine_print": "Any disclaimers like 'Mock Interview', 'Crash Course', 'Distance Learning', etc."
    }
  ],
  "confidence": 0.9
}
Extract EVERY student visible in the advertisement. If you cannot determine a field, use null. Be especially careful to find any fine print or disclaimers that apply to each student.`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract ALL topper claims from this coaching advertisement. There may be multiple students shown:" },
              { type: "image_url", image_url: { url: image } }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI processing failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const extracted = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    return new Response(JSON.stringify({ extracted }), {
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
