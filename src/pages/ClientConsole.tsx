import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { ConsolePage } from "@/components/console/ConsolePage";
import { useClients } from "@/hooks/useClients";

export default function ClientConsole() {
  const { clients, isLoading } = useClients();

  return (
    <div className="space-y-8">
      <ConsolePage
        eyebrow="Client Console"
        title="Client Console"
        description="Select an active client and open their workspace."
      />

      <div className="aa-card space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Active clients</h2>
        </div>

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading clients…</div>
        ) : clients.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {clients.map((client) => (
              <Link
                key={client.id}
                to={`/clients/${client.id}`}
                className="rounded-xl border border-border bg-background p-4 transition-colors hover:bg-secondary"
              >
                <div className="font-medium text-foreground">{client.business_name}</div>
                <div className="text-sm text-muted-foreground">
                  {[client.owner_name, client.tier, client.status].filter(Boolean).join(" • ")}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No active clients found.</div>
        )}
      </div>
    </div>
  );
}
