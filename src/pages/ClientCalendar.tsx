import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/console/PageHeader";
import { StatRow } from "@/components/console/StatRow";
import { Section } from "@/components/console/Section";
import { clientSchedule } from "@/lib/studio-data";

const stats = [
  { label: "Batches", value: String(clientSchedule.length), note: "Planned cycles" },
  { label: "Today", value: "2", note: "Active jobs" },
  { label: "Upcoming", value: "5", note: "Queued assets" },
  { label: "Mode", value: "Client", note: "Shared calendar" },
];

export default function ClientCalendar() {
  return (
    <AppLayout>
      <div className="animate-fade-in max-w-6xl mx-auto space-y-10">
        <PageHeader eyebrow="Client Calendar" title="Publishing" accent="plan" subtitle="A simple scheduled view for client content batches and review dates." />
        <StatRow stats={stats} />
        <Section title="Schedule" description="Weekly production plan for the client workspace.">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {clientSchedule.map((item) => (
              <div key={item.title} className="rounded-2xl border border-border bg-secondary/30 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-primary mb-2">{item.time}</p>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{item.detail}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </AppLayout>
  );
}
