import { Users } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/console/PageHeader";
import { CardGrid } from "@/components/console/CardGrid";
import { useClients } from "@/hooks/useClients";
import type { NavCard } from "@/lib/studio-data";

export default function ClientConsole() {
  const { clients, isLoading } = useClients();

  const cards: NavCard[] = clients.map((client) => ({
    title: client.business_name,
    description: `${client.owner_name}${client.tier ? ` • ${client.tier}` : ""}${client.status ? ` • ${client.status}` : ""}`,
    href: `/client/${client.id}`,
    icon: Users,
  }));

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-6xl mx-auto">
        <PageHeader
          eyebrow="Client Console"
          title="Active clients"
          accent="workspace"
          subtitle="Open a client to access that client’s workspace."
        />

        <div className="mt-10">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading active clients…</div>
          ) : cards.length ? (
            <CardGrid cards={cards} />
          ) : (
            <div className="aa-card text-sm text-muted-foreground">No active clients found.</div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
