import { cn } from "@/lib/utils";
import { FileText, Image, Video } from "lucide-react";

interface RecentOutputCardProps {
  type: "script" | "onepager" | "design";
  title: string;
  series: string;
  date: string;
  status: "draft" | "ready" | "published";
}

const typeIcons = {
  script: FileText,
  onepager: FileText,
  design: Image,
};

const typeLabels = {
  script: "Script",
  onepager: "One-Pager",
  design: "Design",
};

const statusStyles = {
  draft: "bg-muted text-muted-foreground",
  ready: "bg-primary/10 text-primary",
  published: "bg-green-500/10 text-green-400",
};

export function RecentOutputCard({ type, title, series, date, status }: RecentOutputCardProps) {
  const Icon = typeIcons[type];

  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors group cursor-pointer">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground truncate">{title}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">{typeLabels[type]}</span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-primary">{series}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className={cn("aa-pill text-[10px]", statusStyles[status])}>
          {status}
        </span>
        <span className="text-xs text-muted-foreground">{date}</span>
      </div>
    </div>
  );
}
