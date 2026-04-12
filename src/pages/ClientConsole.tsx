import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/console/PageHeader";
import { CardGrid } from "@/components/console/CardGrid";
import { StatRow } from "@/components/console/StatRow";
import { clientConsoleCards } from "@/lib/studio-data";

const stats = [
  { label: "Focus", value: "Client", note: "Workspace + approvals" },
  { label: "Modules", value: "5", note: "Requests to performance" },
  { label: "Approval flow", value: "Built-in", note: "Review-ready" },
  { label: "Goal", value: "Client clarity", note: "Less back-and-forth" },
];

export default function ClientConsole() {
  return (
    <AppLayout>
      <div className="animate-fade-in max-w-6xl mx-auto">
        <PageHeader
          eyebrow="Client Console"
          title="Client content"
          accent="workspace"
          subtitle="A focused workspace for client content requests, approvals, shared assets, schedules, and performance.">
        </PageHeader>

        <StatRow stats={stats} />

        <div className="mt-10">
          <CardGrid cards={clientConsoleCards} />
        </div>
      </div>
    </AppLayout>
  );
}
