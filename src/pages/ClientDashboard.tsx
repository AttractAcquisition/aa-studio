import { ConsolePage } from "@/components/console/ConsolePage";
import { useClients } from "@/hooks/useClients";
import { useParams } from "react-router-dom";

export default function ClientDashboard() {
  const { clientId } = useParams();
  const { clients } = useClients();
  const client = clients.find((item) => item.id === clientId);

  return (
    <ConsolePage
      eyebrow="Client workspace"
      title={client?.business_name || "Client workspace"}
      description="Blank client workspace shell. The full client-specific content system will live here."
    />
  );
}
