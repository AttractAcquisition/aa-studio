import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/console/PageHeader";
import { StatRow } from "@/components/console/StatRow";
import { Section } from "@/components/console/Section";
import { Badge } from "@/components/ui/badge";
import { strategyPillars, campaignThemes } from "@/lib/studio-data";

const stats = [
  { label: "Pillars", value: String(strategyPillars.length), note: "Strategy anchors" },
  { label: "Themes", value: String(campaignThemes.length), note: "Current campaigns" },
  { label: "Cadence", value: "Weekly", note: "Batch planning" },
  { label: "Priority", value: "Proof", note: "Evidence first" },
];

const week = [
  { day: "Mon", focus: "Proof hooks", output: "2 reels + 1 carousel" },
  { day: "Tue", focus: "Offer clarity", output: "1 reel + 1 email" },
  { day: "Wed", focus: "Objection handling", output: "1 carousel + 1 proof post" },
  { day: "Thu", focus: "Authority", output: "1 talking-head reel" },
  { day: "Fri", focus: "Repurpose winners", output: "2 variants + exports" },
];

export default function Strategy() {
  return (
    <AppLayout>
      <div className="animate-fade-in max-w-6xl mx-auto space-y-10">
        <PageHeader
          eyebrow="Content Strategy"
          title="What gets made"
          accent="and why"
          subtitle="The planning layer that decides content pillars, campaign themes, batch priorities, and testing angles."
        />

        <StatRow stats={stats} />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Section title="Content pillars" description="The strategic buckets that guide everything we publish.">
            <div className="flex flex-wrap gap-2">
              {strategyPillars.map((pillar) => <Badge key={pillar}>{pillar}</Badge>)}
            </div>
            <div className="mt-6 space-y-3 text-sm text-muted-foreground">
              <p>• Keep every post tied to proof, offer, or authority.</p>
              <p>• Use one pillar per batch so the feed feels focused.</p>
              <p>• Rotate angles to avoid repetition.</p>
            </div>
          </Section>

          <Section title="Campaign themes" description="Current angles being tested across the content calendar.">
            <div className="flex flex-wrap gap-2">
              {campaignThemes.map((theme) => <Badge variant="secondary" key={theme}>{theme}</Badge>)}
            </div>
            <div className="mt-6 aa-panel">
              <p className="text-sm text-muted-foreground">Testing rule</p>
              <p className="font-medium text-foreground mt-1">One theme, multiple hooks, same proof.</p>
            </div>
          </Section>
        </div>

        <Section title="Weekly batch plan" description="A simple production cadence the team can execute without guesswork.">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {week.map((item) => (
              <div key={item.day} className="rounded-2xl border border-border bg-secondary/30 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-primary mb-3">{item.day}</div>
                <p className="font-semibold text-foreground">{item.focus}</p>
                <p className="text-sm text-muted-foreground mt-2">{item.output}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </AppLayout>
  );
}
