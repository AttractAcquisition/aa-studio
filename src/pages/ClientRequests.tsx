import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/console/PageHeader";
import { StatRow } from "@/components/console/StatRow";
import { Section } from "@/components/console/Section";
import { Button } from "@/components/ui/button";
import { clientRequests } from "@/lib/studio-data";

export default function ClientRequests() {
  const [items, setItems] = useState(clientRequests);
  const stats = [
    { label: "Requests", value: String(items.length), note: "Queued items" },
    { label: "Due soon", value: String(items.filter(item => item.due === "Today").length), note: "Needs attention" },
    { label: "Completed", value: "0", note: "Front-end demo" },
    { label: "Mode", value: "Client", note: "Request intake" },
  ];

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-6xl mx-auto space-y-10">
        <PageHeader eyebrow="Client Requests" title="Intake" accent="queue" subtitle="Log the client’s content needs before production starts." />
        <StatRow stats={stats} />
        <Section title="Request queue" description="Simple intake cards for the client workspace.">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.title} className="rounded-2xl border border-border bg-secondary/30 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{item.detail}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase tracking-[0.18em] text-primary">{item.due}</span>
                  <Button size="sm" onClick={() => setItems(prev => prev.filter(r => r.title !== item.title))}>Mark done</Button>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </AppLayout>
  );
}
