import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function usePageView() {
  const location = useLocation();

  useEffect(() => {
    // Track page view
    supabase.functions.invoke("track-analytics", {
      body: {
        event_type: "page_view",
        page_path: location.pathname,
        event_data: { timestamp: new Date().toISOString() },
      },
    }).catch(console.error);
  }, [location.pathname]);
}

export function trackSubmission(data?: Record<string, unknown>) {
  return supabase.functions.invoke("track-analytics", {
    body: {
      event_type: "submission",
      event_data: { ...data, timestamp: new Date().toISOString() },
    },
  });
}
