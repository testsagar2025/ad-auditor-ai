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
    const { conflict_id, topper_name, rank_claimed, institute_names, severity } = await req.json();
    
    const adminEmail = Deno.env.get("ADMIN_EMAIL");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!adminEmail || !resendApiKey) {
      console.log("Admin email alerts not configured (missing ADMIN_EMAIL or RESEND_API_KEY)");
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Email alerts not configured" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const instituteList = institute_names?.length 
      ? institute_names.map((n: string) => `<li>${n}</li>`).join("")
      : "<li>Unknown institutes</li>";

    const severityColor = severity === "critical" ? "#DC2626" : severity === "high" ? "#EA580C" : "#CA8A04";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New Conflict Detected</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🔍 UnMask Alert</h1>
            <p style="margin: 8px 0 0; opacity: 0.9;">New Conflict Detected</p>
          </div>
          
          <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
            <div style="background: ${severityColor}15; border-left: 4px solid ${severityColor}; padding: 12px 16px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; font-weight: 600; color: ${severityColor};">Severity: ${severity?.toUpperCase() || "MEDIUM"}</p>
            </div>
            
            <h2 style="margin: 0 0 8px; font-size: 18px;">Topper Details</h2>
            <p style="margin: 0 0 4px;"><strong>Name:</strong> ${topper_name || "Unknown"}</p>
            <p style="margin: 0 0 20px;"><strong>Rank Claimed:</strong> ${rank_claimed || "Unknown"}</p>
            
            <h2 style="margin: 0 0 8px; font-size: 18px;">Involved Institutes</h2>
            <ul style="margin: 0 0 20px; padding-left: 20px;">
              ${instituteList}
            </ul>
            
            <a href="https://ad-auditor-ai.lovable.app/conflicts/${conflict_id || ""}" 
               style="display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500;">
              View Conflict Details →
            </a>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            
            <p style="margin: 0; font-size: 12px; color: #6b7280;">
              This is an automated alert from UnMask. You are receiving this because you are registered as an admin.
            </p>
          </div>
        </body>
      </html>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "UnMask Alerts <alerts@unmask.app>",
        to: [adminEmail],
        subject: `🚨 New Conflict: ${topper_name || "Unknown"} claimed by ${institute_names?.length || 0} institutes`,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Resend API error:", errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const result = await response.json();
    console.log("Alert email sent successfully:", result);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Alert sent",
      email_id: result.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending conflict alert:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
