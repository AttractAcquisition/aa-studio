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
        "aa-card group block text-left transition-all duration-200 hover:-translate-y-1 hover:border-primary/40",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        {badge ? <span className="aa-pill-outline shrink-0">{badge}</span> : null}
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="aa-body text-sm mb-6">{description}</p>
      <div className="flex items-center gap-2 text-primary font-semibold text-sm">
        Open
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
