import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useClients } from "@/hooks/useClients";

export default function ClientConsole() {
  const { clients, isLoading } = useClients();

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-8 py-10">
        <div className="aa-card space-y-4">
          <div className="aa-pill-outline w-fit">Client Console</div>
          <h1 className="aa-headline-lg text-foreground">Client Console</h1>
          <p className="text-muted-foreground">
            Browse active clients and open a client workspace. This is the blank shell for client-side work.
          </p>
        </div>

        <div className="aa-card space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Active clients</h2>
          </div>

          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading clients…</div>
          ) : clients.length ? (
            <div className="space-y-2">
              {clients.map((client) => (
                <Link
                  key={client.id}
                  to={`/client/${client.id}`}
                  className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 transition-colors hover:bg-secondary"
                >
                  <div>
                    <div className="font-medium text-foreground">{client.business_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {[client.owner_name, client.tier, client.status].filter(Boolean).join(" • ")}
                    </div>
                  </div>
                  <span className="text-sm text-primary">Open</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No active clients found.</div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
