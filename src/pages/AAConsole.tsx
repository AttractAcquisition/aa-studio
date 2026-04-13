import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/console/PageHeader";
import { CardGrid } from "@/components/console/CardGrid";
import { aaConsoleCards } from "@/lib/studio-data";

export default function AAConsole() {
  return (
    <AppLayout>
      <div className="animate-fade-in max-w-6xl mx-auto">
        <PageHeader
          eyebrow="AA Console"
          title="Internal content"
          accent="operations"
          subtitle="The production room for Attract Acquisition. Build, review, repurpose, and measure content that supports the business."
        />

        <div className="mt-10">
          <CardGrid cards={aaConsoleCards} />
        </div>
      </div>
    </AppLayout>
  );
}
