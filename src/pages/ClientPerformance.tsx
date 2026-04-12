import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/console/PageHeader";
import { StatRow } from "@/components/console/StatRow";
import { Section } from "@/components/console/Section";
import { clientPerformanceStats } from "@/lib/studio-data";

export default function ClientPerformance() {
  return (
    <AppLayout>
      <div className="animate-fade-in max-w-6xl mx-auto space-y-10">
        <PageHeader eyebrow="Client Performance" title="Content" accent="results" subtitle="Track delivered content, approval speed, and client-facing wins." />
        <StatRow stats={clientPerformanceStats} />
        <Section title="What to track" description="The feedback loop for the client side of the studio.">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="aa-panel">• Content delivered</div>
            <div className="aa-panel">• Approvals per round</div>
            <div className="aa-panel">• Time to feedback</div>
            <div className="aa-panel">• Client wins and notes</div>
          </div>
        </Section>
      </div>
    </AppLayout>
  );
}
