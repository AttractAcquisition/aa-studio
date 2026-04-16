import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConsoleCardProps = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  className?: string;
};

export function ConsoleCard({ title, description, href, icon: Icon, badge, className }: ConsoleCardProps) {
  return (
    <Link
      to={href}
      className={cn(
        "aa-card group block text-left transition-colors duration-200 hover:border-primary/25 hover:bg-card/95",
        className
      )}
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        {badge ? <span className="aa-pill-outline shrink-0">{badge}</span> : null}
      </div>
      <h3 className="mb-2 text-xl font-semibold tracking-[-0.03em] text-foreground">{title}</h3>
      <p className="aa-body mb-6 text-sm">{description}</p>
      <div className="flex items-center gap-2 text-sm font-medium text-primary">
        Open
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
