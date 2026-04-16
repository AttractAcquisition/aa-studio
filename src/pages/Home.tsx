import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/console/PageHeader";
import { StatRow } from "@/components/console/StatRow";
import { CardGrid } from "@/components/console/CardGrid";
import { mainConsoleCards } from "@/lib/studio-data";

const stats = [
  { label: "Mode", value: "Ops console", note: "Editorial + production workflows" },
  { label: "Workspaces", value: "2", note: "AA + client production" },
  { label: "Modules", value: "7", note: "Briefs through performance" },
  { label: "Status", value: "Ready", note: "Frontend system online" },
];

export default function Home() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl animate-fade-in">
        <PageHeader
          eyebrow="AA Studio"
          title="Content production"
          accent="ops console"
          subtitle="Briefs, strategy, production, repurposing, review, library, and performance in one operating layer."
          meta="Purple system retained, startup polish replaced with console density"
        />

        <StatRow stats={stats} />

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CardGrid cards={mainConsoleCards} />
          <div className="aa-card flex flex-col justify-between">
            <div>
              <div className="aa-pill-outline mb-4">Scope</div>
              <h2 className="aa-headline-md mb-3 text-foreground">What this repo now feels like</h2>
              <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
                <li>• Terminal-ish, dashboard-first production surface</li>
                <li>• Internal AA Console for content operators</li>
                <li>• Client Console for client-facing production work</li>
                <li>• Modular pages, hooks, dialogs, and reusable UI primitives</li>
              </ul>
            </div>
            <div className="mt-8 aa-panel">
              <p className="text-sm text-muted-foreground">Next integration layer</p>
              <p className="text-lg font-medium text-foreground">Supabase + workflow backend later</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
