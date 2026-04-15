import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ConsolePage } from "@/components/console/ConsolePage";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export default function ApprovalQueue() {
  const { clientId } = useParams();
  const [items, setItems] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!clientId) return;
    const { data } = await supabase.from("approval_queue").select("*").eq("client_id", clientId).order("created_at", { ascending: false });
    setItems(data ?? []);
  };

  useEffect(() => { void load(); }, [clientId]);

  const runChecks = async (item: any) => {
    setLoading(true);
    setMessage(null);
    try {
      const result = await supabase.functions.invoke("run-approval-checks", { body: { client_id: clientId, content_type: item.content_type, content_id: item.content_id } });
      if (result.error) throw result.error;
      await load();
      setMessage("Approval checks updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  const setStatus = async (itemId: string, status: string) => {
    await supabase.from("approval_queue").update({ status, updated_at: new Date().toISOString() }).eq("id", itemId);
    await load();
  };

  return (
    <div className="space-y-8">
      <ConsolePage eyebrow="Approval Queue" title="Approval Queue" description="Review, score, and approve content before it moves to the next stage." />

      {message ? <div className="aa-card text-sm text-muted-foreground">{message}</div> : null}

      <section className="aa-card space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2 min-w-[220px]"><Label>Status</Label><Select defaultValue="pending"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['all','pending','in_review','approved','revision_requested','rejected'].map((v)=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2 min-w-[220px]"><Label>Content type</Label><Select defaultValue="all"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['all','organic_post','ad_brief','profile_build','positioning_doc'].map((v)=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
        </div>
      </section>

      <section className="space-y-4">
        {items.length ? items.map((item) => (
          <article key={item.id} className="aa-card space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-medium text-foreground">{item.content_type}</div>
                <div className="text-xs text-muted-foreground">{item.status} · {item.reviewer_type || 'internal'}</div>
              </div>
              <div className="text-sm text-primary">{item.approval_readiness_score ?? 0}/100</div>
            </div>
            <pre className="overflow-auto rounded-xl bg-muted p-4 text-xs text-muted-foreground">{JSON.stringify(item, null, 2)}</pre>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => runChecks(item)} disabled={loading}>{loading ? "Checking…" : "Run checks"}</Button>
              <Button variant="secondary" onClick={() => setStatus(item.id, 'approved')}>Approve</Button>
              <Button variant="secondary" onClick={() => setStatus(item.id, 'revision_requested')}>Request revision</Button>
              <Button variant="destructive" onClick={() => setStatus(item.id, 'rejected')}>Reject</Button>
            </div>
          </article>
        )) : <div className="aa-card text-sm text-muted-foreground">No approval queue items.</div>}
      </section>
    </div>
  );
}
