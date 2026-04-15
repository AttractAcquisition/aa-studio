import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConsolePage } from "@/components/console/ConsolePage";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useResolvedClientId } from "@/hooks/useResolvedClientId";

export default function OrganicContentStudio() {
  const clientId = useResolvedClientId();
  const navigate = useNavigate();
  const [cycleId, setCycleId] = useState<string | null>(null);
  const [funnelLayer, setFunnelLayer] = useState("attraction");
  const [contentFormat, setContentFormat] = useState("feed_post");
  const [proofAssets, setProofAssets] = useState<any[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!clientId) return;
      const [{ data: cycleRows }, { data: proofRows }, { data: postRows }] = await Promise.all([
        supabase.from("cycles").select("*").eq("client_id", clientId).eq("status", "active").order("cycle_number", { ascending: false }).limit(1),
        supabase.from("proof_assets").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
        supabase.from("organic_posts").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
      ]);
      setCycleId(cycleRows?.[0]?.id ?? null);
      setProofAssets(proofRows ?? []);
      setPosts(postRows ?? []);
    };
    void load();
  }, [clientId]);

  const selectedProofRows = useMemo(() => proofAssets.filter((asset) => selectedAssets.includes(asset.id)), [proofAssets, selectedAssets]);

  const sendToApproval = async (post: any) => {
    if (!clientId || !cycleId) return;
    const { data: queueEntry, error } = await supabase.from("approval_queue").insert({
      client_id: clientId,
      cycle_id: cycleId,
      content_type: "organic_post",
      content_id: post.id,
      reviewer_type: "internal",
      status: "pending",
    }).select("*").single();
    if (error) throw error;
    await supabase.from("organic_posts").update({ status: "in_review", approval_queue_id: queueEntry.id, updated_at: new Date().toISOString() }).eq("id", post.id);
    await supabase.functions.invoke("run-approval-checks", { body: { client_id: clientId, content_type: "organic_post", content_id: post.id } });
    const { data: refreshed } = await supabase.from("organic_posts").select("*").eq("client_id", clientId).order("created_at", { ascending: false });
    setPosts(refreshed ?? []);
  };

  const generate = async () => {
    if (!clientId) return;
    setLoading(true);
    setMessage(null);
    try {
      const result = await supabase.functions.invoke("generate-organic-post", {
        body: { client_id: clientId, cycle_id: cycleId, funnel_layer: funnelLayer, content_format: contentFormat, asset_ids: selectedAssets, week_number: 1 },
      });
      if (result.error) throw result.error;
      const { data: refreshed } = await supabase.from("organic_posts").select("*").eq("client_id", clientId).order("created_at", { ascending: false });
      setPosts(refreshed ?? []);
      setMessage("Organic post generated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <ConsolePage eyebrow="Organic Content Studio" title="Organic Content Studio" description="Create and manage the weekly organic content output for the active cycle." />

      {message ? <div className="aa-card text-sm text-muted-foreground">{message}</div> : null}

      <section className="aa-card space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Generate post</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SelectField label="Funnel layer" value={funnelLayer} onChange={setFunnelLayer} options={["attraction", "nurture", "conversion"]} />
          <SelectField label="Content format" value={contentFormat} onChange={setContentFormat} options={["feed_post", "carousel", "reel", "story"]} />
          <div className="space-y-2 flex items-end">
            <Button onClick={generate} disabled={loading}>{loading ? "Generating…" : "Generate post"}</Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Proof assets</Label>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {proofAssets.map((asset) => (
              <label key={asset.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <Checkbox checked={selectedAssets.includes(asset.id)} onCheckedChange={(checked) => setSelectedAssets((prev) => checked ? [...prev, asset.id] : prev.filter((id) => id !== asset.id))} />
                <div>
                  <div className="text-sm text-foreground">{asset.asset_tag || 'proof'}</div>
                  <div className="text-xs text-muted-foreground">{asset.proof_score ?? 0}/10</div>
                </div>
              </label>
            ))}
          </div>
          <div className="text-xs text-muted-foreground">Selected: {selectedProofRows.length}</div>
        </div>
      </section>

      <section className="aa-card space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Recent posts</h2>
        <div className="grid gap-4 xl:grid-cols-2">
          {posts.length ? posts.map((post) => (
            <article key={post.id} className="rounded-xl border border-border bg-background p-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium text-foreground">{post.content_format} · {post.funnel_layer}</div>
                <div className="text-xs text-muted-foreground">{post.status}</div>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{post.caption}</p>
              <div className="text-xs text-muted-foreground">Brand score: {post.brand_voice_score ?? 0}</div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => void sendToApproval(post)} disabled={post.status === 'in_review' || post.status === 'approved'}>Send to Approval</Button>
                <Button variant="ghost" onClick={() => navigate(`/clients/${clientId}/approval-queue`)}>Open Approval Queue</Button>
                <Button variant="ghost" onClick={() => navigate(`/clients/${clientId}/content-calendar`)}>View in Calendar</Button>
              </div>
            </article>
          )) : <div className="text-sm text-muted-foreground">No posts yet.</div>}
        </div>
      </section>
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
