import { Link } from "react-router-dom";
import { Building2, AlertTriangle, CheckCircle, FileWarning } from "lucide-react";
import { DeceptionScore } from "@/components/ui/deception-score";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CoachingInstitute } from "@/types/database";

interface InstituteCardProps {
  institute: CoachingInstitute;
}

export function InstituteCard({ institute }: InstituteCardProps) {
  const hasConflicts = institute.conflicted_claims > 0;

  return (
    <Link
      to={`/store/${institute.id}`}
      className={cn(
        "audit-card group cursor-pointer",
        hasConflicts && "border-destructive/30"
      )}
    >
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
          {institute.logo_url ? (
            <img
              src={institute.logo_url}
              alt={institute.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <Building2 className="h-8 w-8 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
            {institute.name}
          </h3>
          {institute.location && (
            <p className="text-sm text-muted-foreground truncate">
              {institute.location}
            </p>
          )}

          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <FileWarning className="h-3 w-3" />
              <span>{institute.total_claims} claims</span>
            </div>
            {institute.conflicted_claims > 0 && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {institute.conflicted_claims} conflicts
              </Badge>
            )}
            {institute.verified_claims > 0 && (
              <Badge variant="outline" className="text-xs text-success border-success/30">
                <CheckCircle className="h-3 w-3 mr-1" />
                {institute.verified_claims} verified
              </Badge>
            )}
          </div>
        </div>

        <DeceptionScore score={institute.deception_score} size="md" showLabel={false} />
      </div>
    </Link>
  );
}
