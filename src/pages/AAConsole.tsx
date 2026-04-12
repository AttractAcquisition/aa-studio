import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/console/PageHeader";
import { CardGrid } from "@/components/console/CardGrid";
import { StatRow } from "@/components/console/StatRow";
import { aaConsoleCards, productionSteps } from "@/lib/studio-data";

const stats = [
  { label: "Focus", value: "Internal", note: "Attract Acquisition" },
  { label: "Modules", value: "7", note: "Complete content loop" },
  { label: "Primary output", value: "Publishable content", note: "No fluff" },
  { label: "Tone", value: "Proof-first", note: "AA voice only" },
];

export default function AAConsole() {
  return (
    <AppLayout>
      <div className="animate-fade-in max-w-6xl mx-auto">
        <PageHeader
          eyebrow="AA Console"
          title="Internal content"
          accent="operations"
          subtitle="The production room for Attract Acquisition. Build, review, repurpose, and measure content that supports the business."
          meta="Briefs → strategy → production → repurpose → QA → library → performance"
        />

        <StatRow stats={stats} />

        <div className="mt-10 space-y-6">
          <CardGrid cards={aaConsoleCards} />

          <div className="aa-card">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <p className="aa-pill-outline mb-3">Workflow</p>
                <h2 className="aa-headline-md text-foreground">AA studio production loop</h2>
              </div>
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Live front end</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {productionSteps.map((step, index) => (
                <div key={step} className="rounded-2xl border border-border bg-secondary/40 p-4">
                  <div className="text-xs text-primary font-semibold mb-2">0{index + 1}</div>
                  <div className="font-medium text-foreground">{step}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
