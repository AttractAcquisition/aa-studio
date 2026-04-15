import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConsolePage } from "@/components/console/ConsolePage";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useResolvedClientId } from "@/hooks/useResolvedClientId";

const objectives = ["attraction", "nurture", "conversion"] as const;

export default function AdCreativeBriefs() {
  const clientId = useResolvedClientId();
  const navigate = useNavigate();
  const [activeObjective, setActiveObjective] = useState<(typeof objectives)[number]>("attraction");
  const [placement, setPlacement] = useState("all");
  const [variantCount, setVariantCount] = useState("2");
  const [assets, setAssets] = useState<any[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [briefs, setBriefs] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!clientId) return;
    const [{ data: assetRows }, { data: briefRows }] = await Promise.all([
      supabase.from("proof_assets").select("*").eq("client_id", clientId).order("proof_score", { ascending: false }),
      supabase.from("ad_creative_briefs").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
    ]);
    setAssets(assetRows ?? []);
    setBriefs(briefRows ?? []);
  };

  useEffect(() => { void load(); }, [clientId]);

  const filtered = useMemo(() => briefs.filter((brief) => brief.campaign_objective === activeObjective), [briefs, activeObjective]);

  const sendToApproval = async (brief: any) => {
    if (!clientId) return;
    const { data: queueEntry, error } = await supabase.from("approval_queue").insert({
      client_id: clientId,
      cycle_id: brief.cycle_id ?? null,
      content_type: "ad_brief",
      content_id: brief.id,
      reviewer_type: "internal",
      status: "pending",
    }).select("*").single();
    if (error) throw error;
    await supabase.from("ad_creative_briefs").update({ status: "in_review", approval_queue_id: queueEntry.id, updated_at: new Date().toISOString() }).eq("id", brief.id);
    const { data: refreshed } = await supabase.from("ad_creative_briefs").select("*").eq("client_id", clientId).order("created_at", { ascending: false });
    setBriefs(refreshed ?? []);
  };

  const generate = async () => {
    if (!clientId) return;
    setLoading(true);
    setMessage(null);
    try {
      const result = await supabase.functions.invoke("generate-ad-creative-briefs", {
        body: { client_id: clientId, campaign_objective: activeObjective, asset_ids: selectedAssets, placement, variant_count: Number(variantCount) || 2, cycle_id: null },
      });
      if (result.error) throw result.error;
      await load();
      setMessage("Ad creative briefs generated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  const exportPack = async () => {
    if (!clientId) return;
    setLoading(true);
    setMessage(null);
    try {
      const result = await supabase.functions.invoke("export-ad-brief-pack", { body: { client_id: clientId, cycle_id: null } });
      if (result.error) throw result.error;
      setMessage("Approved ad briefs exported.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <ConsolePage eyebrow="Ad Creative Briefs" title="Ad Creative Briefs" description="Build paid creative briefs for AdCreative AI and export approved briefs." />

      {message ? <div className="aa-card text-sm text-muted-foreground">{message}</div> : null}

      <div className="flex flex-wrap gap-2">
        {objectives.map((objective) => (
          <Button key={objective} variant={objective === activeObjective ? "default" : "secondary"} onClick={() => setActiveObjective(objective)}>
            {objective}
          </Button>
        ))}
      </div>

      <section className="aa-card space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Generate briefs</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SelectField label="Placement" value={placement} onChange={setPlacement} options={["feed", "stories", "reels", "all"]} />
          <div className="space-y-2">
            <Label>Variant count</Label>
            <Input type="number" value={variantCount} onChange={(e) => setVariantCount(e.target.value)} />
          </div>
          <div className="flex items-end"><Button onClick={generate} disabled={loading}>{loading ? "Generating…" : "Generate briefs"}</Button></div>
          <div className="flex items-end"><Button variant="secondary" onClick={exportPack} disabled={loading}>{loading ? "Exporting…" : "Export approved briefs"}</Button></div>
        </div>
        <div className="space-y-2">
          <Label>Proof assets</Label>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {assets.map((asset) => (
              <label key={asset.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <Checkbox checked={selectedAssets.includes(asset.id)} onCheckedChange={(checked) => setSelectedAssets((prev) => checked ? [...prev, asset.id] : prev.filter((id) => id !== asset.id))} />
                <div>
                  <div className="text-sm text-foreground">{asset.asset_tag || 'proof'}</div>
                  <div className="text-xs text-muted-foreground">{asset.proof_score ?? 0}/10</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="aa-card space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Current {activeObjective} briefs</h2>
        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.length ? filtered.map((brief) => (
            <article key={brief.id} className="rounded-xl border border-border bg-background p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium text-foreground">Variant {brief.variant_index}</div>
                <div className="text-xs text-muted-foreground">{brief.status}</div>
              </div>
              <div className="text-sm text-foreground">{brief.primary_text}</div>
              <div className="text-sm text-muted-foreground">{brief.visual_direction}</div>
              <div className="text-sm text-foreground"><span className="text-muted-foreground">CTA:</span> {brief.cta_copy}</div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => void sendToApproval(brief)} disabled={brief.status === 'in_review' || brief.status === 'approved' || brief.status === 'exported'}>Send to Approval</Button>
                <Button variant="ghost" onClick={() => navigate(`/clients/${clientId}/approval-queue`)}>Open Approval Queue</Button>
              </div>
            </article>
          )) : <div className="text-sm text-muted-foreground">No briefs yet for this objective.</div>}
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
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}
