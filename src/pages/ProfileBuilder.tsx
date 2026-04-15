import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ConsolePage } from "@/components/console/ConsolePage";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";

export default function ProfileBuilder() {
  const { clientId } = useParams();
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
        </section>
      </div>
    </div>
  );
}
