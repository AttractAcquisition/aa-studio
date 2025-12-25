// One-Pager Steps Block
import type { StepsBlock } from "@/types/one-pager-layout";

interface OPStepsBlockProps {
  block: StepsBlock;
}

export function OPStepsBlock({ block }: OPStepsBlockProps) {
  return (
    <div className="rounded-xl bg-card border border-border/40 p-5">
      {block.title && (
        <h4 className="font-semibold text-foreground mb-4">{block.title}</h4>
      )}
      <ol className="space-y-3">
        {block.steps.map((step, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
              {idx + 1}
            </span>
            <span className="text-sm text-muted-foreground pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
