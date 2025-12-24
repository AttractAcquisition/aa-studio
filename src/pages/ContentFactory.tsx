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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTemplates } from "@/hooks/useTemplates";
import { useExports } from "@/hooks/useExports";
import { useToast } from "@/hooks/use-toast";
import { uploadBlobToBucket, createAssetRow } from "@/lib/supabase-helpers";
import { useAuth } from "@/hooks/useAuth";
import html2canvas from "html2canvas";

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

// ✅ Still used for local One-Pager mock until you wire that webhook later
const generateOnePagerBlocks = (script: string) => {
  const sentences = script.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  const blocks = [];

  for (let i = 0; i < Math.min(5, sentences.length); i++) {
    blocks.push({
      id: i + 1,
      title: `Beat ${i + 1}`,
      content:
        sentences[i * Math.floor(sentences.length / 5)]?.trim() ||
        `Key point ${i + 1}`,
      details: "",
    });
  }

  return blocks;
};

type GenerateScriptResponse = {
  run_id: string;

  // possible shapes:
  script_text?: string;
  script?: { text?: string };
  output?: { script?: { text?: string } };

  // optional extras
  brief?: any;
  brief_json?: any;
  script_json?: any;
};

export default function ContentFactory() {
  const { user, session } = useAuth() as any; // ✅ session optional (depends on your hook)
  const { toast } = useToast();
  const { templates } = useTemplates();
  const { createExport } = useExports();

  const [currentStep, setCurrentStep] = useState(1);

  // NOTE: this holds your NEW content_runs.id (run_id)
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
  const designRef = useRef<HTMLDivElement>(null);

  // ✅ AA shortform target: 140–160 words
  const wordCount = script.trim().split(/\s+/).filter(Boolean).length;
  const isWordCountValid = wordCount >= 140 && wordCount <= 160;
  const estSeconds = Math.round(wordCount * 0.4);

  // ❌ Disable autosave for now (old hooks would write to old tables and break)
  useEffect(() => {
    return;
  }, []);

  // ✅ Point this at YOUR server API route.
  // That API route imports lib/aa-workflow.ts and runs the Agent workflow.
  const CONTENT_FACTORY_WEBHOOK =
    process.env.NEXT_PUBLIC_CONTENT_FACTORY_WEBHOOK_URL || "/api/content-factory";

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

      // ✅ Preferred: bearer token if your API route validates Supabase auth
      const accessToken = session?.access_token;
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

      // ✅ Fallback: x-user-id if your API still expects it
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

      // Save run_id for next steps (one-pager/design will fetch this later)
      setContentItemId(data.run_id);

      // ✅ Support multiple response shapes
      const scriptText =
        data.script_text ??
        data.script?.text ??
        data.output?.script?.text ??
        "";

      if (!scriptText) {
        throw new Error(
          "Webhook returned no script text. Ensure your /api/content-factory returns { run_id, script_text } or { run_id, script: { text } }."
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

  // TEMP (local mock) until one-pager webhook is wired
  const handleGenerateOnePager = async () => {
    if (!script) return;

    setIsGenerating(true);
    try {
      const blocks = generateOnePagerBlocks(script);
      setOnePagerBlocks(blocks);

      setCurrentStep(3);
      toast({
        title: "One-Pager generated!",
        description:
          "This is using local mock logic for now. We'll wire the one_pager_agent next.",
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

  const handleSaveOnePager = async () => {
    toast({
      title: "Not wired yet",
      description:
        "Save One-Pager will be connected to the one_pager_agent + Supabase next.",
    });
  };

  const handleGenerateDesigns = () => {
    setCurrentStep(4);
  };

  // Leaving your export logic as-is for now
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
        description:
          "Design exported. We'll wire Save & Export All into asset_vault later.",
      });

      // Reset form
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

  const updateBlock = (blockId: number, field: string, value: string) => {
    setOnePagerBlocks((blocks) =>
      blocks.map((b) => (b.id === blockId ? { ...b, [field]: value } : b))
    );
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

        {/* Progress Steps */}
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

        {/* Step Content */}
        <div className="aa-card">
          {/* Step 1: Input */}
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

          {/* Step 2: Script */}
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

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateScript}
                  disabled={isGenerating}
                >
                  <RefreshCw
                    className={cn("w-4 h-4 mr-2", isGenerating && "animate-spin")}
                  />
                  Regenerate
                </Button>
              </div>

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

          {/* Step 3 + Step 4 remain unchanged... */}
          {/* (keeping your existing JSX below) */}
        </div>
      </div>
    </AppLayout>
  );
}
