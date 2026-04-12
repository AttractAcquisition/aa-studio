import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/console/PageHeader";
import { StatRow } from "@/components/console/StatRow";
import { Section } from "@/components/console/Section";
import { Badge } from "@/components/ui/badge";
import { performanceMetrics, winnerAngles } from "@/lib/studio-data";

const stats = [
  { label: "Metrics", value: String(performanceMetrics.length), note: "Views through calls" },
  { label: "Winners", value: String(winnerAngles.length), note: "Winning angles" },
  { label: "Feedback", value: "Closed loop", note: "Learn and iterate" },
  { label: "Mode", value: "Local", note: "Sample analytics" },
];

export default function Performance() {
  return (
    <AppLayout>
      <div className="animate-fade-in max-w-6xl mx-auto space-y-10">
        <PageHeader
          eyebrow="Performance"
          title="Measure what"
          accent="wins"
          subtitle="Track content performance, isolate winning angles, and feed the learnings back into the next batch."
        />

        <StatRow stats={stats} />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Section title="Performance metrics" description="The basic feedback layer for content decisions.">
            <div className="grid grid-cols-2 gap-4">
              {performanceMetrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">{metric.label}</p>
                  <div className="text-3xl font-black text-foreground">{metric.value}</div>
                  <p className="text-sm text-muted-foreground mt-1">{metric.note}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Winning angles" description="The ideas that should inform the next production cycle.">
            <div className="flex flex-wrap gap-2">
              {winnerAngles.map((angle) => <Badge key={angle}>{angle}</Badge>)}
            </div>
            <div className="mt-6 aa-panel">
              <p className="text-sm text-muted-foreground">Feedback rule</p>
              <p className="font-medium text-foreground mt-1">What wins gets repurposed, sharpened, and tested again.</p>
            </div>
          </Section>
        </div>
      </div>
    </AppLayout>
  );
}
