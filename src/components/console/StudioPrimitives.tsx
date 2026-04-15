import { Loader2, CheckCircle2, CircleAlert, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function AIGenerationLoader({ label }: { label: string }) {
  return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Generating {label}…</div>;
}

export function ApprovalStatusBadge({ status }: { status: string }) {
  const classes = {
    pending: "bg-amber-500/15 text-amber-600",
    approved: "bg-emerald-500/15 text-emerald-600",
    in_review: "bg-blue-500/15 text-blue-600",
    revision_requested: "bg-orange-500/15 text-orange-600",
    rejected: "bg-red-500/15 text-red-600",
    draft: "bg-muted text-muted-foreground",
    scheduled: "bg-cyan-500/15 text-cyan-600",
    published: "bg-emerald-500/15 text-emerald-600",
    exported: "bg-violet-500/15 text-violet-600",
  } as Record<string, string>;

  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", classes[status] ?? classes.draft)}>{status}</span>;
}

export function ProofScoreBadge({ score }: { score: number | null | undefined }) {
  const safe = score ?? 0;
  const tone = safe >= 7 ? "bg-emerald-500/15 text-emerald-600" : safe >= 4 ? "bg-amber-500/15 text-amber-600" : "bg-red-500/15 text-red-600";
  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", tone)}>{safe}/10</span>;
}

export function FunnelLayerBadge({ layer }: { layer: string }) {
  const tone = layer === "attraction" ? "bg-teal-500/15 text-teal-600" : layer === "nurture" ? "bg-violet-500/15 text-violet-600" : "bg-rose-500/15 text-rose-600";
  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", tone)}>{layer}</span>;
}

export function CycleContextBar({ cycleLabel, daysRemaining }: { cycleLabel: string; daysRemaining: number | null }) {
  return (
    <div className="aa-card flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Sparkles className="h-4 w-4" /> {cycleLabel}</div>
      <div className="text-sm text-muted-foreground">{daysRemaining === null ? "No active cycle" : `${daysRemaining} days remaining`}</div>
    </div>
  );
}

export function PrerequisiteGate({ message, linkLabel, linkPath }: { message: string; linkLabel: string; linkPath: string; }) {
  return (
    <div className="aa-card mx-auto max-w-2xl space-y-4 text-center">
      <CircleAlert className="mx-auto h-8 w-8 text-amber-500" />
      <div className="text-lg font-semibold text-foreground">Prerequisite needed</div>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button asChild><a href={linkPath}>{linkLabel}</a></Button>
    </div>
  );
}
