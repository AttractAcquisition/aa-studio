import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/console/PageHeader";
import { StatRow } from "@/components/console/StatRow";
import { Section } from "@/components/console/Section";
import { Badge } from "@/components/ui/badge";

const stats = [
  { label: "Outputs", value: "Scripts + assets", note: "One workflow" },
  { label: "Stages", value: "4", note: "Script, one-pager, design, export" },
  { label: "Formats", value: "Multi", note: "Reels, carousels, email" },
  { label: "Mode", value: "Local UI", note: "No API dependency" },
];

const outputs = [
  "Reel scripts",
  "Talking-head scripts",
  "Carousel copy",
  "Captions",
  "Email drafts",
  "Ad copy",
  "Landing page copy",
  "Hook banks",
  "CTA variants",
];

const pipeline = [
  "Brief",
  "Script",
  "One-pager",
  "Design",
  "Export",
];

export default function Production() {
  return (
    <AppLayout>
      <div className="animate-fade-in max-w-6xl mx-auto space-y-10">
        <PageHeader
          eyebrow="Content Production"
          title="Create"
          accent="assets"
          subtitle="The studio layer that turns briefs into scripts, one-pagers, and production-ready content assets."
        />

        <StatRow stats={stats} />

        <Section title="Production pipeline" description="The core flow of the studio.">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {pipeline.map((step, index) => (
              <div key={step} className="rounded-2xl border border-border bg-secondary/30 p-4">
                <div className="text-xs text-primary font-semibold mb-2">0{index + 1}</div>
                <div className="font-medium text-foreground">{step}</div>
              </div>
            ))}
          </div>
        </Section>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Section title="Output types" description="The asset formats this studio should generate.">
            <div className="flex flex-wrap gap-2">
              {outputs.map((item) => <Badge key={item} variant="secondary">{item}</Badge>)}
            </div>
          </Section>

          <Section title="Production rule" description="Keep the asset tied to the brief, not to generic content noise.">
            <div className="aa-panel space-y-2 text-sm text-muted-foreground">
              <p>• One brief can produce many asset variants.</p>
              <p>• Production stays proof-first and offer-led.</p>
              <p>• Every output should be easy to export or repurpose later.</p>
            </div>
          </Section>
        </div>
      </div>
    </AppLayout>
  );
}
