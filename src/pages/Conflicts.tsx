import { Link } from "react-router-dom";
import { AlertTriangle, Calendar, Building2, FileDown, Users } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useConflicts } from "@/hooks/useConflicts";
import { cn } from "@/lib/utils";

export default function Conflicts() {
  const { data: conflicts, isLoading } = useConflicts();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-destructive text-destructive-foreground";
      case "high":
        return "bg-destructive/80 text-destructive-foreground";
      case "medium":
        return "bg-warning text-warning-foreground";
      case "low":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "border-destructive text-destructive";
      case "investigating":
        return "border-warning text-warning";
      case "dismissed":
        return "border-muted text-muted-foreground";
      default:
        return "border-primary text-primary";
    }
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Conflict Database</h1>
          <p className="text-muted-foreground">
            Detected conflicts where multiple institutes claim the same topper
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="audit-card animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-muted" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-muted rounded w-1/2" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : conflicts?.length === 0 ? (
          <div className="text-center py-16">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No conflicts detected yet</h3>
            <p className="text-muted-foreground mb-4">
              Upload newspaper advertisements to start detecting conflicts
            </p>
            <Button asChild>
              <Link to="/scanner">Upload an Ad</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {conflicts?.map((conflict) => (
              <div
                key={conflict.id}
                className={cn(
                  "audit-card",
                  conflict.severity === "critical" && "border-destructive/50 glow-destructive"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {conflict.topper_name} - {conflict.rank_claimed}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {conflict.exam_name} {conflict.exam_year}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(conflict.severity)}>
                          {conflict.severity}
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(conflict.status)}>
                          {conflict.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {conflict.institute_ids?.length || 0} institutes
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {conflict.claim_ids?.length || 0} claims
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(conflict.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/conflicts/${conflict.id}`}>View Details</Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/report/${conflict.id}`}>
                          <FileDown className="h-4 w-4 mr-1" />
                          Generate Report
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
