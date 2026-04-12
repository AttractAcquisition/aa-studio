import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/console/PageHeader";
import { StatRow } from "@/components/console/StatRow";
import { Section } from "@/components/console/Section";
import { Badge } from "@/components/ui/badge";
import { clientLibraryItems } from "@/lib/studio-data";

const stats = [
  { label: "Items", value: String(clientLibraryItems.length), note: "Approved assets" },
  { label: "Access", value: "Shared", note: "Client ready" },
  { label: "Versions", value: "Trackable", note: "Once backend lands" },
  { label: "Mode", value: "Client", note: "Asset library" },
];

export default function ClientLibrary() {
  return (
    <AppLayout>
      <div className="animate-fade-in max-w-6xl mx-auto space-y-10">
        <PageHeader eyebrow="Client Library" title="Shared" accent="assets" subtitle="The client-approved asset bank: captions, exports, proof, style refs, and handoff packages." />
        <StatRow stats={stats} />
        <Section title="Library items" description="A simple shared library for the client workspace.">
          <div className="flex flex-wrap gap-2">
            {clientLibraryItems.map((item) => <Badge key={item}>{item}</Badge>)}
          </div>
        </Section>
      </div>
    </AppLayout>
  );
}
