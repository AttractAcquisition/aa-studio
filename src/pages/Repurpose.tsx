import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/console/PageHeader";
import { StatRow } from "@/components/console/StatRow";
import { Section } from "@/components/console/Section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { repurposeSources, repurposeOutputs } from "@/lib/studio-data";

const stats = [
  { label: "Source types", value: String(repurposeSources.length), note: "Inputs from proof and docs" },
  { label: "Output types", value: String(repurposeOutputs.length), note: "Multi-channel outputs" },
  { label: "Rule", value: "1 → many", note: "Content leverage" },
  { label: "Mode", value: "Local", note: "Simulated generation" },
];

const sample = {
  source: "Client result",
  title: "We doubled booked calls in 21 days",
  outputs: ["Reel script", "Carousel", "Caption", "Email"],
};

export default function Repurpose() {
  const [selectedSource, setSelectedSource] = useState(sample.source);
  const [selectedTitle, setSelectedTitle] = useState(sample.title);

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-6xl mx-auto space-y-10">
        <PageHeader
          eyebrow="Repurpose Engine"
          title="One source in"
          accent="many outputs out"
          subtitle="Convert proof, notes, testimonials, and docs into multiple publishable content formats."
        />

        <StatRow stats={stats} />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Section title="Choose a source" description="Select the upstream material to repurpose.">
            <div className="flex flex-wrap gap-2">
              {repurposeSources.map((source) => (
                <Button key={source} variant={selectedSource === source ? "default" : "outline"} size="sm" onClick={() => setSelectedSource(source)}>
                  {source}
                </Button>
              ))}
            </div>
            <div className="mt-6 aa-panel">
              <p className="text-sm text-muted-foreground">Selected source</p>
              <p className="font-semibold text-foreground mt-1">{selectedSource}</p>
            </div>
          </Section>

          <Section title="Repurpose target" description="This sample shows the level of output aa-studio should create.">
            <div className="rounded-2xl border border-border bg-secondary/30 p-4 mb-4">
              <p className="text-xs uppercase tracking-[0.2em] text-primary mb-2">Source title</p>
              <p className="font-semibold text-foreground">{selectedTitle}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {sample.outputs.map((item) => <Badge key={item}>{item}</Badge>)}
            </div>
            <div className="mt-6">
              <Button onClick={() => setSelectedTitle(`${selectedSource} → generated content`) }>
                Simulate repurpose
              </Button>
            </div>
          </Section>
        </div>

        <Section title="Output matrix" description="Every source should be convertible into multiple channel-specific assets.">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {repurposeOutputs.map((output) => (
              <div key={output} className="rounded-2xl border border-border bg-secondary/30 p-4">
                <p className="font-semibold text-foreground">{output}</p>
                <p className="text-sm text-muted-foreground mt-2">Repurposed from proof, notes, or long-form content.</p>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </AppLayout>
  );
}
