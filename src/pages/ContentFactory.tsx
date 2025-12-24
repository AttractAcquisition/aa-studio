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
  Image as ImageIcon,
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
  { id: 4, title: "Design", icon: ImageIcon },
];

type GenerateOnePagerResponse = {
  run_id: string;
  one_pager_json?: any;
  one_pager_text?: string;
  blocks?: any[];
  error?: string;
  debug?: any;
};

type DesignAssetKind = "bold_text_card" | "reel_cover" | "one_pager_cover";

type ExtractedImage = {
  url?: string; // data URL or http(s)
  data_url?: string;
  mime?: string;
  width?: number;
  height?: number;
};

type GenerateDesignResponse = {
  run_id: string;
  format?: string;
  ratio?: string;
  mode?: string;
  images?: ExtractedImage[];
  design_json?: any;
  raw_text?: string | null;
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

function pickFirstImageUrl(images?: ExtractedImage[]) {
  if (!Array.isArray(images) || images.length === 0) return null;
  const first = images[0];
  return first?.url || first?.data_url || null;
}

async function urlToBlob(url: string): Promise<Blob> {
  if (!url) throw new Error("Missing image URL");

  if (url.startsWith("data:image/")) {
    const res = await fetch(url);
    return await res.blob();
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image (${res.status})`);
  return await res.blob();
}

export default function ContentFactory() {
  const { user, session } = useAuth() as any;
  const { toast } = useToast();
  const { templates } = useTemplates(); // kept
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

  // ✅ Store generated images per asset kind
  const [designImages, setDesignImages] = useState<{
    bold_text_card?: string | null;
    reel_cover?: string | null;
    one_pager_cover?: string | null;
  }>({});

  const [isGeneratingDesignKind, setIsGeneratingDesignKind] =
    useState<DesignAssetKind | null>(null);

  // Step 3: document ref (export + screenshot)
  const onePagerDocRef = useRef<HTMLDivElement>(null);

  // Script word target
  const wordCount = script.trim().split(/\s+/).filter(Boolean).length;
  const isWordCountValid = wordCount >= 140 && wordCount <= 160;
  const estSeconds = Math.round(wordCount * 0.4);

  useEffect(() => {
    return;
  }, []);

  const CONTENT_FACTORY_WEBHOOK =
    import.meta.env.VITE_CONTENT_FACTORY_WEBHOOK_URL || "/api/content-factory";

  // -----------------------------
  // Helpers: export (for Step 3 doc)
  // -----------------------------
  const renderNodeToBlob = async (
    node: HTMLElement,
    backgroundColor: string = "#0B0F19"
  ) => {
    const canvas = await html2canvas(node, {
      backgroundColor,
      scale: 2,
    });

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("PNG export failed"))),
        "image/png",
        0.95
      );
    });

    return blob;
  };

  // -----------------------------
  // Step 1: Generate Script
  // -----------------------------
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

      const data = (await res.json().catch(() => ({}))) as any;
      if (!res.ok) throw new Error(data?.error || "Failed to generate script");

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

      // reset downstream
      setOnePagerBlocks([]);
      setDesignImages({});

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

  // -----------------------------
  // Step 2: Generate One-Pager
  // -----------------------------
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

      const data = (await res.json().catch(() => ({}))) as GenerateOnePagerResponse;
      if (!res.ok) throw new Error((data as any)?.error || "Failed to generate one-pager");

      // ✅ Prefer canonical blocks from server if present
      let blocks: any[] = Array.isArray(data.blocks) ? data.blocks : [];
      if (!blocks.length) {
        const opj = data.one_pager_json;

        if (Array.isArray(opj)) blocks = opj;
        else if (opj?.blocks && Array.isArray(opj.blocks)) blocks = opj.blocks;
        else if (opj?.sections && Array.isArray(opj.sections)) blocks = opj.sections;

        blocks = blocks.map((b, idx) => ({
          id: b.id ?? idx + 1,
          title: b.title ?? `Beat ${idx + 1}`,
          content: b.content ?? b.body ?? "",
          details: b.details ?? b.notes ?? "",
        }));
      }

      if (!blocks.length) {
        throw new Error(
          data.error ||
            "One-pager returned no blocks. Ensure one_pager_agent returns JSON with blocks."
        );
      }

      setOnePagerBlocks(blocks);

      // ✅ Clear images because the source content changed
      setDesignImages({});

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

  // -----------------------------
  // Step 3: Export One-Pager PNG
  // -----------------------------
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
      const blob = await renderNodeToBlob(onePagerDocRef.current, "#ffffff");

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

  // -----------------------------
  // Step 3: View in New Tab
  // -----------------------------
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

  // -----------------------------
  // Step 4: Generate Design IMAGES
  // -----------------------------
  const handleGenerateDesignAsset = async (kind: DesignAssetKind) => {
    if (!user) {
      toast({
        title: "Not signed in",
        description: "Please sign in to generate designs.",
        variant: "destructive",
      });
      return;
    }

    if (!contentItemId) {
      toast({
        title: "Missing run_id",
        description: "Generate a script + one-pager first.",
        variant: "destructive",
      });
      return;
    }

    if (!onePagerBlocks?.length) {
      toast({
        title: "Missing one-pager",
        description: "Generate the one-pager first.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingDesignKind(kind);

    try {
      const ratio =
        kind === "bold_text_card" ? "1:1" : kind === "reel_cover" ? "9:16" : "4:5";

      const payload = {
        action: "generate_design",
        run_id: contentItemId,
        kind,
        ratio,
        mode: "clean",
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

      const data = (await res.json().catch(() => ({}))) as GenerateDesignResponse;

      // Even if status is 200, API may return { error }
      if (!res.ok) throw new Error((data as any)?.error || "Failed to generate design");
      if (data?.error) throw new Error(data.error);

      const imageUrl = pickFirstImageUrl(data.images);
      if (!imageUrl) {
        throw new Error(
          "No image returned. Your runWorkflow must return image tool outputs (images/artifacts)."
        );
      }

      setDesignImages((prev) => ({ ...prev, [kind]: imageUrl }));

      toast({
        title: "Generated",
        description: "Design image updated.",
      });
    } catch (e: any) {
      toast({
        title: "Design generation failed",
        description: e?.message || "Could not generate design image.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDesignKind(null);
    }
  };

  // -----------------------------
  // Step transitions
  // -----------------------------
  const handleGenerateDesigns = () => setCurrentStep(4);

  // -----------------------------
  // Step 4: Export a single image
  // -----------------------------
  const exportImageUrl = async (url: string | null | undefined, basename: string) => {
    if (!url) {
      toast({
        title: "Nothing to export",
        description: "Generate the image first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const blob = await urlToBlob(url);
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `${basename}_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);

      toast({ title: "Exported", description: "Downloaded PNG." });
    } catch (e: any) {
      toast({
        title: "Export failed",
        description: e?.message || "Could not export PNG.",
        variant: "destructive",
      });
    }
  };

  // -----------------------------
  // Step 4: Save & Export ALL 3 images to Supabase + Exports
  // -----------------------------
  const handleSaveAndExport = async () => {
    if (!user) {
      toast({
        title: "Not signed in",
        description: "Please sign in to export designs.",
        variant: "destructive",
      });
      return;
    }

    if (!onePagerBlocks?.length) {
      toast({
        title: "Nothing to export",
        description: "Generate the one-pager first.",
        variant: "destructive",
      });
      return;
    }

    const boldUrl = designImages.bold_text_card;
    const reelUrl = designImages.reel_cover;
    const coverUrl = designImages.one_pager_cover;

    if (!boldUrl || !reelUrl || !coverUrl) {
      toast({
        title: "Export failed",
        description:
          "Generate all 3 images first (Bold Text Card, Reel Cover, One-Pager Cover).",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const baseTitle = (hook || contentType || "design").toString();
      const runId = contentItemId || "temp";

      const items: Array<{
        key: DesignAssetKind;
        format: "1:1" | "9:16" | "4:5";
        url: string;
        filenameBase: string;
      }> = [
        {
          key: "bold_text_card",
          format: "1:1",
          url: boldUrl,
          filenameBase: "aa_bold_text_card",
        },
        {
          key: "reel_cover",
          format: "9:16",
          url: reelUrl,
          filenameBase: "aa_reel_cover",
        },
        {
          key: "one_pager_cover",
          format: "4:5",
          url: coverUrl,
          filenameBase: "aa_one_pager_cover",
        },
      ];

      let successCount = 0;

      for (const item of items) {
        const blob = await urlToBlob(item.url);
        const filename = `${item.filenameBase}_${Date.now()}_${item.format}.png`;

        const uploaded = await uploadBlobToBucket(
          "aa-designs",
          blob,
          user.id,
          filename
        );
        if (!uploaded) throw new Error(`Upload failed (${item.key})`);

        const asset = await createAssetRow(
          user.id,
          "aa-designs",
          uploaded.path,
          "design",
          [item.key, item.format],
          filename
        );
        if (!asset) throw new Error(`Asset creation failed (${item.key})`);

        await createExport({
          contentItemId: runId,
          kind: item.key,
          format: item.format,
          blob,
          series,
          title: baseTitle,
        });

        successCount += 1;
      }

      toast({
        title: "Export saved!",
        description: `Saved ${successCount}/3 designs to your vault.`,
      });

      // Reset
      setCurrentStep(1);
      setContentItemId(null);
      setContentType("");
      setSeries("");
      setHook("");
      setScript("");
      setOnePagerBlocks([]);
      setDesignImages({});
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message || "Failed to export designs",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // -----------------------------
  // Derived values
  // -----------------------------
  const seriesLabel = series ? series.split("-").join(" ") : "Attraction Audit";

  const boldImg = designImages.bold_text_card;
  const reelImg = designImages.reel_cover;
  const coverImg = designImages.one_pager_cover;

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
                  <div className="text-sm text-muted-foreground">
                    Document preview
                  </div>

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

          {/* Step 4 */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="aa-headline-md text-foreground mb-2">
                    Design Assets
                  </h2>
                  <p className="text-muted-foreground">
                    Agent-generated images: Bold Text Card • Reel Cover • One-Pager Cover
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bold Text Card */}
                <div className="rounded-3xl border border-border/40 bg-card/50 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-semibold">Bold Text Card</div>
                      <div className="text-xs text-muted-foreground">1:1 square</div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportImageUrl(boldImg, "aa_bold_text_card")}
                      disabled={!boldImg}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export PNG
                    </Button>
                  </div>

                  <div className="rounded-2xl border border-border/40 bg-[#0B0F19] p-4">
                    <div className="aspect-square w-full rounded-2xl overflow-hidden bg-[#0B0F19] flex items-center justify-center">
                      {boldImg ? (
                        <img src={boldImg} alt="Bold text card" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-white/60 text-sm px-6 text-center">
                          Generate to preview image.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 flex gap-2">
                    <Button
                      variant="gradient"
                      className="flex-1"
                      onClick={() => handleGenerateDesignAsset("bold_text_card")}
                      disabled={isGeneratingDesignKind === "bold_text_card"}
                    >
                      {isGeneratingDesignKind === "bold_text_card" ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        "Generate Bold Text Card"
                      )}
                    </Button>
                  </div>
                </div>

                {/* Reel Cover */}
                <div className="rounded-3xl border border-border/40 bg-card/50 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-semibold">Reel Cover</div>
                      <div className="text-xs text-muted-foreground">9:16</div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportImageUrl(reelImg, "aa_reel_cover")}
                      disabled={!reelImg}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export PNG
                    </Button>
                  </div>

                  <div className="rounded-2xl border border-border/40 bg-[#0B0F19] p-4">
                    <div className="aspect-[9/16] w-full rounded-2xl overflow-hidden bg-[#0B0F19] flex items-center justify-center">
                      {reelImg ? (
                        <img src={reelImg} alt="Reel cover" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-white/60 text-sm px-6 text-center">
                          Generate to preview image.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 flex gap-2">
                    <Button
                      variant="gradient"
                      className="flex-1"
                      onClick={() => handleGenerateDesignAsset("reel_cover")}
                      disabled={isGeneratingDesignKind === "reel_cover"}
                    >
                      {isGeneratingDesignKind === "reel_cover" ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        "Generate Reel Cover"
                      )}
                    </Button>
                  </div>
                </div>

                {/* One-Pager Cover */}
                <div className="rounded-3xl border border-border/40 bg-card/50 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-semibold">One-Pager Cover</div>
                      <div className="text-xs text-muted-foreground">4:5</div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportImageUrl(coverImg, "aa_one_pager_cover")}
                      disabled={!coverImg}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export PNG
                    </Button>
                  </div>

                  <div className="rounded-2xl border border-border/40 bg-[#0B0F19] p-4">
                    <div className="aspect-[4/5] w-full rounded-2xl overflow-hidden bg-[#0B0F19] flex items-center justify-center">
                      {coverImg ? (
                        <img src={coverImg} alt="One pager cover" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-white/60 text-sm px-6 text-center">
                          Generate to preview image.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 flex gap-2">
                    <Button
                      variant="gradient"
                      className="flex-1"
                      onClick={() => handleGenerateDesignAsset("one_pager_cover")}
                      disabled={isGeneratingDesignKind === "one_pager_cover"}
                    >
                      {isGeneratingDesignKind === "one_pager_cover" ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        "Generate One-Pager Cover"
                      )}
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
                      Save & Export All
                    </>
                  )}
                </Button>
              </div>

              <div className="text-xs text-muted-foreground pt-2">
                Series: {seriesLabel} • Format outputs are image-based.
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
