import { Link } from "react-router-dom";
import { ConsolePage } from "@/components/console/ConsolePage";
import { useClients } from "@/hooks/useClients";
import { studioPageNav } from "@/lib/route-config";
import { useParams } from "react-router-dom";
import { useStudio } from "@/context/StudioContext";

export default function ClientDashboard() {
  const { clientId } = useParams();
  const { clients } = useClients();
  const { activeCycle } = useStudio();
  const client = clients.find((item) => item.id === clientId);

  return (
    <div className="space-y-8">
      <ConsolePage
        eyebrow="Client workspace"
        title={client?.name || "Client workspace"}
        description="This workspace stores the client's brand inputs, content outputs, approvals, and calendar."
      />

      <section className="aa-card space-y-3">
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3 text-sm text-muted-foreground">
          <div><span className="text-foreground">Sector:</span> {client?.trade_sector || '—'}</div>
          <div><span className="text-foreground">City:</span> {client?.city || '—'}</div>
          <div><span className="text-foreground">Objective:</span> {client?.conversion_objective || '—'}</div>
          <div><span className="text-foreground">Service radius:</span> {client?.service_radius_km ?? '—'} km</div>
          <div><span className="text-foreground">Avg job value:</span> R{client?.avg_job_value_zar ?? '—'}</div>
          <div><span className="text-foreground">Cycle:</span> {activeCycle ? `#${activeCycle.cycle_number}` : 'None'}</div>
        </div>
      </section>

      <section className="aa-card space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Open the studio pages</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {studioPageNav.map((item) => (
            <Link key={item.path} to={`/clients/${clientId}/${item.path}`} className="rounded-xl border border-border bg-background p-4 transition-colors hover:bg-secondary">
              <div className="font-medium text-foreground">{item.title}</div>
              <div className="text-sm text-muted-foreground">{item.description}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
