import { useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useClients } from "@/hooks/useClients";

export default function ClientDashboard() {
  const { clientId } = useParams();
  const { clients } = useClients();
  const client = clients.find((item) => item.id === clientId);

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-4 py-10">
        <div className="aa-card space-y-4">
          <div className="aa-pill-outline w-fit">Client workspace</div>
          <h1 className="aa-headline-lg text-foreground">{client?.business_name || "Client"}</h1>
          <p className="text-muted-foreground">
            Blank client page for the selected account. We’ll build the client workflow here next.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
