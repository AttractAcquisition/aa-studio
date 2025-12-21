import { AppLayout } from "@/components/layout/AppLayout";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { ReelCoverPreview } from "@/components/templates/ReelCoverPreview";
import { BoldTextPreview } from "@/components/templates/BoldTextPreview";
import { ProofCardPreview } from "@/components/templates/ProofCardPreview";
import { CarouselPreview } from "@/components/templates/CarouselPreview";
import { OnePagerPreview } from "@/components/templates/OnePagerPreview";
import { AuditOverlayPreview } from "@/components/templates/AuditOverlayPreview";
import { Button } from "@/components/ui/button";
import { Plus, Filter } from "lucide-react";

const templates = [
  {
    type: "REEL COVER",
    title: "Reel Cover",
    description: "Bold category tag, large headline, underline bar, subtitle, AA logo placement.",
    formats: ["9:16", "Grid Safe"],
    preview: <ReelCoverPreview />,
  },
  {
    type: "TEXT CARD",
    title: "Bold Text Card",
    description: "Deep ink background, huge headline, single purple highlight, minimal design.",
    formats: ["4:5"],
    preview: <BoldTextPreview />,
  },
  {
    type: "CAROUSEL",
    title: "Carousel Framework",
    description: "White background, lavender panels, purple headings, multi-section layout.",
    formats: ["4:5"],
    preview: <CarouselPreview />,
  },
  {
    type: "ONE-PAGER",
    title: "One-Pager Scroll",
    description: "Stacked lavender cards, beat-by-beat breakdown, scrollable format.",
    formats: ["9:16", "4:5"],
    preview: <OnePagerPreview />,
  },
  {
    type: "AUDIT",
    title: "Audit Overlay",
    description: "Screenshot base with blur tools, problem/fix/result labels, callouts.",
    formats: ["9:16"],
    preview: <AuditOverlayPreview />,
  },
  {
    type: "PROOF",
    title: "Proof Card",
    description: "Framed screenshot, what changed + why it worked panels, attraction score.",
    formats: ["9:16"],
    preview: <ProofCardPreview />,
  },
];

export default function TemplateLibrary() {
  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="aa-pill-primary mb-4">Template Library</div>
            <h1 className="aa-headline-lg text-foreground">
              Design <span className="aa-gradient-text">Templates</span>
            </h1>
            <p className="aa-body mt-2 max-w-lg">
              6 brand-locked templates for consistent, on-brand content. Edit fields, not layouts.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="gradient">
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </div>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template, index) => (
            <div key={template.type} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <TemplateCard {...template} />
            </div>
          ))}
        </div>

        {/* Format Legend */}
        <div className="mt-12 aa-card">
          <h3 className="font-bold text-foreground mb-4">Format Reference</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-20 rounded-lg bg-primary/10 border border-primary/30" />
              <div>
                <p className="font-medium text-foreground">9:16</p>
                <p className="text-xs text-muted-foreground">1080 × 1920px</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-16 h-20 rounded-lg bg-primary/10 border border-primary/30" />
              <div>
                <p className="font-medium text-foreground">4:5</p>
                <p className="text-xs text-muted-foreground">1080 × 1350px</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg bg-primary/10 border border-primary/30" />
              <div>
                <p className="font-medium text-foreground">1:1</p>
                <p className="text-xs text-muted-foreground">1080 × 1080px</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-20 h-12 rounded-lg bg-primary/10 border border-primary/30" />
              <div>
                <p className="font-medium text-foreground">16:9</p>
                <p className="text-xs text-muted-foreground">1920 × 1080px</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
