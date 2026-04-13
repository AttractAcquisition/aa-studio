import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/console/PageHeader";
import { CardGrid } from "@/components/console/CardGrid";
import { aaConsoleCards } from "@/lib/studio-data";
import { useClients } from "@/hooks/useClients";
import type { NavCard } from "@/lib/studio-data";

export default function ClientDashboard() {
  const { clientId } = useParams();
  const { clients } = useClients();

  const client = clients.find((item) => item.id === clientId);

  const cards = useMemo<NavCard[]>(() =>
    aaConsoleCards.map((card) => ({
      ...card,
      href: `${card.href}?clientId=${clientId || ""}`,
    })),
    [clientId]
  );

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-6xl mx-auto space-y-8">
        <PageHeader
          eyebrow="Client Dashboard"
          title={client?.business_name || "Client workspace"}
          accent="workspace"
          subtitle={client ? `Workspace for ${client.owner_name}${client.tier ? ` • ${client.tier}` : ""}` : "Open a client from the Client Console to work in that client’s workspace."}
        />

        <CardGrid cards={cards} />
      </div>
    </AppLayout>
  );
}
