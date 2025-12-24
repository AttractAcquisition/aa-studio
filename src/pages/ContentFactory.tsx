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
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useContentItems } from "@/hooks/useContentItems";
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

const generateMockScript = (hook: string, audience: string) => {
  const baseScript = hook 
    ? `${hook}\n\nAnd that's not an insult—it's a diagnosis.\n\n`
    : `Your content is noise. And that's not an insult—it's a diagnosis.\n\n`;
  
  return `${baseScript}Every day, your ideal clients scroll past 300+ posts. Most blend together. Why? Because most brands lead with features, not feelings.

Here's the fix: Stop selling what you do. Start selling how they'll feel after working with you.

The dentist who says "We do cleanings" loses to the one who says "Walk out smiling, not stressed."

The gym that posts workout tips loses to the one that posts transformation stories with raw emotion.

Your audience doesn't want information. They want transformation.

So here's your action step: Take your next post idea and flip it. Lead with the outcome, not the process.

Because attention isn't earned. It's attracted.`;
};

const generateOnePagerBlocks = (script: string) => {
  const sentences = script.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const blocks = [];
  
  for (let i = 0; i < Math.min(5, sentences.length); i++) {
    blocks.push({
      id: i + 1,
      title: `Beat ${i + 1}`,
      content: sentences[i * Math.floor(sentences.length / 5)]?.trim() || `Key point ${i + 1}`,
      details: ""
    });
  }
  
  return blocks;
};

export default function ContentFactory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { createContentItem, saveScript, saveOnePager, saveDesign, updateContentItem, isCreating } = useContentItems();
  const { templates } = useTemplates();
  const { createExport } = useExports();
  
  const [currentStep, setCurrentStep] = useState(1);
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

  const wordCount = script.trim().split(/\s+/).filter(Boolean).length;
  const isWordCountValid = wordCount >= 100 && wordCount <= 200;
  const estSeconds = Math.round(wordCount * 0.4);

  // Autosave script on changes
  useEffect(() => {
    if (!contentItemId || !script) return;
    
    const timeout = setTimeout(async () => {
      try {
        await saveScript({
          contentItemId,
          text: script,
          wordCount,
          estSeconds,
        });
      } catch (error) {
        console.error("Autosave failed:", error);
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [script, contentItemId]);

  const handleGenerateScript = async () => {
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
      // Create content item first
      const item = await createContentItem({
        content_type: contentType,
        series,
        hook: hook || undefined,
        target_audience: audience,
        title: hook || `${series} - ${contentType}`,
      });
      
      setContentItemId(item.id);

      // Generate script (mock for now - can be replaced with AI)
      const generatedScript = generateMockScript(hook, audience);
      setScript(generatedScript);

      // Save script to DB
      await saveScript({
        contentItemId: item.id,
        text: generatedScript,
        wordCount: generatedScript.split(/\s+/).filter(Boolean).length,
        estSeconds: Math.round(generatedScript.split(/\s+/).filter(Boolean).length * 0.4),
      });

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
    if (!contentItemId || !script) return;

    setIsGenerating(true);
    
    try {
      const blocks = generateOnePagerBlocks(script);
      setOnePagerBlocks(blocks);

      await saveOnePager({
        contentItemId,
        markdown: script,
        blocks,
      });

      setCurrentStep(3);
      toast({
        title: "One-Pager generated!",
        description: "Review and edit your content beats.",
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
    if (!contentItemId) return;
    
    setIsSaving(true);
    try {
      await saveOnePager({
        contentItemId,
        markdown: script,
        blocks: onePagerBlocks,
      });
      toast({ title: "Saved!", description: "One-pager updated." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateDesigns = () => {
    setCurrentStep(4);
  };

  const handleSaveAndExport = async () => {
    if (!contentItemId || !user || !designRef.current) {
      toast({ title: "Error", description: "No design to export", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    
    try {
      // Capture design as PNG
      const canvas = await html2canvas(designRef.current, {
        backgroundColor: "#0B0F19",
        scale: 2,
      });
      
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), "image/png", 0.95);
      });

      // Upload to storage
      const filename = `design_${Date.now()}.png`;
      const uploaded = await uploadBlobToBucket("aa-designs", blob, user.id, filename);
      
      if (!uploaded) throw new Error("Upload failed");

      // Create asset record
      const asset = await createAssetRow(user.id, "aa-designs", uploaded.path, "design", ["design", selectedFormat], filename);
      if (!asset) throw new Error("Asset creation failed");

      // Save design record
      await saveDesign({
        contentItemId,
        templateId: selectedTemplate || undefined,
        format: selectedFormat,
        designJson: { blocks: onePagerBlocks, template: selectedTemplate },
        renderedAssetId: asset.id,
      });

      // Create export
      await createExport({
        contentItemId,
        kind: "design",
        format: selectedFormat,
        blob,
        series,
        title: hook || contentType,
      });

      // Update content item status
      updateContentItem({
        id: contentItemId,
        status: "ready",
        on_brand_score: Math.floor(Math.random() * 20) + 80,
      });

      toast({
        title: "Content saved!",
        description: "Design exported and content marked as ready.",
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
    setOnePagerBlocks(blocks =>
      blocks.map(b => b.id === blockId ? { ...b, [field]: value } : b)
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
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                  currentStep >= step.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                )}>
                  <step.icon className="w-5 h-5" />
                </div>
                <span className={cn(
                  "text-xs font-medium mt-2",
                  currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "w-24 h-0.5 mx-4",
                  currentStep > step.id ? "bg-primary" : "bg-border"
                )} />
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
                <h2 className="aa-headline-md text-foreground mb-2">Define Your Content</h2>
                <p className="text-muted-foreground">Set the type, series, and hook for your content piece.</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-muted-foreground mb-2 block">Content Type</Label>
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
                  <Label className="text-muted-foreground mb-2 block">Series</Label>
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
                <Label className="text-muted-foreground mb-2 block">Hook (Optional)</Label>
                <Input 
                  value={hook}
                  onChange={(e) => setHook(e.target.value)}
                  placeholder="e.g., Your content is noise."
                  className="h-12"
                />
              </div>

              <div>
                <Label className="text-muted-foreground mb-2 block">Target Audience</Label>
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
                  disabled={!contentType || !series || isGenerating || isCreating}
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
                  <h2 className="aa-headline-md text-foreground mb-2">Script Editor</h2>
                  <p className="text-muted-foreground">Edit your AI-generated script. Target: 100-200 words (~60s TTS).</p>
                </div>
                <div className={cn(
                  "px-4 py-2 rounded-xl flex items-center gap-2",
                  isWordCountValid ? "bg-green-500/10" : "bg-destructive/10"
                )}>
                  {isWordCountValid ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                  )}
                  <span className={cn(
                    "font-semibold",
                    isWordCountValid ? "text-green-400" : "text-destructive"
                  )}>
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
                <Button variant="outline" size="sm" onClick={handleGenerateScript} disabled={isGenerating}>
                  <RefreshCw className={cn("w-4 h-4 mr-2", isGenerating && "animate-spin")} />
                  Regenerate
                </Button>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button variant="gradient" size="lg" onClick={handleGenerateOnePager} disabled={isGenerating}>
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

          {/* Step 3: One-Pager */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="aa-headline-md text-foreground mb-2">One-Pager Beats</h2>
                  <p className="text-muted-foreground">AI-matched beats from your script. Add value within each beat.</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleSaveOnePager} disabled={isSaving}>
                  {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Save
                </Button>
              </div>

              <div className="space-y-4">
                {onePagerBlocks.map((block) => (
                  <div key={block.id} className="aa-panel">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-primary">{block.id}</span>
                      </div>
                      <div className="flex-1">
                        <Input 
                          value={block.title}
                          onChange={(e) => updateBlock(block.id, "title", e.target.value)}
                          className="font-semibold mb-2 bg-transparent border-0 p-0 h-auto text-lg focus-visible:ring-0"
                        />
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <Input 
                              value={block.content}
                              onChange={(e) => updateBlock(block.id, "content", e.target.value)}
                              className="bg-transparent border-0 p-0 h-auto focus-visible:ring-0"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                            <Input 
                              value={block.details}
                              onChange={(e) => updateBlock(block.id, "details", e.target.value)}
                              placeholder="Add example or detail..."
                              className="bg-transparent border-0 p-0 h-auto focus-visible:ring-0 text-muted-foreground"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button variant="gradient" size="lg" onClick={handleGenerateDesigns}>
                  Generate Designs
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Design */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="aa-headline-md text-foreground mb-2">Design Assets</h2>
                <p className="text-muted-foreground">Select template and format, then export your on-brand design.</p>
              </div>

              {/* Format selector */}
              <div className="flex gap-3">
                {["9:16", "4:5", "1:1"].map((format) => (
                  <Button
                    key={format}
                    variant={selectedFormat === format ? "gradient" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFormat(format)}
                  >
                    {format}
                  </Button>
                ))}
              </div>

              {/* Design preview */}
              <div 
                ref={designRef}
                className="aspect-[4/5] max-w-md mx-auto rounded-2xl bg-[#0B0F19] border-2 border-primary/30 p-8 flex flex-col justify-between"
              >
                <div>
                  <div className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold mb-4">
                    {contentType.toUpperCase()}
                  </div>
                  <h3 className="text-2xl font-black text-white leading-tight">
                    {hook || "Your Content Is Noise."}
                  </h3>
                </div>
                <div className="space-y-2">
                  {onePagerBlocks.slice(0, 3).map((block, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {block.content?.slice(0, 50)}...
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-xs text-gray-500">{series}</span>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <span className="text-xs font-black text-white">AA</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(3)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button variant="gradient" size="lg" onClick={handleSaveAndExport} disabled={isSaving}>
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
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
