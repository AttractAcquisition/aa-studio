import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Plus } from "lucide-react";
import { ConsolePage } from "@/components/console/ConsolePage";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useClients } from "@/hooks/useClients";

const emptyForm = {
  name: "",
  trade_sector: "roofing",
  city: "Cape Town",
  service_radius_km: "30",
  avg_job_value_zar: "",
  conversion_objective: "whatsapp",
};

export default function ClientConsole() {
  const { clients, isLoading } = useClients();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const sortedClients = useMemo(() => clients, [clients]);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const { data, error } = await supabase.from("clients").insert({
        name: form.name,
        trade_sector: form.trade_sector,
        city: form.city,
        service_radius_km: form.service_radius_km ? Number(form.service_radius_km) : null,
        avg_job_value_zar: form.avg_job_value_zar ? Number(form.avg_job_value_zar) : null,
        conversion_objective: form.conversion_objective,
        status: "active",
        onboarded_at: new Date().toISOString(),
      }).select("id").single();
      if (error) throw error;

      const start = new Date();
      const end = new Date();
      end.setDate(start.getDate() + 13);
      await supabase.from("cycles").insert({
        client_id: data.id,
        cycle_number: 1,
        start_date: start.toISOString().slice(0, 10),
        end_date: end.toISOString().slice(0, 10),
        status: "active",
      });

      setOpen(false);
      setForm(emptyForm);
      setMessage("Client created and cycle 1 started.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <ConsolePage
        eyebrow="Client Console"
        title="Client Console"
        description="Select an active client and open their workspace."
      />

      {message ? <div className="aa-card text-sm text-muted-foreground">{message}</div> : null}

      <div className="aa-card space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Active clients</h2>
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add client
          </Button>
        </div>

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading clients…</div>
        ) : sortedClients.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {sortedClients.map((client) => (
              <Link
                key={client.id}
                to={`/clients/${client.id}`}
                className="rounded-xl border border-border bg-background p-4 transition-colors hover:bg-secondary"
              >
                <div className="font-medium text-foreground">{client.name}</div>
                <div className="text-sm text-muted-foreground">
                  {[client.trade_sector, client.city, client.conversion_objective, client.status].filter(Boolean).join(" • ")}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No active clients found.</div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add client</DialogTitle>
            <DialogDescription>Create a client and start cycle 1 immediately.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <Field label="Name" value={form.name} onChange={(value) => setForm((prev) => ({ ...prev, name: value }))} />
            <SelectField label="Sector" value={form.trade_sector} onChange={(value) => setForm((prev) => ({ ...prev, trade_sector: value }))} options={["roofing", "joinery", "flooring", "pool renovation", "painting", "tiling", "landscaping", "electrical", "plumbing", "other"]} />
            <Field label="City" value={form.city} onChange={(value) => setForm((prev) => ({ ...prev, city: value }))} />
            <Field label="Service radius km" value={form.service_radius_km} onChange={(value) => setForm((prev) => ({ ...prev, service_radius_km: value }))} type="number" />
            <Field label="Avg job value ZAR" value={form.avg_job_value_zar} onChange={(value) => setForm((prev) => ({ ...prev, avg_job_value_zar: value }))} type="number" />
            <SelectField label="Conversion objective" value={form.conversion_objective} onChange={(value) => setForm((prev) => ({ ...prev, conversion_objective: value }))} options={["whatsapp", "dm", "form", "booking"]} />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving || !form.name}>{saving ? "Saving…" : "Create client"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}
