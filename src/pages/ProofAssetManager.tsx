import { useEffect, useMemo, useState } from "react";
import { ConsolePage } from "@/components/console/ConsolePage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useResolvedClientId } from "@/hooks/useResolvedClientId";

export default function ProofAssetManager() {
  const clientId = useResolvedClientId();
  const [assets, setAssets] = useState<any[]>([]);
  const [tagFilter, setTagFilter] = useState("All");
  const [sort, setSort] = useState("Newest");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!clientId) return;
      const { data } = await supabase.from("proof_assets").select("*").eq("client_id", clientId).order("created_at", { ascending: false });
      setAssets(data ?? []);
    };
    void load();
  }, [clientId]);

  const filtered = useMemo(() => {
    let rows = [...assets];
    if (tagFilter !== "All") rows = rows.filter((asset) => (asset.asset_tag ?? "").toLowerCase() === tagFilter.toLowerCase());
    if (sort === "Highest Score") rows.sort((a, b) => (b.proof_score ?? 0) - (a.proof_score ?? 0));
    return rows;
  }, [assets, tagFilter, sort]);

  const upload = async (file: File) => {
    if (!clientId) return;
    setUploading(true);
    setMessage(null);
    try {
      const path = `${clientId}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("proof-assets").upload(path, file, { upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: signed } = await supabase.storage.from("proof-assets").createSignedUrl(path, 3600);
      const fileUrl = signed?.signedUrl ?? "";

      const { data: inserted, error } = await supabase.from("proof_assets").insert({
        client_id: clientId,
        file_url: fileUrl,
        storage_path: path,
        file_type: file.type.startsWith("video/") ? "video" : "photo",
        asset_tag: "proof",
        approval_status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).select("*").single();
      if (error) throw error;

      await supabase.functions.invoke("score-proof-assets", {
        body: { client_id: clientId, asset_id: inserted.id, file_url: fileUrl, asset_tag: inserted.asset_tag, job_type: inserted.job_type },
      });

      const { data: refreshed } = await supabase.from("proof_assets").select("*").eq("client_id", clientId).order("created_at", { ascending: false });
      setAssets(refreshed ?? []);
      setMessage("Proof asset uploaded and scored.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <ConsolePage eyebrow="Proof Asset Manager" title="Proof Asset Manager" description="Upload real client media and score it for content use." />

      {message ? <div className="aa-card text-sm text-muted-foreground">{message}</div> : null}

      <section className="aa-card space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Upload assets</h2>
        <Label className="block text-sm text-muted-foreground">Choose image or video files</Label>
        <Input type="file" accept="image/*,video/*" disabled={uploading} onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }} />
      </section>

      <section className="aa-card space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2 min-w-[220px]">
            <Label>Tag filter</Label>
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['All', 'proof', 'process', 'result', 'testimonial', 'team', 'before', 'after'].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 min-w-[220px]">
            <Label>Sort</Label>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Newest', 'Highest Score'].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.length ? filtered.map((asset) => (
            <article key={asset.id} className="rounded-xl border border-border bg-background p-4 space-y-3">
              {asset.file_type === 'video' ? (
                <video src={asset.file_url} controls className="h-48 w-full rounded-lg object-cover bg-black" />
              ) : (
                <img src={asset.file_url} alt={asset.alt_text || asset.asset_tag || 'proof asset'} className="h-48 w-full rounded-lg object-cover bg-muted" />
              )}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-foreground">{asset.asset_tag || 'proof'}</div>
                  <div className="text-xs text-muted-foreground">{asset.job_type || 'no job type'}</div>
                </div>
                <div className="text-sm text-primary">{asset.proof_score ?? 0}/10</div>
              </div>
              <p className="text-sm text-muted-foreground">{asset.ai_caption || 'No AI caption yet.'}</p>
            </article>
          )) : <div className="text-sm text-muted-foreground">No proof assets uploaded yet.</div>}
        </div>
      </section>
    </div>
  );
}
