import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ConsolePage } from "@/components/console/ConsolePage";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export default function ContentCalendar() {
  const { clientId } = useParams();
  const [cycles, setCycles] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const activeCycle = useMemo(() => cycles.find((cycle) => cycle.status === 'active') ?? cycles[0] ?? null, [cycles]);

  useEffect(() => {
    const load = async () => {
      if (!clientId) return;
      const [{ data: cycleRows }, { data: entryRows }] = await Promise.all([
        supabase.from("cycles").select("*").eq("client_id", clientId).order("cycle_number", { ascending: false }),
        supabase.from("content_calendar_entries").select("*").eq("client_id", clientId).order("scheduled_date", { ascending: true }),
      ]);
      setCycles(cycleRows ?? []);
      setEntries(entryRows ?? []);
    };
    void load();
  }, [clientId]);

  const closeCycle = async () => {
    if (!clientId || !activeCycle) return;
    setMessage(null);
    try {
      const result = await supabase.functions.invoke("generate-cycle-brief", { body: { client_id: clientId, completed_cycle_id: activeCycle.id } });
      if (result.error) throw result.error;
      const [{ data: cycleRows }, { data: entryRows }] = await Promise.all([
        supabase.from("cycles").select("*").eq("client_id", clientId).order("cycle_number", { ascending: false }),
        supabase.from("content_calendar_entries").select("*").eq("client_id", clientId).order("scheduled_date", { ascending: true }),
      ]);
      setCycles(cycleRows ?? []);
      setEntries(entryRows ?? []);
      setMessage("Cycle closed and next cycle created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <div className="space-y-8">
      <ConsolePage eyebrow="Content Calendar" title="Content Calendar" description="Plan and monitor the current 14-day content cycle." />

      {message ? <div className="aa-card text-sm text-muted-foreground">{message}</div> : null}

      <section className="aa-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-medium text-foreground">{activeCycle ? `Cycle ${activeCycle.cycle_number}` : 'No active cycle'}</div>
            <div className="text-sm text-muted-foreground">{activeCycle ? `${activeCycle.start_date} → ${activeCycle.end_date}` : 'Create a cycle to begin scheduling.'}</div>
          </div>
          <Button onClick={closeCycle} disabled={!activeCycle}>Close cycle</Button>
        </div>
      </section>

      <section className="aa-card space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Calendar entries</h2>
        <div className="grid gap-4 xl:grid-cols-2">
          {entries.length ? entries.map((entry) => (
            <article key={entry.id} className="rounded-xl border border-border bg-background p-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium text-foreground">{entry.content_type} · {entry.publish_status}</div>
                <div className="text-xs text-muted-foreground">{entry.scheduled_date || 'unscheduled'}</div>
              </div>
              <div className="text-sm text-muted-foreground">{entry.format || entry.platform || 'instagram'}</div>
            </article>
          )) : <div className="text-sm text-muted-foreground">No calendar entries yet.</div>}
        </div>
      </section>
    </div>
  );
}
