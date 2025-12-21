import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

export function KPICard({ title, value, subtitle, icon: Icon, trend, trendValue }: KPICardProps) {
  return (
    <div className="aa-card group hover:border-primary/30 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-4xl font-black mt-2 text-foreground">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trendValue && (
            <div className={cn(
              "inline-flex items-center mt-3 px-2 py-1 rounded-full text-xs font-medium",
              trend === "up" && "bg-green-500/10 text-green-400",
              trend === "down" && "bg-red-500/10 text-red-400",
              trend === "neutral" && "bg-muted text-muted-foreground"
            )}>
              {trendValue}
            </div>
          )}
        </div>
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
    </div>
  );
}
