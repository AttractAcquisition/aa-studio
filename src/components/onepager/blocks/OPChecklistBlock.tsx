// One-Pager Checklist Block
import type { ChecklistBlock } from "@/types/one-pager-layout";
import { CheckSquare } from "lucide-react";

interface OPChecklistBlockProps {
  block: ChecklistBlock;
}

export function OPChecklistBlock({ block }: OPChecklistBlockProps) {
  return (
    <div className="rounded-xl bg-card border border-border/40 p-5">
      {block.title && (
        <h4 className="font-semibold text-foreground mb-3">{block.title}</h4>
      )}
      <ul className="space-y-2.5">
        {block.items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-3 text-sm">
            <CheckSquare className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <span className="text-muted-foreground">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
