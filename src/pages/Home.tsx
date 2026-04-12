import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/console/PageHeader";
import { StatRow } from "@/components/console/StatRow";
import { CardGrid } from "@/components/console/CardGrid";
import { mainConsoleCards } from "@/lib/studio-data";

const stats = [
  { label: "Mode", value: "Content-first", note: "No backend work yet" },
  { label: "Consoles", value: "2", note: "AA + Client" },
  { label: "Core modules", value: "7", note: "Briefs through performance" },
  { label: "Status", value: "Ready", note: "Frontend only" },
];

export default function Home() {
  return (
    <AppLayout>
      <div className="animate-fade-in max-w-6xl mx-auto">
        <PageHeader
          eyebrow="AA Studio"
          title="Content production"
          accent="system"
          subtitle="Turn strategy, proof, and offers into publishable content. Pick a console to enter the studio or the client workspace."
          meta="Purple visual system retained, backend integration deferred"
        />

        <StatRow stats={stats} />

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardGrid cards={mainConsoleCards} />
          <div className="aa-card flex flex-col justify-between">
            <div>
              <div className="aa-pill-outline mb-4">Scope</div>
              <h2 className="aa-headline-md text-foreground mb-3">What this repo now focuses on</h2>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>• Briefs, strategy, production, repurposing, review, library, and performance</li>
                <li>• AA Console for internal content needs</li>
                <li>• Client Console for client content needs</li>
                <li>• No backend wiring yet, just the front-end system</li>
              </ul>
            </div>
            <div className="mt-8 aa-panel">
              <p className="text-sm text-muted-foreground">Next integration layer</p>
              <p className="text-lg font-semibold text-foreground">Supabase + workflow backend later</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
