// One-Pager Scorecard Block
import type { ScorecardBlock } from "@/types/one-pager-layout";

interface OPScorecardBlockProps {
  block: ScorecardBlock;
}

function getRatingColor(value: string): string {
  const lower = value.toLowerCase();
  if (lower.includes('high') || lower.includes('quick') || lower === '10' || lower === '9' || lower === '8') {
    return 'bg-green-500/20 text-green-400 border-green-500/30';
  }
  if (lower.includes('med') || lower === '5' || lower === '6' || lower === '7') {
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  }
  if (lower.includes('low') || lower === '1' || lower === '2' || lower === '3' || lower === '4' || lower === '0') {
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  }
  return 'bg-primary/20 text-primary border-primary/30';
}

export function OPScorecardBlock({ block }: OPScorecardBlockProps) {
  return (
    <div className="rounded-xl bg-card border border-border/40 p-5">
      <h4 className="font-semibold text-foreground mb-4">{block.title}</h4>
      <div className="space-y-3">
        {block.rows.map((row, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between gap-4 py-2 border-b border-border/20 last:border-0"
          >
            <span className="text-sm text-muted-foreground">{row.label}</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRatingColor(row.value)}`}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
