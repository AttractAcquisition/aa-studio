import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConsolePage } from "@/components/console/ConsolePage";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useResolvedClientId } from "@/hooks/useResolvedClientId";

const docTypes = ["attraction", "nurture", "conversion"] as const;

type DocType = (typeof docTypes)[number];

export default function PositioningStudio() {
  const clientId = useResolvedClientId();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DocType>("attraction");
  const [docs, setDocs] = useState<any[]>([]);
  const [proofAssets, setProofAssets] = useState<any[]>([]);
  const [selectedProofs, setSelectedProofs] = useState<string[]>([]);
  const [primaryObjection, setPrimaryObjection] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!clientId) return;
      const [{ data: docRows }, { data: proofRows }] = await Promise.all([
        supabase.from("positioning_documents").select("*").eq("client_id", clientId).order("version", { ascending: false }),
        supabase.from("proof_assets").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
      ]);
      setDocs(docRows ?? []);
      setProofAssets(proofRows ?? []);
    };
    void load();
  }, [clientId]);

  const activeDocs = useMemo(() => docs.filter((doc) => doc.doc_type === activeTab), [docs, activeTab]);
  const latestDoc = activeDocs[0];

  const sendToApproval = async (doc: any) => {
    if (!clientId) return;
    const { data: queueEntry, error } = await supabase.from("approval_queue").insert({
      client_id: clientId,
      content_type: "positioning_doc",
      content_id: doc.id,
      reviewer_type: "internal",
      status: "pending",
    }).select("*").single();
    if (error) throw error;
    await supabase.from("positioning_documents").update({ status: "in_review", updated_at: new Date().toISOString() }).eq("id", doc.id);
    await supabase.functions.invoke("run-approval-checks", { body: { client_id: clientId, content_type: "positioning_doc", content_id: doc.id } });
    const { data: refreshed } = await supabase.from("positioning_documents").select("*").eq("client_id", clientId).order("version", { ascending: false });
    setDocs(refreshed ?? []);
  };

  const approve = async (doc: any) => {
    if (!clientId) return;
    await supabase.from("positioning_documents").update({ status: "approved", approved_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", doc.id);
    const { data: refreshed } = await supabase.from("positioning_documents").select("*").eq("client_id", clientId).order("version", { ascending: false });
    setDocs(refreshed ?? []);
    await supabase.functions.invoke("assemble-client-context", { body: { client_id: clientId } });
  };

  const generate = async () => {
    if (!clientId) return;
    setLoading(true);
    setMessage(null);
    try {
      const result = await supabase.functions.invoke("generate-positioning-document", {
        body: { client_id: clientId, doc_type: activeTab, primary_objection: primaryObjection, proof_point_ids: selectedProofs },
      });
      if (result.error) throw result.error;
      const { data: refreshed } = await supabase.from("positioning_documents").select("*").eq("client_id", clientId).order("version", { ascending: false });
      setDocs(refreshed ?? []);
      setMessage("Positioning document generated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <ConsolePage eyebrow="Positioning Studio" title="Positioning Studio" description="Create attraction, nurture, and conversion positioning docs for the current client." />

      {message ? <div className="aa-card text-sm text-muted-foreground">{message}</div> : null}

      <div className="flex gap-2 flex-wrap">
        {docTypes.map((docType) => (
          <Button key={docType} variant={activeTab === docType ? "default" : "secondary"} onClick={() => setActiveTab(docType)}>
            {docType}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <section className="aa-card space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Generate new version</h2>
            {activeTab === "conversion" ? (
              <div className="space-y-2">
                <Label>Primary objection to address</Label>
                <Textarea value={primaryObjection} onChange={(e) => setPrimaryObjection(e.target.value)} />
              </div>
            ) : null}
            <div className="space-y-3">
              <Label>Proof points to emphasise</Label>
              <div className="space-y-2">
                {proofAssets.map((asset) => (
                  <label key={asset.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                    <Checkbox checked={selectedProofs.includes(asset.id)} onCheckedChange={(checked) => {
                      setSelectedProofs((prev) => checked ? [...prev, asset.id] : prev.filter((id) => id !== asset.id));
                    }} />
                    <span className="text-sm text-foreground">{asset.asset_tag || "proof"} · {asset.job_type || asset.file_type || asset.id}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button onClick={generate} disabled={loading}>{loading ? "Generating…" : "Generate positioning document"}</Button>
          </section>

          <section className="aa-card space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Version history</h2>
            <div className="space-y-2">
              {activeDocs.length ? activeDocs.map((doc) => (
                <div key={doc.id} className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium text-foreground">Version {doc.version}</div>
                      <div className="text-sm text-muted-foreground">{doc.status}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleString()}</div>
                  </div>
                </div>
              )) : <div className="text-sm text-muted-foreground">No documents yet.</div>}
            </div>
          </section>
        </div>

        <section className="aa-card space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">Latest {activeTab} document</h2>
            <span className="text-xs text-muted-foreground">{latestDoc?.status || "none"}</span>
          </div>
          <pre className="overflow-auto rounded-xl bg-muted p-4 text-xs text-muted-foreground">{JSON.stringify(latestDoc?.content ?? {}, null, 2)}</pre>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => void sendToApproval(latestDoc)} disabled={!latestDoc}>Send to Approval</Button>
            <Button variant="secondary" onClick={() => void approve(latestDoc)} disabled={!latestDoc}>Approve</Button>
            <Button variant="ghost" onClick={() => navigate(`/clients/${clientId}/approval-queue`)}>Open Approval Queue</Button>
          </div>
        </section>
      </div>
    </div>
  );
}
