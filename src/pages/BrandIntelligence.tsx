import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ConsolePage } from "@/components/console/ConsolePage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

type BrandRow = {
  business_name: string | null;
  sector: string | null;
  trade_type: string | null;
  location: string | null;
  service_radius_km: number | null;
  icp_demographics: Record<string, any> | null;
  icp_psychology: Record<string, any> | null;
  avg_job_value_zar: number | null;
  conversion_objective: string | null;
  brand_voice_descriptors: string[] | null;
  competitor_references: string[] | null;
  differentiation_notes: string | null;
  primary_hex: string | null;
  secondary_hex: string | null;
  font_selection: string | null;
  sample_copy: string | null;
  testimonials: any;
  logo_url: string | null;
  version: number | null;
  updated_at?: string | null;
};

const emptyForm = {
  business_name: "",
  sector: "",
  trade_type: "",
  location: "",
  service_radius_km: "30",
  avg_job_value_zar: "",
  conversion_objective: "whatsapp",
  brand_voice_descriptors: "",
  competitor_references: "",
  differentiation_notes: "",
  primary_hex: "#07100E",
  secondary_hex: "#00E5C3",
  font_selection: "DM Sans",
  sample_copy: "",
  icp_demographics: "{}",
  testimonials: "[]",
  logo_url: "",
};

export default function BrandIntelligence() {
  const { clientId } = useParams();
  const [form, setForm] = useState(emptyForm);
  const [row, setRow] = useState<BrandRow | null>(null);
  const [context, setContext] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!clientId) return;
      const [{ data: brand }, { data: ctx }] = await Promise.all([
        supabase.from("brand_intelligence").select("*").eq("client_id", clientId).maybeSingle(),
        supabase.from("client_ai_context").select("*").eq("client_id", clientId).maybeSingle(),
      ]);

      if (brand) {
        setRow(brand as BrandRow);
        setForm({
          business_name: brand.business_name ?? "",
          sector: brand.sector ?? "",
          trade_type: brand.trade_type ?? "",
          location: brand.location ?? "",
          service_radius_km: String(brand.service_radius_km ?? 30),
          avg_job_value_zar: String(brand.avg_job_value_zar ?? ""),
          conversion_objective: brand.conversion_objective ?? "whatsapp",
          brand_voice_descriptors: (brand.brand_voice_descriptors ?? []).join(", "),
          competitor_references: (brand.competitor_references ?? []).join(", "),
          differentiation_notes: brand.differentiation_notes ?? "",
          primary_hex: brand.primary_hex ?? "#07100E",
          secondary_hex: brand.secondary_hex ?? "#00E5C3",
          font_selection: brand.font_selection ?? "DM Sans",
          sample_copy: brand.sample_copy ?? "",
          icp_demographics: JSON.stringify(brand.icp_demographics ?? {}, null, 2),
          testimonials: JSON.stringify(brand.testimonials ?? [], null, 2),
          logo_url: brand.logo_url ?? "",
        });
      }

      if (ctx) setContext(ctx.context_json);
    };

    void load();
  }, [clientId]);

  const parsedDemographics = useMemo(() => {
    try { return JSON.parse(form.icp_demographics || "{}"); } catch { return {}; }
  }, [form.icp_demographics]);

  const parsedTestimonials = useMemo(() => {
    try { return JSON.parse(form.testimonials || "[]"); } catch { return []; }
  }, [form.testimonials]);

  const update = (key: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    if (!clientId) return;
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        client_id: clientId,
        business_name: form.business_name || null,
        sector: form.sector || null,
        trade_type: form.trade_type || null,
        location: form.location || null,
        service_radius_km: form.service_radius_km ? Number(form.service_radius_km) : null,
        icp_demographics: parsedDemographics,
        avg_job_value_zar: form.avg_job_value_zar ? Number(form.avg_job_value_zar) : null,
        conversion_objective: form.conversion_objective || null,
        brand_voice_descriptors: form.brand_voice_descriptors.split(",").map((item) => item.trim()).filter(Boolean),
        competitor_references: form.competitor_references.split(",").map((item) => item.trim()).filter(Boolean),
        differentiation_notes: form.differentiation_notes || null,
        primary_hex: form.primary_hex || null,
        secondary_hex: form.secondary_hex || null,
        font_selection: form.font_selection || null,
        sample_copy: form.sample_copy || null,
        testimonials: parsedTestimonials,
        logo_url: form.logo_url || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("brand_intelligence").upsert(payload, { onConflict: "client_id" });
      if (error) throw error;

      const ctx = await supabase.functions.invoke("assemble-client-context", { body: { client_id: clientId } });
      if (ctx.error) throw ctx.error;

      const { data: refreshed } = await supabase.from("brand_intelligence").select("*").eq("client_id", clientId).maybeSingle();
      if (refreshed) setRow(refreshed as BrandRow);

      const { data: ctxRow } = await supabase.from("client_ai_context").select("*").eq("client_id", clientId).maybeSingle();
      if (ctxRow) setContext(ctxRow.context_json);

      setMessage("Brand Intelligence saved and client context assembled.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  };

  const generateIcp = async () => {
    if (!clientId) return;
    setGenerating(true);
    setMessage(null);
    try {
      const result = await supabase.functions.invoke("generate-icp-profile", {
        body: {
          client_id: clientId,
          demographics: parsedDemographics,
          voice_descriptors: form.brand_voice_descriptors.split(",").map((item) => item.trim()).filter(Boolean),
          sector: form.sector,
          location: form.location,
          avg_job_value_zar: form.avg_job_value_zar ? Number(form.avg_job_value_zar) : null,
        },
      });
      if (result.error) throw result.error;

      const { data: refreshed } = await supabase.from("brand_intelligence").select("*").eq("client_id", clientId).maybeSingle();
      if (refreshed) {
        setRow(refreshed as BrandRow);
        setForm((prev) => ({ ...prev, icp_demographics: JSON.stringify(refreshed.icp_demographics ?? {}, null, 2) }));
      }
      setMessage("ICP profile generated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <ConsolePage
        eyebrow="Brand Intelligence"
        title="Brand Intelligence"
        description="Capture the brand, ICP, and positioning inputs that drive every downstream generation step."
      />

      {message ? <div className="aa-card text-sm text-muted-foreground">{message}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <section className="aa-card space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Business basics</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Business name" value={form.business_name} onChange={(value) => update("business_name", value)} />
              <Field label="Sector" value={form.sector} onChange={(value) => update("sector", value)} />
              <Field label="Trade type" value={form.trade_type} onChange={(value) => update("trade_type", value)} />
              <Field label="Location" value={form.location} onChange={(value) => update("location", value)} />
              <Field label="Service radius km" value={form.service_radius_km} onChange={(value) => update("service_radius_km", value)} type="number" />
              <Field label="Avg job value (ZAR)" value={form.avg_job_value_zar} onChange={(value) => update("avg_job_value_zar", value)} type="number" />
              <Field label="Conversion objective" value={form.conversion_objective} onChange={(value) => update("conversion_objective", value)} />
              <Field label="Font selection" value={form.font_selection} onChange={(value) => update("font_selection", value)} />
            </div>
          </section>

          <section className="aa-card space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Brand & voice</h2>
            <TextareaField label="Brand voice descriptors (comma separated)" value={form.brand_voice_descriptors} onChange={(value) => update("brand_voice_descriptors", value)} />
            <TextareaField label="Competitor references" value={form.competitor_references} onChange={(value) => update("competitor_references", value)} />
            <TextareaField label="Differentiation notes" value={form.differentiation_notes} onChange={(value) => update("differentiation_notes", value)} />
            <TextareaField label="Sample copy" value={form.sample_copy} onChange={(value) => update("sample_copy", value)} />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Primary hex" value={form.primary_hex} onChange={(value) => update("primary_hex", value)} />
              <Field label="Secondary hex" value={form.secondary_hex} onChange={(value) => update("secondary_hex", value)} />
            </div>
          </section>

          <section className="aa-card space-y-4">
            <h2 className="text-lg font-semibold text-foreground">ICP & proof</h2>
            <TextareaField label="ICP demographics JSON" value={form.icp_demographics} onChange={(value) => update("icp_demographics", value)} rows={8} />
            <TextareaField label="Testimonials JSON" value={form.testimonials} onChange={(value) => update("testimonials", value)} rows={8} />
            <Field label="Logo URL" value={form.logo_url} onChange={(value) => update("logo_url", value)} />
            <div className="flex flex-wrap gap-3">
              <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Brand Intelligence"}</Button>
              <Button variant="secondary" onClick={generateIcp} disabled={generating}>{generating ? "Generating…" : "Generate ICP"}</Button>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="aa-card space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Latest saved data</h2>
            <pre className="overflow-auto rounded-xl bg-muted p-4 text-xs text-muted-foreground">{JSON.stringify(row ?? {}, null, 2)}</pre>
          </section>

          <section className="aa-card space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Client AI context</h2>
            <pre className="overflow-auto rounded-xl bg-muted p-4 text-xs text-muted-foreground">{JSON.stringify(context ?? {}, null, 2)}</pre>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function TextareaField({ label, value, onChange, rows = 5 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
