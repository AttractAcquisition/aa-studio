import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ConsolePage } from "@/components/console/ConsolePage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export default function ScriptLibrary() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [scripts, setScripts] = useState<any[]>([]);
  const [objective, setObjective] = useState("attraction");
  const [contentType, setContentType] = useState("post");
  const [toneVariant, setToneVariant] = useState("proof");
  const [platform, setPlatform] = useState("all");
  const [count, setCount] = useState("6");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!clientId) return;
      const { data } = await supabase.from("scripts").select("*").eq("client_id", clientId).eq("status", "active").order("psychological_alignment_score", { ascending: false });
      setScripts(data ?? []);
    };
    void load();
  }, [clientId]);

  const filtered = useMemo(() => scripts, [scripts]);

  const archiveScript = async (scriptId: string) => {
    if (!clientId) return;
    await supabase.from("scripts").update({ status: "archived", updated_at: new Date().toISOString() }).eq("id", scriptId);
    const { data: refreshed } = await supabase.from("scripts").select("*").eq("client_id", clientId).eq("status", "active").order("psychological_alignment_score", { ascending: false });
    setScripts(refreshed ?? []);
  };

  const generate = async () => {
    if (!clientId) return;
    setLoading(true);
    setMessage(null);
    try {
      const result = await supabase.functions.invoke("generate-scripts", {
        body: { client_id: clientId, objective, content_type: contentType, tone_variant: toneVariant, platform, count: Number(count) || 6 },
      });
      if (result.error) throw result.error;
      const { data: refreshed } = await supabase.from("scripts").select("*").eq("client_id", clientId).eq("status", "active").order("psychological_alignment_score", { ascending: false });
      setScripts(refreshed ?? []);
      setMessage("Scripts generated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <ConsolePage eyebrow="Script Library" title="Script Library" description="Generate and manage scripts for attraction, nurture, and conversion." />

      {message ? <div className="aa-card text-sm text-muted-foreground">{message}</div> : null}

      <section className="aa-card space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Generate scripts</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SelectField label="Objective" value={objective} onChange={setObjective} options={["attraction", "nurture", "conversion"]} />
          <SelectField label="Content type" value={contentType} onChange={setContentType} options={["static_ad", "post", "reel", "story", "carousel"]} />
          <SelectField label="Tone variant" value={toneVariant} onChange={setToneVariant} options={["proof", "authority", "urgency", "social_proof"]} />
          <SelectField label="Platform" value={platform} onChange={setPlatform} options={["feed", "stories", "reels", "all"]} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Count</Label>
            <Input type="number" value={count} onChange={(e) => setCount(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={generate} disabled={loading}>{loading ? "Generating…" : "Generate scripts"}</Button>
          </div>
        </div>
      </section>

      <section className="aa-card space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Active scripts</h2>
        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.length ? filtered.map((script) => (
            <article key={script.id} className="rounded-xl border border-border bg-background p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-foreground">{script.hook_text}</div>
                  <div className="text-xs text-muted-foreground">{script.objective} · {script.content_type} · {script.platform}</div>
                </div>
                <div className="text-sm text-primary">{script.psychological_alignment_score ?? 0}/100</div>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{script.body_text}</p>
              <div className="text-sm text-foreground"><span className="text-muted-foreground">CTA:</span> {script.cta_text}</div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => navigate(`/clients/${clientId}/organic-studio?script=${script.id}`)}>Use in Organic Studio</Button>
                <Button variant="secondary" onClick={() => navigate(`/clients/${clientId}/ad-briefs?script=${script.id}`)}>Use in Ad Brief</Button>
                <Button variant="ghost" onClick={() => void archiveScript(script.id)}>Archive</Button>
              </div>
            </article>
          )) : <div className="text-sm text-muted-foreground">No scripts yet.</div>}
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
