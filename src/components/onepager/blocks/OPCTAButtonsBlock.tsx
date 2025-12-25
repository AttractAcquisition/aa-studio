// One-Pager CTA Buttons Block
import type { CTAButtonsBlock } from "@/types/one-pager-layout";
import { ArrowRight, Bookmark } from "lucide-react";

interface OPCTAButtonsBlockProps {
  block: CTAButtonsBlock;
}

export function OPCTAButtonsBlock({ block }: OPCTAButtonsBlockProps) {
  return (
    <div className="flex flex-wrap gap-3 pt-2">
      {/* Primary button */}
      <div className="flex-1 min-w-[180px]">
        <button className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
          <span>{block.primary.label}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-xs text-muted-foreground text-center mt-1.5">
          {block.primary.actionText}
        </p>
      </div>

      {/* Secondary button (optional) */}
      {block.secondary && (
        <div className="flex-1 min-w-[180px]">
          <button className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-secondary border border-border text-foreground font-semibold text-sm hover:bg-secondary/80 transition-colors">
            <Bookmark className="w-4 h-4" />
            <span>{block.secondary.label}</span>
          </button>
          <p className="text-xs text-muted-foreground text-center mt-1.5">
            {block.secondary.actionText}
          </p>
        </div>
      )}
    </div>
  );
}
