import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "destructive" | "success" | "warning";
}

export function StatCard({
  icon,
  label,
  value,
  trend,
  trendValue,
  variant = "default",
}: StatCardProps) {
  const variantClasses = {
    default: "border-border",
    destructive: "border-destructive/30 bg-destructive/5",
    success: "border-success/30 bg-success/5",
    warning: "border-warning/30 bg-warning/5",
  };

  const iconClasses = {
    default: "text-muted-foreground",
    destructive: "text-destructive",
    success: "text-success",
    warning: "text-warning",
  };

  return (
    <div className={cn("audit-card", variantClasses[variant])}>
      <div className="flex items-start justify-between">
        <div className={cn("p-2 rounded-lg bg-muted", iconClasses[variant])}>
          {icon}
        </div>
        {trend && trendValue && (
          <span
            className={cn(
              "text-xs font-medium px-2 py-1 rounded-full",
              trend === "up" && "text-destructive bg-destructive/10",
              trend === "down" && "text-success bg-success/10",
              trend === "neutral" && "text-muted-foreground bg-muted"
            )}
          >
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}
