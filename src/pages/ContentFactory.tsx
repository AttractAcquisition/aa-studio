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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Code,
  Eye,
  FileJson,
  Save,
  FileDown,
  PenLine,
  Import,
  Search,
  ChevronDown,
  FileType,
  Subtitles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useExports } from "@/hooks/useExports";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useContentFactoryFlow } from "@/hooks/useContentFactoryFlow";
import { useScriptLibrary } from "@/hooks/useScriptLibrary";
import { AaOnePagerDocument } from "@/components/onepager/AaOnePagerDocument";
import { OnePagerRenderer } from "@/components/onepager/OnePagerRenderer";
import { CONTENT_TYPES, SERIES_LIST, WORKFLOW_STEPS } from "@/types/content-factory";
import { TEMPLATE_OPTIONS } from "@/lib/one-pager-templates";
import type { OnePagerTemplateId } from "@/types/one-pager-layout";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";

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
  const { scripts } = useScriptLibrary();
  const [searchParams] = useSearchParams();

  const flow = useContentFactoryFlow({
    user,
    session,
    toast,
    createExport,
  });

  // Import script modal
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [scriptSearch, setScriptSearch] = useState("");

  // Check if we came from Scripts page with a script to import
  const importScriptId = searchParams.get("importScript");

  // Handle importing a script
  const handleImportScript = (scriptId: string) => {
    const scriptToImport = scripts.find(s => s.id === scriptId);
    if (scriptToImport) {
      const fullScript = scriptToImport.hook 
        ? `${scriptToImport.hook}\n\n${scriptToImport.body}` 
        : scriptToImport.body;
      flow.setScript(fullScript);
      if (scriptToImport.hook) {
        flow.setHook(scriptToImport.hook);
      }
      flow.setCurrentStep(2);
      setImportModalOpen(false);
      toast({
        title: "Script imported",
        description: `"${scriptToImport.title}" loaded into editor.`,
      });
    }
  };

  // Auto-import if came from Scripts page
  useState(() => {
    if (importScriptId && scripts.length > 0) {
      handleImportScript(importScriptId);
    }
  });

  // Filter scripts for import modal
  const filteredImportScripts = scripts.filter(s =>
    s.title.toLowerCase().includes(scriptSearch.toLowerCase()) ||
    s.body.toLowerCase().includes(scriptSearch.toLowerCase())
  );

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
    // New layout system
    onePagerLayout,
    onePagerLayoutJson,
    onePagerLayoutError,
    selectedTemplate,
    isGeneratingLayout,
    setCurrentStep,
    setContentType,
    setSeries,
    setHook,
    setAudience,
    setScript,
    setDesignPrompt,
    setSelectedTemplate,
    generateScript,
    generateOnePager,
    generateOnePagerLayout,
    updateLayoutFromJson,
    generateDesignPrompt,
    generateDesignImage,
    exportOnePagerPng,
    viewOnePagerNewTab,
    exportSingleImage,
    saveAndExportAll,
    saveScriptToLibrary,
    exportScriptTxt,
    exportScriptSrt,
    skipToManualScript,
    saveOnePagerToLibrary,
    isSavingOnePager,
  } = flow;

  // Toggle between JSON editor and preview
  const [showJsonEditor, setShowJsonEditor] = useState(false);

  const boldImg = designImages.bold_text_card;
  const reelImg = designImages.reel_cover;
  const coverImg = designImages.one_pager_cover;

  const boldPrompt = designPrompts.bold_text_card || "";
  const reelPrompt = designPrompts.reel_cover || "";
  const coverPrompt = designPrompts.one_pager_cover || "";

  // Check if we have a valid layout for the new system
  const hasValidLayout = onePagerLayout !== null && !onePagerLayoutError;

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

              <div className="flex justify-between pt-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={skipToManualScript}
                  >
                    <PenLine className="w-4 h-4 mr-2" />
                    Manual Script
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setImportModalOpen(true)}
                  >
                    <Import className="w-4 h-4 mr-2" />
                    Import from Scripts
                  </Button>
                </div>
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

              {/* Template Selector */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground mb-2 block">
                    One-Pager Template
                  </Label>
                  <Select
                    value={selectedTemplate}
                    onValueChange={(val) => setSelectedTemplate(val as OnePagerTemplateId)}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_OPTIONS.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          <div className="flex flex-col">
                            <span>{t.label}</span>
                            <span className="text-xs text-muted-foreground">{t.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveScriptToLibrary}
                  disabled={!script}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save to Scripts
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!script}
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      Export Script
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={exportScriptTxt}>
                      <FileType className="w-4 h-4 mr-2" />
                      Export as .txt
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportScriptSrt}>
                      <Subtitles className="w-4 h-4 mr-2" />
                      Export as .srt (Subtitles)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setCurrentStep(4)}
                    disabled={!script}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Generate Designs
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    variant="gradient"
                    size="lg"
                    onClick={generateOnePagerLayout}
                    disabled={isGeneratingLayout || !script}
                  >
                    {isGeneratingLayout ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileJson className="w-4 h-4 mr-2" />
                        Generate One-Pager
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3 - New Block-Based One-Pager */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="aa-headline-md text-foreground mb-2">
                    One-Pager Layout
                  </h2>
                  <p className="text-muted-foreground">
                    Edit JSON or preview the rendered one-pager with cards, checklists, and more.
                  </p>
                </div>

                <div className="flex gap-2">
                  {/* Toggle View */}
                  <Button
                    variant={showJsonEditor ? "outline" : "secondary"}
                    size="sm"
                    onClick={() => setShowJsonEditor(false)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    variant={showJsonEditor ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setShowJsonEditor(true)}
                  >
                    <Code className="w-4 h-4 mr-2" />
                    JSON
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={saveOnePagerToLibrary}
                    disabled={!hasValidLayout || isSavingOnePager}
                  >
                    {isSavingOnePager ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save to Library
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportOnePagerPng}
                    disabled={!hasValidLayout}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export PNG
                  </Button>
                </div>
              </div>

              {/* Error Display */}
              {onePagerLayoutError && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-destructive">Layout Error</p>
                    <p className="text-sm text-muted-foreground mt-1">{onePagerLayoutError}</p>
                  </div>
                </div>
              )}

              {/* JSON Editor View */}
              {showJsonEditor && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground">Layout JSON (editable)</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={generateOnePagerLayout}
                      disabled={isGeneratingLayout}
                    >
                      <RefreshCw className={cn("w-4 h-4 mr-2", isGeneratingLayout && "animate-spin")} />
                      Regenerate
                    </Button>
                  </div>
                  <Textarea
                    value={onePagerLayoutJson}
                    onChange={(e) => updateLayoutFromJson(e.target.value)}
                    className="min-h-[400px] font-mono text-sm"
                    placeholder="Generated JSON will appear here..."
                  />
                </div>
              )}

              {/* Preview View */}
              {!showJsonEditor && (
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">Live Preview</div>

                  {!hasValidLayout && !onePagerLayoutJson ? (
                    <div className="rounded-2xl border border-border/40 p-8 text-center text-muted-foreground">
                      <FileJson className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">No layout yet</p>
                      <p className="text-sm mt-1">Go back and click "Generate Layout (JSON)" to create a one-pager.</p>
                    </div>
                  ) : hasValidLayout && onePagerLayout ? (
                    <div className="rounded-3xl border border-border/40 bg-background p-5 max-h-[600px] overflow-y-auto scrollbar-hide">
                      <div ref={onePagerDocRef}>
                        <OnePagerRenderer
                          layout={onePagerLayout}
                          brand="Attract Acquisition"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-destructive" />
                      <p className="font-medium text-destructive">Invalid Layout</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Switch to JSON view to fix the errors.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>

                <Button
                  variant="gradient"
                  size="lg"
                  onClick={() => setCurrentStep(4)}
                  disabled={!hasValidLayout}
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

                  {/* Prompt Editor - Always visible */}
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">
                      Prompt {boldPrompt ? "(editable)" : "— generate or type manually"}
                    </label>
                    <Textarea
                      value={boldPrompt}
                      onChange={(e) => setDesignPrompt("bold_text_card", e.target.value)}
                      className="min-h-[80px] text-xs"
                      placeholder="Click 'Generate Prompt' or type your own design prompt here..."
                    />
                  </div>

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

                  {/* Prompt Editor - Always visible */}
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">
                      Prompt {reelPrompt ? "(editable)" : "— generate or type manually"}
                    </label>
                    <Textarea
                      value={reelPrompt}
                      onChange={(e) => setDesignPrompt("reel_cover", e.target.value)}
                      className="min-h-[80px] text-xs"
                      placeholder="Click 'Generate Prompt' or type your own design prompt here..."
                    />
                  </div>

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

                  {/* Prompt Editor - Always visible */}
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">
                      Prompt {coverPrompt ? "(editable)" : "— generate or type manually"}
                    </label>
                    <Textarea
                      value={coverPrompt}
                      onChange={(e) => setDesignPrompt("one_pager_cover", e.target.value)}
                      className="min-h-[80px] text-xs"
                      placeholder="Click 'Generate Prompt' or type your own design prompt here..."
                    />
                  </div>

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
                  disabled={isSaving || (!boldImg && !reelImg && !coverImg)}
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

      {/* Import Script Modal */}
      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent className="max-w-lg max-h-[70vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Import Script from Library</DialogTitle>
          </DialogHeader>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={scriptSearch}
              onChange={(e) => setScriptSearch(e.target.value)}
              placeholder="Search scripts..."
              className="pl-10"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredImportScripts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No scripts found</p>
              </div>
            ) : (
              filteredImportScripts.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-xl border border-border hover:border-primary/50 cursor-pointer transition-colors"
                  onClick={() => handleImportScript(s.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">{s.title}</h4>
                      {s.hook && (
                        <p className="text-sm text-muted-foreground italic truncate mt-1">
                          "{s.hook}"
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {s.body}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground ml-2 shrink-0">
                      {s.word_count} words
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
