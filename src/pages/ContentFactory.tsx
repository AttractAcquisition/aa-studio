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
import { useExports } from "@/hooks/useExports";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useContentFactoryFlow } from "@/hooks/useContentFactoryFlow";
import { AaOnePagerDocument } from "@/components/onepager/AaOnePagerDocument";
import { CONTENT_TYPES, SERIES_LIST, WORKFLOW_STEPS } from "@/types/content-factory";

const stepIcons = {
  1: FileText,
  2: Wand2,
  3: LayoutTemplate,
  4: ImageIcon,
};

export default function ContentFactory() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const { createExport } = useExports();

  const flow = useContentFactoryFlow({
    user,
    session,
    toast,
    createExport,
  });

  const {
    currentStep,
    contentType,
    series,
    hook,
    audience,
    script,
    onePagerBlocks,
    designImages,
    designPrompts,
    isGenerating,
    isSaving,
    isGeneratingDesignKind,
    isGeneratingPromptKind,
    wordCount,
    isWordCountValid,
    estSeconds,
    seriesLabel,
    onePagerDocRef,
    setCurrentStep,
    setContentType,
    setSeries,
    setHook,
    setAudience,
    setScript,
    setDesignPrompt,
    generateScript,
    generateOnePager,
    generateDesignPrompt,
    generateDesignImage,
    exportOnePagerPng,
    viewOnePagerNewTab,
    exportSingleImage,
    saveAndExportAll,
  } = flow;

  const boldImg = designImages.bold_text_card;
  const reelImg = designImages.reel_cover;
  const coverImg = designImages.one_pager_cover;

  const boldPrompt = designPrompts.bold_text_card || "";
  const reelPrompt = designPrompts.reel_cover || "";
  const coverPrompt = designPrompts.one_pager_cover || "";

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
          {WORKFLOW_STEPS.map((step, index) => {
            const Icon = stepIcons[step.id as keyof typeof stepIcons];
            return (
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
                    <Icon className="w-5 h-5" />
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
                {index < WORKFLOW_STEPS.length - 1 && (
                  <div
                    className={cn(
                      "w-24 h-0.5 mx-4",
                      currentStep > step.id ? "bg-primary" : "bg-border"
                    )}
                  />
                )}
              </div>
            );
          })}
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
                      {CONTENT_TYPES.map((type) => (
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
                      {SERIES_LIST.map((s) => (
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
                  onClick={generateScript}
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
                  onClick={generateOnePager}
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
                    onClick={viewOnePagerNewTab}
                    disabled={!onePagerBlocks?.length}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View in new tab
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportOnePagerPng}
                    disabled={!onePagerBlocks?.length}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export PNG
                  </Button>
                </div>
              </div>

              {!onePagerBlocks?.length ? (
                <div className="rounded-2xl border border-border/40 p-6 text-muted-foreground">
                  No one-pager yet. Go back and click "Generate One-Pager".
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
                  onClick={() => setCurrentStep(4)}
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
                    Agent-generated images: Bold Text Card • Reel Cover • One-Pager
                    Cover
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bold Text Card */}
                <div className="rounded-3xl border border-border/40 bg-card/50 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Bold Text Card</div>
                      <div className="text-xs text-muted-foreground">1:1 square</div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportSingleImage(boldImg, "aa_bold_text_card")}
                      disabled={!boldImg}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export PNG
                    </Button>
                  </div>

                  {/* Image Preview */}
                  <div className="rounded-2xl border border-border/40 bg-[#0B0F19] p-4">
                    <div className="aspect-square w-full rounded-2xl overflow-hidden bg-[#0B0F19] flex items-center justify-center">
                      {boldImg ? (
                        <img
                          src={boldImg}
                          alt="Bold text card"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-white/60 text-sm px-6 text-center">
                          Generate prompt, then generate image.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Prompt Editor */}
                  {boldPrompt && (
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Prompt (editable)</label>
                      <Textarea
                        value={boldPrompt}
                        onChange={(e) => setDesignPrompt("bold_text_card", e.target.value)}
                        className="min-h-[80px] text-xs"
                        placeholder="Generated prompt will appear here..."
                      />
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => generateDesignPrompt("bold_text_card")}
                      disabled={isGeneratingPromptKind === "bold_text_card"}
                    >
                      {isGeneratingPromptKind === "bold_text_card" ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4 mr-2" />
                          Generate Prompt
                        </>
                      )}
                    </Button>
                    <Button
                      variant="gradient"
                      className="flex-1"
                      onClick={() => generateDesignImage("bold_text_card", boldPrompt)}
                      disabled={!boldPrompt || isGeneratingDesignKind === "bold_text_card"}
                    >
                      {isGeneratingDesignKind === "bold_text_card" ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Generate Image
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Reel Cover */}
                <div className="rounded-3xl border border-border/40 bg-card/50 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Reel Cover</div>
                      <div className="text-xs text-muted-foreground">9:16</div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportSingleImage(reelImg, "aa_reel_cover")}
                      disabled={!reelImg}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export PNG
                    </Button>
                  </div>

                  {/* Image Preview */}
                  <div className="rounded-2xl border border-border/40 bg-[#0B0F19] p-4">
                    <div className="aspect-[9/16] w-full rounded-2xl overflow-hidden bg-[#0B0F19] flex items-center justify-center">
                      {reelImg ? (
                        <img
                          src={reelImg}
                          alt="Reel cover"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-white/60 text-sm px-6 text-center">
                          Generate prompt, then generate image.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Prompt Editor */}
                  {reelPrompt && (
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Prompt (editable)</label>
                      <Textarea
                        value={reelPrompt}
                        onChange={(e) => setDesignPrompt("reel_cover", e.target.value)}
                        className="min-h-[80px] text-xs"
                        placeholder="Generated prompt will appear here..."
                      />
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => generateDesignPrompt("reel_cover")}
                      disabled={isGeneratingPromptKind === "reel_cover"}
                    >
                      {isGeneratingPromptKind === "reel_cover" ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4 mr-2" />
                          Generate Prompt
                        </>
                      )}
                    </Button>
                    <Button
                      variant="gradient"
                      className="flex-1"
                      onClick={() => generateDesignImage("reel_cover", reelPrompt)}
                      disabled={!reelPrompt || isGeneratingDesignKind === "reel_cover"}
                    >
                      {isGeneratingDesignKind === "reel_cover" ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Generate Image
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* One-Pager Cover */}
                <div className="rounded-3xl border border-border/40 bg-card/50 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">One-Pager Cover</div>
                      <div className="text-xs text-muted-foreground">4:5</div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportSingleImage(coverImg, "aa_one_pager_cover")}
                      disabled={!coverImg}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export PNG
                    </Button>
                  </div>

                  {/* Image Preview */}
                  <div className="rounded-2xl border border-border/40 bg-[#0B0F19] p-4">
                    <div className="aspect-[4/5] w-full rounded-2xl overflow-hidden bg-[#0B0F19] flex items-center justify-center">
                      {coverImg ? (
                        <img
                          src={coverImg}
                          alt="One pager cover"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-white/60 text-sm px-6 text-center">
                          Generate prompt, then generate image.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Prompt Editor */}
                  {coverPrompt && (
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Prompt (editable)</label>
                      <Textarea
                        value={coverPrompt}
                        onChange={(e) => setDesignPrompt("one_pager_cover", e.target.value)}
                        className="min-h-[80px] text-xs"
                        placeholder="Generated prompt will appear here..."
                      />
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => generateDesignPrompt("one_pager_cover")}
                      disabled={isGeneratingPromptKind === "one_pager_cover"}
                    >
                      {isGeneratingPromptKind === "one_pager_cover" ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4 mr-2" />
                          Generate Prompt
                        </>
                      )}
                    </Button>
                    <Button
                      variant="gradient"
                      className="flex-1"
                      onClick={() => generateDesignImage("one_pager_cover", coverPrompt)}
                      disabled={!coverPrompt || isGeneratingDesignKind === "one_pager_cover"}
                    >
                      {isGeneratingDesignKind === "one_pager_cover" ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Generate Image
                        </>
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
                  onClick={saveAndExportAll}
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
