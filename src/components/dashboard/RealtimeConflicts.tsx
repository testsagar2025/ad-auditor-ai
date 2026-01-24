import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Zap, ArrowRight, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { maskPersonName } from "@/lib/privacy";
import type { Tables } from "@/integrations/supabase/types";

type ConflictRow = Tables<"conflicts">;

export function RealtimeConflicts() {
  const [conflicts, setConflicts] = useState<ConflictRow[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [newConflictId, setNewConflictId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch initial conflicts
    const fetchConflicts = async () => {
      const { data, error } = await supabase
        .from("conflicts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (!error && data) {
        setConflicts(data);
      }
    };

    fetchConflicts();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("conflicts-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conflicts",
        },
        (payload) => {
          console.log("Realtime conflict update:", payload);

          if (payload.eventType === "INSERT") {
            const newConflict = payload.new as ConflictRow;
            setConflicts((prev) => [newConflict, ...prev.slice(0, 4)]);
            setNewConflictId(newConflict.id);
            // Clear highlight after 3 seconds
            setTimeout(() => setNewConflictId(null), 3000);
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as ConflictRow;
            setConflicts((prev) =>
              prev.map((c) => (c.id === updated.id ? updated : c))
            );
          } else if (payload.eventType === "DELETE") {
            const deleted = payload.old as ConflictRow;
            setConflicts((prev) => prev.filter((c) => c.id !== deleted.id));
          }
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-destructive text-destructive-foreground";
      case "high":
        return "bg-destructive/80 text-white";
      case "medium":
        return "bg-warning text-warning-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Live Conflict Feed</h3>
            <p className="text-xs text-muted-foreground">Real-time updates</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex items-center gap-1.5 text-xs px-2 py-1 rounded-full",
              isConnected
                ? "bg-success/10 text-success"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Zap className={cn("h-3 w-3", isConnected && "animate-pulse")} />
            {isConnected ? "Live" : "Connecting..."}
          </div>
        </div>
      </div>

      {/* Conflicts List */}
      <div className="divide-y">
        {conflicts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No conflicts detected yet</p>
          </div>
        ) : (
          conflicts.map((conflict) => (
            <Link
              key={conflict.id}
              to={`/conflicts/${conflict.id}`}
              className={cn(
                "block p-4 hover:bg-muted/50 transition-all duration-300",
                newConflictId === conflict.id &&
                  "bg-destructive/10 animate-pulse"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium text-sm truncate">
                        {maskPersonName(conflict.topper_name)}
                      </h4>
                      <p className="text-xs text-primary font-medium">
                        {conflict.rank_claimed}
                      </p>
                    </div>
                    <Badge className={cn("text-xs", getSeverityStyles(conflict.severity))}>
                      {conflict.severity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {conflict.institute_ids?.length || 0} institutes
                    </span>
                    <span>•</span>
                    <span>
                      {conflict.exam_name} {conflict.exam_year}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t bg-muted/20">
        <Button variant="ghost" size="sm" className="w-full" asChild>
          <Link to="/conflicts">
            View All Conflicts
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
