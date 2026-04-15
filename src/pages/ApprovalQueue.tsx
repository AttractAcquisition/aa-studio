import { useEffect, useState } from "react";
import { ConsolePage } from "@/components/console/ConsolePage";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useResolvedClientId } from "@/hooks/useResolvedClientId";

export default function ApprovalQueue() {
  const clientId = useResolvedClientId();
  const { user } = useAuth();
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

  const setStatus = async (item: any, status: string) => {
    const updatePayload: Record<string, any> = { status, updated_at: new Date().toISOString() };
    if (status === 'approved') {
      updatePayload.approved_at = new Date().toISOString();
      updatePayload.approved_by = user?.id ?? null;
    }
    await supabase.from("approval_queue").update(updatePayload).eq("id", item.id);

    if (item.content_type === 'organic_post') {
      if (status === 'approved') {
        await supabase.from("organic_posts").update({ status: 'approved', updated_at: new Date().toISOString() }).eq("id", item.content_id);
        const { data: post } = await supabase.from("organic_posts").select("*").eq("id", item.content_id).maybeSingle();
        if (post) {
          const { data: existing } = await supabase.from("content_calendar_entries").select("id").eq("content_type", 'organic_post').eq("content_id", item.content_id).maybeSingle();
          if (!existing) {
            await supabase.from("content_calendar_entries").insert({
              client_id: item.client_id,
              cycle_id: item.cycle_id,
              content_type: 'organic_post',
              content_id: item.content_id,
              funnel_layer: post.funnel_layer,
              format: post.content_format,
              publish_status: 'scheduled',
              platform: 'instagram',
            });
          }
        }
      } else if (status === 'revision_requested') {
        await supabase.from("organic_posts").update({ status: 'draft', updated_at: new Date().toISOString() }).eq("id", item.content_id);
      } else if (status === 'rejected') {
        await supabase.from("organic_posts").update({ status: 'rejected', updated_at: new Date().toISOString() }).eq("id", item.content_id);
      }
    }

    if (item.content_type === 'ad_brief') {
      await supabase.from("ad_creative_briefs").update({ status: status === 'approved' ? 'approved' : status === 'revision_requested' ? 'draft' : 'rejected', updated_at: new Date().toISOString() }).eq("id", item.content_id);
    }

    if (item.content_type === 'profile_build') {
      await supabase.from("profile_builds").update({ status: status === 'approved' ? 'approved' : 'draft', updated_at: new Date().toISOString() }).eq("id", item.content_id);
    }

    if (item.content_type === 'positioning_doc') {
      await supabase.from("positioning_documents").update({ status: status === 'approved' ? 'approved' : status === 'revision_requested' ? 'draft' : 'archived', updated_at: new Date().toISOString() }).eq("id", item.content_id);
      if (status === 'approved') {
        await supabase.functions.invoke("assemble-client-context", { body: { client_id: item.client_id } });
      }
    }

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
              <Button variant="secondary" onClick={() => void setStatus(item, 'approved')}>Approve</Button>
              <Button variant="secondary" onClick={() => void setStatus(item, 'revision_requested')}>Request revision</Button>
              <Button variant="destructive" onClick={() => void setStatus(item, 'rejected')}>Reject</Button>
            </div>
          </article>
        )) : <div className="aa-card text-sm text-muted-foreground">No approval queue items.</div>}
      </section>
    </div>
  );
}
