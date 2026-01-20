import { cn } from "@/lib/utils";

interface DeceptionScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function DeceptionScore({ score, size = "md", showLabel = true }: DeceptionScoreProps) {
  const getScoreColor = (score: number) => {
    if (score === 0) return "text-muted-foreground bg-muted";
    if (score <= 25) return "text-success bg-success/10";
    if (score <= 50) return "text-warning bg-warning/10";
    if (score <= 75) return "text-destructive bg-destructive/10";
    return "text-destructive bg-destructive/20 glow-destructive";
  };

  const getScoreLabel = (score: number) => {
    if (score === 0) return "No Data";
    if (score <= 25) return "Low Risk";
    if (score <= 50) return "Moderate";
    if (score <= 75) return "High Risk";
    return "Critical";
  };

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-16 w-16 text-lg",
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "rounded-full flex items-center justify-center font-bold",
          sizeClasses[size],
          getScoreColor(score)
        )}
      >
        {score}
      </div>
      {showLabel && (
        <span className={cn("text-sm font-medium", getScoreColor(score).split(" ")[0])}>
          {getScoreLabel(score)}
        </span>
      )}
    </div>
  );
}
