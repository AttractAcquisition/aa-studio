import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ConsolePage } from "@/components/console/ConsolePage";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";

export default function ProfileBuilder() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [proofAssets, setProofAssets] = useState<any[]>([]);
  const [selectedProofs, setSelectedProofs] = useState<string[]>([]);
  const [objective, setObjective] = useState("whatsapp");
  const [destination, setDestination] = useState("");
  const [profile, setProfile] = useState<any | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!clientId) return;
      const [{ data: proofRows }, { data: profileRows }] = await Promise.all([
        supabase.from("proof_assets").select("*").eq("client_id", clientId).order("proof_score", { ascending: false }),
        supabase.from("profile_builds").select("*").eq("client_id", clientId).order("version", { ascending: false }).limit(1),
      ]);
      setProofAssets(proofRows ?? []);
      setProfile(profileRows?.[0] ?? null);
    };
    void load();
  }, [clientId]);

  const sendToApproval = async () => {
    if (!clientId || !profile) return;
    const { data: queueEntry, error } = await supabase.from("approval_queue").insert({
      client_id: clientId,
      content_type: "profile_build",
      content_id: profile.id,
      reviewer_type: "internal",
      status: "pending",
    }).select("*").single();
    if (error) throw error;
    await supabase.from("profile_builds").update({ status: "in_review", approval_queue_id: queueEntry.id, updated_at: new Date().toISOString() }).eq("id", profile.id);
    await supabase.functions.invoke("run-approval-checks", { body: { client_id: clientId, content_type: "profile_build", content_id: profile.id } });
    const { data: refreshed } = await supabase.from("profile_builds").select("*").eq("client_id", clientId).order("version", { ascending: false }).limit(1);
    setProfile(refreshed?.[0] ?? null);
  };

  const approve = async () => {
    if (!clientId || !profile) return;
    await supabase.from("profile_builds").update({ status: "approved", updated_at: new Date().toISOString() }).eq("id", profile.id);
    if (profile.approval_queue_id) {
      await supabase.from("approval_queue").update({ status: "approved", approved_at: new Date().toISOString() }).eq("id", profile.approval_queue_id);
    }
    const { data: refreshed } = await supabase.from("profile_builds").select("*").eq("client_id", clientId).order("version", { ascending: false }).limit(1);
    setProfile(refreshed?.[0] ?? null);
  };

  const generate = async () => {
    if (!clientId) return;
    setLoading(true);
    setMessage(null);
    try {
      const result = await supabase.functions.invoke("generate-profile-build", {
        body: { client_id: clientId, conversion_objective: objective, top_proof_point_ids: selectedProofs, link_destination: destination },
      });
      if (result.error) throw result.error;
      const { data: refreshed } = await supabase.from("profile_builds").select("*").eq("client_id", clientId).order("version", { ascending: false }).limit(1);
      setProfile(refreshed?.[0] ?? null);
      setMessage("Profile build generated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <ConsolePage eyebrow="Profile Builder" title="Profile Builder" description="Build the profile infrastructure that the client launches with." />

      {message ? <div className="aa-card text-sm text-muted-foreground">{message}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="aa-card space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Generate profile build</h2>
          <div className="space-y-2">
            <Label>Conversion objective</Label>
            <Input value={objective} onChange={(e) => setObjective(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Link-in-bio destination</Label>
            <Input value={destination} onChange={(e) => setDestination(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Proof assets</Label>
            <div className="space-y-2">
              {proofAssets.map((asset) => (
                <label key={asset.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <Checkbox checked={selectedProofs.includes(asset.id)} onCheckedChange={(checked) => setSelectedProofs((prev) => checked ? [...prev, asset.id] : prev.filter((id) => id !== asset.id))} />
                  <span className="text-sm text-foreground">{asset.asset_tag || 'proof'} · {asset.proof_score ?? 0}/10</span>
                </label>
              ))}
            </div>
          </div>
          <Button onClick={generate} disabled={loading}>{loading ? "Generating…" : "Generate profile build"}</Button>
        </section>

        <section className="aa-card space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Latest profile build</h2>
          <pre className="overflow-auto rounded-xl bg-muted p-4 text-xs text-muted-foreground">{JSON.stringify(profile ?? {}, null, 2)}</pre>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => void sendToApproval()} disabled={!profile}>Send to Approval</Button>
            <Button variant="secondary" onClick={() => void approve()} disabled={!profile}>Approve</Button>
            <Button variant="ghost" onClick={() => navigate(`/clients/${clientId}/approval-queue`)}>Open Approval Queue</Button>
          </div>
        </section>
      </div>
    </div>
  );
}
