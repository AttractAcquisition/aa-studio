import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/console/PageHeader";
import { StatRow } from "@/components/console/StatRow";
import { Section } from "@/components/console/Section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { reviewItems } from "@/lib/studio-data";

export default function ReviewQueue() {
  const [items, setItems] = useState(reviewItems);

  const stats = useMemo(() => [
    { label: "Pending", value: String(items.filter(i => i.status !== "approve").length), note: "Needs attention" },
    { label: "Approved", value: String(items.filter(i => i.status === "approve").length), note: "Ready to ship" },
    { label: "Revisions", value: String(items.filter(i => i.status === "revise").length), note: "Needs edits" },
    { label: "QA", value: "On", note: "Voice + accuracy checks" },
  ], [items]);

  const updateStatus = (title: string, status: string) => {
    setItems(prev => prev.map(item => (item.title === title ? { ...item, status } : item)));
  };

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-6xl mx-auto space-y-10">
        <PageHeader
          eyebrow="Review Queue"
          title="Approve,"
          accent="revise, or reject"
          subtitle="The QA layer keeps the content on-brand, accurate, and ready for publish."
        />

        <StatRow stats={stats} />

        <Section title="Items in review" description="Use local approvals now, then swap in backend workflow later.">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.title} className="rounded-2xl border border-border bg-secondary/30 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <Badge variant={item.status === "approve" ? "default" : "secondary"}>{item.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.note}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => updateStatus(item.title, "approve")}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => updateStatus(item.title, "revise")}>Revise</Button>
                  <Button size="sm" variant="ghost" onClick={() => updateStatus(item.title, "reject")}>Reject</Button>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </AppLayout>
  );
}
