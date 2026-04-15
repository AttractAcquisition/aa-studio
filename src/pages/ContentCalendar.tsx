import { useEffect, useMemo, useState } from "react";
import { ConsolePage } from "@/components/console/ConsolePage";
import { Button } from "@/components/ui/button";
import { CycleContextBar, FunnelLayerBadge, ApprovalStatusBadge } from "@/components/console/StudioPrimitives";
import { supabase } from "@/integrations/supabase/client";
import { useResolvedClientId } from "@/hooks/useResolvedClientId";

const funnelLayers = ["attraction", "nurture", "conversion"];

export default function ContentCalendar() {
  const clientId = useResolvedClientId();
  const [cycles, setCycles] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const activeCycle = useMemo(() => cycles.find((cycle) => cycle.status === 'active') ?? cycles[0] ?? null, [cycles]);

  const dayCells = useMemo(() => {
    if (!activeCycle?.start_date) return [];
    const start = new Date(`${activeCycle.start_date}T00:00:00`);
    return Array.from({ length: 14 }, (_, index) => {
      const date = new Date(start);
      date.setDate(date.getDate() + index);
      const dayKey = date.toISOString().slice(0, 10);
      const byLayer = Object.fromEntries(funnelLayers.map((layer) => [layer, entries.filter((entry) => entry.scheduled_date === dayKey && entry.funnel_layer === layer)]));
      return { date, dayKey, byLayer };
    });
  }, [activeCycle, entries]);

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

      <CycleContextBar
        cycleLabel={activeCycle ? `Cycle ${activeCycle.cycle_number} · ${activeCycle.start_date} → ${activeCycle.end_date}` : "No active cycle"}
        daysRemaining={activeCycle ? Math.max(0, Math.ceil((new Date(activeCycle.end_date).getTime() - Date.now()) / 86400000)) : null}
      />

      <section className="aa-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-medium text-foreground">{activeCycle ? `Cycle ${activeCycle.cycle_number}` : 'No active cycle'}</div>
            <div className="text-sm text-muted-foreground">{activeCycle ? `${activeCycle.start_date} → ${activeCycle.end_date}` : 'Create a cycle to begin scheduling.'}</div>
          </div>
          <Button onClick={closeCycle} disabled={!activeCycle}>Close cycle</Button>
        </div>
      </section>

      <section className="aa-card space-y-4 overflow-auto">
        <h2 className="text-lg font-semibold text-foreground">14-day grid</h2>
        {dayCells.length ? (
          <div className="min-w-[1100px] space-y-3">
            <div className="grid grid-cols-[140px_repeat(14,minmax(140px,1fr))] gap-2 text-xs text-muted-foreground">
              <div />
              {dayCells.map((cell) => <div key={cell.dayKey} className="rounded-lg border border-border p-2 text-center">{cell.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>)}
            </div>
            {funnelLayers.map((layer) => (
              <div key={layer} className="grid grid-cols-[140px_repeat(14,minmax(140px,1fr))] gap-2 items-stretch">
                <div className="flex items-center rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground">
                  <FunnelLayerBadge layer={layer} />
                </div>
                {dayCells.map((cell) => {
                  const items = cell.byLayer[layer as keyof typeof cell.byLayer] as any[];
                  return (
                    <div key={`${layer}-${cell.dayKey}`} className="min-h-28 rounded-xl border border-border bg-background p-2 space-y-2">
                      {items.length ? items.map((item) => (
                        <div key={item.id} className="rounded-lg border border-border bg-muted/40 p-2 text-xs space-y-1">
                          <div className="flex items-center justify-between gap-2"><ApprovalStatusBadge status={item.publish_status} /><span className="text-muted-foreground">{item.format || item.platform}</span></div>
                          <div className="line-clamp-3 text-foreground">{item.content_type}</div>
                        </div>
                      )) : <div className="text-xs text-muted-foreground">Empty</div>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No calendar entries yet.</div>
        )}
      </section>
    </div>
  );
}
