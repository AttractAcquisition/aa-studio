import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/console/PageHeader";
import { StatRow } from "@/components/console/StatRow";
import { Section } from "@/components/console/Section";
import { Badge } from "@/components/ui/badge";
import { librarySections } from "@/lib/studio-data";

const stats = [
  { label: "Sections", value: String(librarySections.length), note: "Brand + assets" },
  { label: "Search", value: "On", note: "All content objects" },
  { label: "Sources", value: "Linked", note: "Proof + files" },
  { label: "Versioning", value: "Planned", note: "For backend phase" },
];

export default function Library() {
  return (
    <AppLayout>
      <div className="animate-fade-in max-w-6xl mx-auto space-y-10">
        <PageHeader
          eyebrow="Content Library"
          title="Search"
          accent="everything"
          subtitle="A searchable library for brand kit, templates, scripts, proof, assets, and reusable playbooks."
        />

        <StatRow stats={stats} />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {librarySections.map((section) => (
            <Section key={section.title} title={section.title} description="Reusable system layer">
              <div className="flex flex-wrap gap-2">
                {section.items.map((item) => <Badge key={item} variant="secondary">{item}</Badge>)}
              </div>
            </Section>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
