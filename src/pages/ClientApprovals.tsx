import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/console/PageHeader";
import { StatRow } from "@/components/console/StatRow";
import { Section } from "@/components/console/Section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { clientApprovals } from "@/lib/studio-data";

export default function ClientApprovals() {
  const [items, setItems] = useState(clientApprovals);
  const stats = [
    { label: "Pending", value: String(items.filter(item => item.state !== "approved").length), note: "Needs sign-off" },
    { label: "Approved", value: String(items.filter(item => item.state === "approved").length), note: "Ready to ship" },
    { label: "Revising", value: String(items.filter(item => item.state === "revising").length), note: "Needs edits" },
    { label: "Mode", value: "Client", note: "Approval flow" },
  ];

  const updateState = (title: string, state: string) => {
    setItems(prev => prev.map(item => (item.title === title ? { ...item, state } : item)));
  };

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-6xl mx-auto space-y-10">
        <PageHeader eyebrow="Client Approvals" title="Review" accent="and sign off" subtitle="Approve, revise, or move the asset back into the queue." />
        <StatRow stats={stats} />
        <Section title="Approval items" description="The client can see exactly what is ready, pending, or revising.">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.title} className="rounded-2xl border border-border bg-secondary/30 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <Badge variant={item.state === "approved" ? "default" : "secondary"}>{item.state}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.detail}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => updateState(item.title, "approved")}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => updateState(item.title, "revising")}>Revise</Button>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </AppLayout>
  );
}
