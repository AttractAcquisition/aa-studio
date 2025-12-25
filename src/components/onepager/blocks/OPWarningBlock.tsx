// One-Pager Warning Block
import type { WarningBlock } from "@/types/one-pager-layout";
import { AlertTriangle } from "lucide-react";

interface OPWarningBlockProps {
  block: WarningBlock;
}

export function OPWarningBlock({ block }: OPWarningBlockProps) {
  return (
    <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-5">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4 text-destructive" />
        </div>
        <div className="min-w-0">
          {block.title && (
            <h4 className="font-semibold text-destructive mb-1">{block.title}</h4>
          )}
          <p className="text-sm text-muted-foreground">{block.text}</p>
        </div>
      </div>
    </div>
  );
}
