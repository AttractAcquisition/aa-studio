import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  FileText,
  LayoutTemplate,
  Image,
  CheckCircle,
  AlertTriangle,
  Wand2,
  RefreshCw,
  Download,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTemplates } from "@/hooks/useTemplates";
import { useExports } from "@/hooks/useExports";
import { useToast } from "@/hooks/use-toast";
import { uploadBlobToBucket, createAssetRow } from "@/lib/supabase-helpers";
import { useAuth } from "@/hooks/useAuth";
import html2canvas from "html2canvas";

// ✅ Proper one-pager document layout
import { AaOnePagerDocument } from "@/components/onepager/AaOnePagerDocument";

const contentTypes = [
  { value: "attraction-psychology", label: "Attraction Psychology" },
  { value: "framework", label: "Framework" },
  { value: "service-in-action", label: "Service-in-Action" },
  { value: "proof", label: "Proof" },
  { value: "reel", label: "Reel" },
  { value: "carousel", label: "Carousel" },
];

const seriesList = [
  { value: "fix-my-funnel", label: "Fix My Funnel" },
  { value: "attraction-audit", label: "Attraction Audit" },
  { value: "unavoidable-brand", label: "Unavoidable Brand Model" },
  { value: "ad-creative", label: "Ad Creative That Converts" },
  { value: "noise-to-bookings", label: "Noise → Bookings" },
];

const steps = [
  { id: 1, title: "Input", icon: FileText },
  { id: 2, title: "Script", icon: Wand2 },
  { id: 3, title: "One-Pager", icon: LayoutTemplate },
  { id: 4, title: "Design", icon: Image },
];

type GenerateScriptResponse = {
  run_id: string;
  script_text?: string;
  script?: { text?: string };
  output?: { script?: { text?: string } };
  brief?: any;
  brief_json?: any;
  script_json?: any;
};

type GenerateOnePagerResponse = {
  run_id: string;
  one_pager_json?: any;
  one_pager_text?: string;
  error?: string;
  debug?: any;
};

function escapeHtml(s: string) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default function ContentFactory() {
  const { user, session } = useAuth() as any;
  const { toast } = useToast();
  const { templates } = useTemplates();
  const { createExport } = useExports();

  const [currentStep, setCurrentStep] = useState(1);

  // content_runs.id (run_id)
  const [contentItemId, setContentItemId] = useState<string | null>(null);

  const [contentType, setContentType] = useState("");
  const [series, setSeries] = useState("");
  const [hook, setHook] = useState("");
  const [audience, setAudience] = useState("Physical/local businesses");

  const [script, setScript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [onePagerBlocks, setOnePagerBlocks] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState("4:5");

  // Step 3: document ref (export + screenshot)
  const onePagerDocRef = useRef<HTMLDivElement>(null);

  // Step 4: design ref (existing export)
  const designRef = useRef<HTMLDivElement>(null);

  // Script word target
  const wordCount = script.trim().split(/\s+/).filter(Boolean).length;
  const isWordCountValid = wordCount >= 140 && wordCount <= 160;
  const estSeconds = Math.round(wordCount * 0.4);

  useEffect(() => {
    return;
  }, []);

  const CONTENT_FACTORY_WEBHOOK =
    import.meta.env.VITE_CONTENT_FACTORY_WEBHOOK_URL || "/api/content-factory";

  const handleGenerateScript = async () => {
    if (!user) {
      toast({
        title: "Not signed in",
        description: "Please sign in to generate content.",
        variant: "destructive",
      });
      return;
    }

    if (!contentType || !series) {
      toast({
        title: "Missing fields",
        description: "Please select content type and series",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const payload = {
        action: "generate_script",
        inputs: {
          content_type: contentType,
          series,
          hook: hook || undefined,
          target_audience: audience,
        },
        idempotency_key:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const accessToken = session?.access_token;
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      if (user?.id) headers["x-user-id"] = user.id;

      const res = await fetch(CONTENT_FACTORY_WEBHOOK, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to generate script");
      }

      const data = (await res.json()) as GenerateScriptResponse;

      setContentItemId(data.run_id);

      const scriptText =
        data.script_text ?? data.script?.text ?? data.output?.script?.text ?? "";

      if (!scriptText) {
        throw new Error(
          "Webhook returned no script text. Ensure your API returns { run_id, script_text }."
        );
      }

      setScript(scriptText);
      setCurrentStep(2);

      toast({
        title: "Script generated!",
        description: "Your AI script is ready. Edit as needed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate script",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateOnePager = async () => {
    if (!user) {
      toast({
        title: "Not signed in",
        description: "Please sign in to generate content.",
        variant: "destructive",
      });
      return;
    }

    if (!contentItemId) {
      toast({
        title: "Missing run_id",
        description: "Generate a script first (run_id is required).",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const payload = {
        action: "generate_one_pager",
        run_id: contentItemId,
        idempotency_key:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const accessToken = session?.access_token;
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      if (user?.id) headers["x-user-id"] = user.id;

      const res = await fetch(CONTENT_FACTORY_WEBHOOK, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to generate one-pager");
      }

      const data = (await res.json()) as GenerateOnePagerResponse;
      const opj = data.one_pager_json;

      let blocks: any[] = [];
      if (Array.isArray(opj)) blocks = opj;
      else if (opj?.blocks && Array.isArray(opj.blocks)) blocks = opj.blocks;
      else if (opj?.sections && Array.isArray(opj.sections)) blocks = opj.sections;

      blocks = blocks.map((b, idx) => ({
        id: b.id ?? idx + 1,
        title: b.title ?? `Beat ${idx + 1}`,
        content: b.content ?? b.body ?? "",
        details: b.details ?? b.notes ?? "",
      }));

      if (!blocks.length) {
        throw new Error(
          "One-pager returned no blocks. Ensure one_pager_agent returns JSON with { blocks: [...] }."
        );
      }

      setOnePagerBlocks(blocks);
      setCurrentStep(3);

      toast({
        title: "One-Pager generated!",
        description: "Preview is ready.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate one-pager",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // ✅ Step 3: Export the doc preview to PNG (local download)
  const handleExportOnePagerPng = async () => {
    if (!onePagerDocRef.current) {
      toast({
        title: "Nothing to export",
        description: "Generate the one-pager first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const canvas = await html2canvas(onePagerDocRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
      });

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), "image/png", 0.95);
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aa_one_pager_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast({
        title: "Exported",
        description: "Downloaded your one-pager PNG.",
      });
    } catch (e: any) {
      toast({
        title: "Export failed",
        description: e?.message || "Could not export PNG.",
        variant: "destructive",
      });
    }
  };

  // ✅ Step 3: Open a clean document view in a new tab (includes Print/PDF)
  const handleViewInNewTab = () => {
    if (!onePagerBlocks?.length) {
      toast({
        title: "Nothing to view",
        description: "Generate the one-pager first.",
        variant: "destructive",
      });
      return;
    }

    const blocksHtml = onePagerBlocks
      .slice(0, 7)
      .map((b: any, idx: number) => {
        return `
          <div class="card">
            <div class="cardTitle">
              <div class="badge">${idx + 1}</div>
              <div class="h">${escapeHtml(b.title || `Section ${idx + 1}`)}</div>
            </div>
            ${b.content ? `<div class="p">${escapeHtml(b.content)}</div>` : ""}
            ${b.details ? `<div class="muted">${escapeHtml(b.details)}</div>` : ""}
          </div>
        `;
      })
      .join("");

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(hook?.trim() ? hook.trim() : "AA One-Pager")}</title>
  <style>
    body{margin:0;background:#0B0F19;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Inter,Arial;}
    .wrap{max-width:860px;margin:32px auto;padding:0 16px;}
    .paper{background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.35);border:1px solid rgba(0,0,0,.08);}
    .top{background:#6A00F4;color:#fff;padding:26px 28px;}
    .kicker{letter-spacing:.18em;text-transform:uppercase;font-size:11px;color:rgba(255,255,255,.8)}
    .title{font-size:30px;line-height:1.1;margin:10px 0 0;font-weight:700}
    .sub{margin-top:10px;font-size:12px;color:rgba(255,255,255,.8)}
    .aa{width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-weight:800}
    .row{display:flex;gap:16px;align-items:flex-start;justify-content:space-between}
    .body{padding:22px 28px;}
    .meta{display:flex;gap:8px;align-items:center;justify-content:space-between;color:rgba(0,0,0,.55);font-size:12px}
    .pill{display:inline-flex;align-items:center;height:24px;border-radius:999px;background:rgba(0,0,0,.05);padding:0 10px}
    .how{margin-top:14px;background:#F6F1FF;border:1px solid rgba(0,0,0,.10);border-radius:16px;padding:16px}
    .howH{font-weight:700;font-size:14px;margin-bottom:6px}
    .howP{font-size:13px;line-height:1.5;color:rgba(0,0,0,.72)}
    .cards{margin-top:16px;display:grid;grid-template-columns:1fr;gap:12px}
    .card{border:1px solid rgba(0,0,0,.10);border-radius:16px;padding:14px}
    .cardTitle{display:flex;gap:10px;align-items:center}
    .badge{width:28px;height:28px;border-radius:10px;background:rgba(106,0,244,.10);border:1px solid rgba(106,0,244,.20);display:flex;align-items:center;justify-content:center;color:#6A00F4;font-weight:800;font-size:12px}
    .h{font-weight:700}
    .p{margin-top:10px;font-size:13px;line-height:1.55;color:rgba(0,0,0,.72);white-space:pre-wrap}
    .muted{margin-top:10px;font-size:12px;line-height:1.5;color:rgba(0,0,0,.55);white-space:pre-wrap}
    .footer{margin-top:14px;display:flex;justify-content:space-between;font-size:11px;color:rgba(0,0,0,.45)}
    .btns{margin:14px 0 0;display:flex;gap:10px}
    .btn{border:0;border-radius:12px;padding:10px 12px;cursor:pointer;font-weight:700}
    .btnPrimary{background:#6A00F4;color:#fff}
    .btnGhost{background:rgba(255,255,255,.10);color:#fff;border:1px solid rgba(255,255,255,.18)}
    @media print{
      body{background:#fff}
      .wrap{margin:0;max-width:none}
      .btns{display:none}
      .paper{box-shadow:none;border:none}
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="btns">
      <button class="btn btnPrimary" onclick="window.print()">Print / Save as PDF</button>
      <button class="btn btnGhost" onclick="window.close()">Close</button>
    </div>

    <div class="paper">
      <div class="top">
        <div class="row">
          <div>
            <div class="kicker">Attract Acquisition • ${escapeHtml(series || "Series")}</div>
            <div class="title">${escapeHtml(hook?.trim() ? hook.trim() : "One-Pager")}</div>
            <div class="sub">Audience: <b style="color:#fff">${escapeHtml(audience)}</b></div>
          </div>
          <div class="aa">AA</div>
        </div>
      </div>

      <div class="body">
        <div class="meta">
          <div style="display:flex;gap:8px;align-items:center">
            <span class="pill">One page</span>
            <span class="pill">Generated</span>
          </div>
          <div>aa-brand-studio</div>
        </div>

        <div class="how">
          <div class="howH">How to use this one-pager</div>
          <div class="howP">Read top-to-bottom. Use it as a checklist while scripting. Then convert it into a clean reel/carousel with a single outcome.</div>
        </div>

        <div class="cards">
          ${blocksHtml}
        </div>

        <div class="footer">
          <div>Attract Acquisition</div>
          <div>Content Factory</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  const handleGenerateDesigns = () => setCurrentStep(4);

  // Step 4 export (kept from your current system)
  const handleSaveAndExport = async () => {
    if (!user || !designRef.current) {
      toast({
        title: "Error",
        description: "No design to export",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const canvas = await html2canvas(designRef.current, {
        backgroundColor: "#0B0F19",
        scale: 2,
      });

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), "image/png", 0.95);
      });

      const filename = `design_${Date.now()}.png`;
      const uploaded = await uploadBlobToBucket(
        "aa-designs",
        blob,
        user.id,
        filename
      );

      if (!uploaded) throw new Error("Upload failed");

      const asset = await createAssetRow(
        user.id,
        "aa-designs",
        uploaded.path,
        "design",
        ["design", selectedFormat],
        filename
      );
      if (!asset) throw new Error("Asset creation failed");

      await createExport({
        contentItemId: contentItemId || "temp",
        kind: "design",
        format: selectedFormat,
        blob,
        series,
        title: hook || contentType,
      });

      toast({
        title: "Export saved!",
        description: "Design exported.",
      });

      setCurrentStep(1);
      setContentItemId(null);
      setContentType("");
      setSeries("");
      setHook("");
      setScript("");
      setOnePagerBlocks([]);
      setSelectedTemplate(null);
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message || "Failed to export design",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="aa-pill-primary mb-4">Content Factory</div>
          <h1 className="aa-headline-lg text-foreground">
            Create <span className="aa-gradient-text">Content</span>
          </h1>
          <p className="aa-body mt-2">
            AI-powered wizard: Idea → Script → One-Pager → Design Assets
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-10 px-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                    currentStep >= step.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  <step.icon className="w-5 h-5" />
                </div>
                <span
                  className={cn(
                    "text-xs font-medium mt-2",
                    currentStep >= step.id
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-24 h-0.5 mx-4",
                    currentStep > step.id ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <div className="aa-card">
          {/* Step 1 */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="aa-headline-md text-foreground mb-2">
                  Define Your Content
                </h2>
                <p className="text-muted-foreground">
                  Set the type, series, and hook for your content piece.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-muted-foreground mb-2 block">
                    Content Type
                  </Label>
                  <Select value={contentType} onValueChange={setContentType}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {contentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-muted-foreground mb-2 block">
                    Series
                  </Label>
                  <Select value={series} onValueChange={setSeries}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select series..." />
                    </SelectTrigger>
                    <SelectContent>
                      {seriesList.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground mb-2 block">
                  Hook (Optional)
                </Label>
                <Input
                  value={hook}
                  onChange={(e) => setHook(e.target.value)}
                  placeholder="e.g., Your content is noise."
                  className="h-12"
                />
              </div>

              <div>
                <Label className="text-muted-foreground mb-2 block">
                  Target Audience
                </Label>
                <Input
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  variant="gradient"
                  size="lg"
                  onClick={handleGenerateScript}
                  disabled={!contentType || !series || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Script
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="aa-headline-md text-foreground mb-2">
                    Script Editor
                  </h2>
                  <p className="text-muted-foreground">
                    Edit your AI-generated script. Target: 140–160 words (~60s
                    TTS).
                  </p>
                </div>
                <div
                  className={cn(
                    "px-4 py-2 rounded-xl flex items-center gap-2",
                    isWordCountValid ? "bg-green-500/10" : "bg-destructive/10"
                  )}
                >
                  {isWordCountValid ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                  )}
                  <span
                    className={cn(
                      "font-semibold",
                      isWordCountValid ? "text-green-400" : "text-destructive"
                    )}
                  >
                    {wordCount} words • ~{estSeconds}s
                  </span>
                </div>
              </div>

              <Textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                className="min-h-[300px] text-base leading-relaxed"
                placeholder="Your script will appear here..."
              />

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  variant="gradient"
                  size="lg"
                  onClick={handleGenerateOnePager}
                  disabled={isGenerating || !script}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      Generate One-Pager
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

{/* Step 3 */}
{currentStep === 3 && (
  <div className="space-y-6">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="aa-headline-md text-foreground mb-2">
          One-Pager Preview
        </h2>
        <p className="text-muted-foreground">
          Only the generated document is shown (no block editing).
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleViewInNewTab}
          disabled={!onePagerBlocks?.length}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          View in new tab
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportOnePagerPng}
          disabled={!onePagerBlocks?.length}
        >
          <Download className="w-4 h-4 mr-2" />
          Export PNG
        </Button>
      </div>
    </div>

    {!onePagerBlocks?.length ? (
      <div className="rounded-2xl border border-border/40 p-6 text-muted-foreground">
        No one-pager yet. Go back and click “Generate One-Pager”.
      </div>
    ) : (
      <div className="space-y-3">
        <div className="text-sm text-muted-foreground">Document preview</div>

        <div className="rounded-3xl border border-border/40 bg-[#0B0F19] p-5">
          <div ref={onePagerDocRef}>
            <AaOnePagerDocument
              brand="Attract Acquisition"
              series={series}
              title={hook?.trim() ? hook.trim() : "One-Pager"}
              audience={audience}
              blocks={onePagerBlocks}
            />
          </div>
        </div>
      </div>
    )}

    <div className="flex justify-between pt-4">
      <Button variant="outline" onClick={() => setCurrentStep(2)}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <Button
        variant="gradient"
        size="lg"
        onClick={handleGenerateDesigns}
        disabled={isGenerating || !onePagerBlocks?.length}
      >
        Generate Designs
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  </div>
)}

        {/* Step 4: Design Assets (original 3-column layout) */}
{currentStep === 4 && (
  <div className="space-y-6">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="aa-headline-md text-foreground mb-2">Design Assets</h2>
        <p className="text-muted-foreground">
          Generate export-ready visuals: Bold Text Card • Reel Cover • One-Pager Cover
        </p>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1) Bold Text Card */}
      <div className="rounded-3xl border border-border/40 bg-card/50 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-semibold">Bold Text Card</div>
            <div className="text-xs text-muted-foreground">1:1 square</div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => exportNodeAsPng(boldTextRef.current, "aa_bold_text_card")}
            disabled={!hook?.trim()}
          >
            <Download className="w-4 h-4 mr-2" />
            Export PNG
          </Button>
        </div>

        <div className="rounded-2xl border border-border/40 bg-[#0B0F19] p-4">
          <div ref={boldTextRef} className="aspect-square w-full rounded-2xl overflow-hidden">
            <div className="h-full w-full bg-[#0B0F19] text-white p-7 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="text-[10px] tracking-[0.22em] uppercase text-white/60">
                  Attract Acquisition
                </div>
                <div className="w-10 h-10 rounded-2xl bg-[#6A00F4] flex items-center justify-center font-bold">
                  AA
                </div>
              </div>

              <div className="mt-6">
                <div className="text-4xl font-semibold leading-tight">
                  {hook?.trim() ? hook.trim() : "YOUR CONTENT IS NOISE."}
                </div>
                <div className="mt-4 text-sm text-white/60 leading-relaxed">
                  {series ? `Series: ${series}` : "Make your message unignorable."}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-white/50">
                <div>{audience}</div>
                <div className="text-white/60">aa-brand-studio</div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 flex gap-2">
          <Button
            variant="gradient"
            className="flex-1"
            onClick={() =>
              toast({
                title: "Not wired yet",
                description: "This button is a placeholder. Export works already.",
              })
            }
          >
            Generate Bold Text Card
          </Button>
        </div>
      </div>

      {/* 2) Reel Cover */}
      <div className="rounded-3xl border border-border/40 bg-card/50 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-semibold">Reel Cover</div>
            <div className="text-xs text-muted-foreground">9:16</div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => exportNodeAsPng(reelCoverRef.current, "aa_reel_cover")}
          >
            <Download className="w-4 h-4 mr-2" />
            Export PNG
          </Button>
        </div>

        <div className="rounded-2xl border border-border/40 bg-[#0B0F19] p-4">
          <div ref={reelCoverRef} className="aspect-[9/16] w-full rounded-2xl overflow-hidden">
            <div className="h-full w-full bg-[#0B0F19] text-white p-6 flex flex-col">
              <div className="flex items-start justify-between">
                <div className="text-[10px] tracking-[0.22em] uppercase text-white/60">
                  {series ? series.replaceAll("-", " ") : "Attraction Audit"}
                </div>
                <div className="w-10 h-10 rounded-2xl bg-[#6A00F4] flex items-center justify-center font-bold">
                  AA
                </div>
              </div>

              <div className="mt-6 text-4xl font-semibold leading-tight">
                {hook?.trim() ? hook.trim() : "This is why your content doesn’t convert."}
              </div>

              <div className="mt-4 text-sm text-white/65 leading-relaxed">
                Watch before you post — fix the one thing that blocks bookings.
              </div>

              <div className="mt-auto">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-white/60">Audience</div>
                  <div className="mt-1 font-semibold">{audience}</div>
                </div>

                <div className="mt-4 flex items-center justify-between text-[11px] text-white/50">
                  <div>@attractacquisition</div>
                  <div className="text-white/60">aa-brand-studio</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 flex gap-2">
          <Button
            variant="gradient"
            className="flex-1"
            onClick={() =>
              toast({
                title: "Not wired yet",
                description: "This button is a placeholder. Export works already.",
              })
            }
          >
            Generate Reel Cover
          </Button>
        </div>
      </div>

      {/* 3) One-Pager Cover */}
      <div className="rounded-3xl border border-border/40 bg-card/50 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-semibold">One-Pager Cover</div>
            <div className="text-xs text-muted-foreground">4:5</div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => exportNodeAsPng(onePagerCoverRef.current, "aa_one_pager_cover")}
            disabled={!onePagerBlocks?.length}
          >
            <Download className="w-4 h-4 mr-2" />
            Export PNG
          </Button>
        </div>

        <div className="rounded-2xl border border-border/40 bg-[#0B0F19] p-4">
          <div ref={onePagerCoverRef} className="aspect-[4/5] w-full rounded-2xl overflow-hidden">
            <div className="h-full w-full bg-[#0B0F19] text-white p-6 flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] tracking-[0.22em] uppercase text-white/60">
                    Attract Acquisition
                  </div>
                  <div className="mt-2 text-3xl font-semibold leading-tight">
                    {hook?.trim() ? hook.trim() : "One-Pager"}
                  </div>
                  <div className="mt-2 text-sm text-white/60">{audience}</div>
                </div>

                <div className="w-10 h-10 rounded-2xl bg-[#6A00F4] flex items-center justify-center font-bold">
                  AA
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/60">What you’ll get</div>
                <ul className="mt-2 space-y-2 text-sm text-white/85">
                  <li>• Clear steps (no fluff)</li>
                  <li>• A simple checklist</li>
                  <li>• Examples you can copy</li>
                </ul>
              </div>

              <div className="mt-auto flex items-center justify-between text-[11px] text-white/50">
                <div>{series || "Series"}</div>
                <div className="text-white/60">aa-brand-studio</div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 flex gap-2">
          <Button
            variant="gradient"
            className="flex-1"
            onClick={() =>
              toast({
                title: "Not wired yet",
                description: "This button is a placeholder. Export works already.",
              })
            }
            disabled={!onePagerBlocks?.length}
          >
            Generate One-Pager Cover
          </Button>
        </div>
      </div>
    </div>

    <div className="flex justify-between pt-4">
      <Button variant="outline" onClick={() => setCurrentStep(3)}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <Button
        variant="gradient"
        size="lg"
        onClick={handleSaveAndExport}
        disabled={isSaving || !onePagerBlocks?.length}
      >
        {isSaving ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Save & Export
          </>
        )}
      </Button>
    </div>
  </div>
)}


        </div>
      </div>
    </AppLayout>
  );
}
