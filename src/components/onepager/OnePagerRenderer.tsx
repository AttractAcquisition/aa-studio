// One-Pager Layout Renderer
import { forwardRef } from "react";
import type { OnePagerLayout, OnePagerBlock as BlockType } from "@/types/one-pager-layout";
import {
  OPHeaderBlock,
  OPCardBlock,
  OPChecklistBlock,
  OPStepsBlock,
  OPTemplateBlock,
  OPTableBlock,
  OPScorecardBlock,
  OPMiniBarChartBlock,
  OPWarningBlock,
  OPCTAButtonsBlock,
} from "./blocks";

interface OnePagerRendererProps {
  layout: OnePagerLayout;
  brand?: string;
}

function renderBlock(block: BlockType, index: number) {
  switch (block.type) {
    case "card":
      return <OPCardBlock key={index} block={block} />;
    case "checklist":
      return <OPChecklistBlock key={index} block={block} />;
    case "steps":
      return <OPStepsBlock key={index} block={block} />;
    case "template":
      return <OPTemplateBlock key={index} block={block} />;
    case "table":
      return <OPTableBlock key={index} block={block} />;
    case "scorecard":
      return <OPScorecardBlock key={index} block={block} />;
    case "mini_bar_chart":
      return <OPMiniBarChartBlock key={index} block={block} />;
    case "warning":
      return <OPWarningBlock key={index} block={block} />;
    case "cta_buttons":
      return <OPCTAButtonsBlock key={index} block={block} />;
    default:
      return null;
  }
}

export const OnePagerRenderer = forwardRef<HTMLDivElement, OnePagerRendererProps>(
  function OnePagerRenderer({ layout, brand = "AA Studio" }, ref) {
    return (
      <div 
        ref={ref}
        className="w-full max-w-[800px] mx-auto bg-background rounded-2xl border border-border/40 overflow-hidden"
      >
        {/* Header */}
        <div className="p-6">
          <OPHeaderBlock meta={layout.meta} brand={brand} />
        </div>

        {/* Sections */}
        <div className="px-6 pb-6 space-y-8">
          {layout.sections.map((section) => (
            <section key={section.id} className="space-y-4">
              {/* Section heading */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {section.beatNumber}
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {section.heading}
                </h3>
              </div>

              {/* Blocks */}
              <div className="space-y-4 pl-11">
                {section.blocks.map((block, idx) => renderBlock(block, idx))}
              </div>
            </section>
          ))}
        </div>

        {/* Footer */}
        {layout.footer?.text && (
          <div className="px-6 py-4 border-t border-border/40 text-center text-xs text-muted-foreground">
            {layout.footer.text}
          </div>
        )}
      </div>
    );
  }
);
