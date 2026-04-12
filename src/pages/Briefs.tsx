import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/console/PageHeader";
import { StatRow } from "@/components/console/StatRow";
import { Section } from "@/components/console/Section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { briefInputs, sampleBriefs } from "@/lib/studio-data";
import { Plus, Wand2, Sparkles } from "lucide-react";

const initialBrief = {
  offer: "",
  audience: "",
  proof: "",
  angle: "",
  goal: "",
  platform: "Instagram Reels",
  cta: "Book a call",
};

export default function Briefs() {
  const [form, setForm] = useState(initialBrief);
  const [briefs, setBriefs] = useState(sampleBriefs);

  const stats = useMemo(() => [
    { label: "Briefs", value: String(briefs.length), note: "Ready to produce" },
    { label: "Inputs", value: "7", note: "Structured fields" },
    { label: "Platforms", value: "Multi", note: "Reels, carousels, email" },
    { label: "Mode", value: "No backend", note: "Local front end" },
  ], [briefs.length]);

  const updateField = (key: keyof typeof form, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const generateBrief = () => {
    const newBrief = {
      title: `${form.offer || "New"} brief`,
      offer: form.offer || "Unspecified offer",
      audience: form.audience || "Unspecified audience",
      angle: form.angle || "Angle pending",
      status: form.goal ? "ready" : "draft",
    };
    setBriefs(prev => [newBrief, ...prev]);
    setForm(initialBrief);
  };

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-6xl mx-auto space-y-10">
        <PageHeader
          eyebrow="Brief Builder"
          title="Content"
          accent="briefs"
          subtitle="Turn raw inputs into production-ready content briefs with hooks, angles, and a clear CTA."
        />

        <StatRow stats={stats} />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Section title="Create a brief" description="Enter the production inputs that define the content.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {briefInputs.slice(0, 4).map((field) => (
                <div key={field} className={field === "Proof" ? "md:col-span-2" : ""}>
                  <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2 block">{field}</label>
                  {field === "Proof" ? (
                    <Textarea value={form.proof} onChange={(e) => updateField("proof", e.target.value)} placeholder="Use numbers, testimonials, screenshots, or call notes." />
                  ) : field === "Offer" ? (
                    <Input value={form.offer} onChange={(e) => updateField("offer", e.target.value)} placeholder="Proof Sprint, Authority Brand, etc." />
                  ) : field === "Audience" ? (
                    <Input value={form.audience} onChange={(e) => updateField("audience", e.target.value)} placeholder="Owner-operated local businesses" />
                  ) : field === "Angle" ? (
                    <Input value={form.angle} onChange={(e) => updateField("angle", e.target.value)} placeholder="What is the sharpest angle?" />
                  ) : null}
                </div>
              ))}
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2 block">Goal</label>
                <Input value={form.goal} onChange={(e) => updateField("goal", e.target.value)} placeholder="Leads, booked calls, authority..." />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2 block">Platform</label>
                <Input value={form.platform} onChange={(e) => updateField("platform", e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2 block">CTA</label>
                <Input value={form.cta} onChange={(e) => updateField("cta", e.target.value)} />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button onClick={generateBrief} className="gap-2">
                <Wand2 className="w-4 h-4" /> Generate brief
              </Button>
              <Button variant="outline" onClick={() => setForm(initialBrief)}>
                Reset
              </Button>
            </div>
          </Section>

          <Section title="Brief output" description="These are the fields that become the production handoff.">
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-secondary/40 border border-border">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h4 className="font-semibold text-foreground">{form.offer || "New brief"}</h4>
                  <Badge variant="secondary">{form.platform}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{form.audience || "Audience pending"}</p>
                <p className="text-sm text-foreground mt-3">Angle: {form.angle || "Pending"}</p>
                <p className="text-sm text-foreground mt-2">Goal: {form.goal || "Pending"}</p>
                <p className="text-sm text-foreground mt-2">CTA: {form.cta}</p>
              </div>
              <div className="aa-panel">
                <p className="text-sm text-muted-foreground">What this feeds</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge>Script</Badge>
                  <Badge>One-pager</Badge>
                  <Badge>Design prompt</Badge>
                  <Badge>Repurpose set</Badge>
                </div>
              </div>
            </div>
          </Section>
        </div>

        <Section title="Saved briefs" description="The brief bank becomes the upstream source for every production cycle.">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {briefs.map((brief) => (
              <div key={brief.title} className="rounded-2xl border border-border bg-secondary/30 p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h4 className="font-semibold text-foreground">{brief.title}</h4>
                  <Badge variant={brief.status === "ready" ? "default" : "secondary"}>{brief.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{brief.offer}</p>
                <p className="text-sm text-muted-foreground mt-2">{brief.audience}</p>
                <p className="text-sm text-foreground mt-3">{brief.angle}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </AppLayout>
  );
}
