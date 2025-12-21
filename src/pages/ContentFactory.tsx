import { useState } from "react";
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
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

const contentTypes = [
  { value: "attraction-psychology", label: "Attraction Psychology" },
  { value: "framework", label: "Framework" },
  { value: "service-in-action", label: "Service-in-Action" },
  { value: "proof", label: "Proof" },
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

export default function ContentFactory() {
  const [currentStep, setCurrentStep] = useState(1);
  const [contentType, setContentType] = useState("");
  const [series, setSeries] = useState("");
  const [hook, setHook] = useState("");
  const [audience, setAudience] = useState("Physical/local businesses");
  const [script, setScript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const wordCount = script.trim().split(/\s+/).filter(Boolean).length;
  const isWordCountValid = wordCount >= 140 && wordCount <= 160;

  const handleGenerateScript = () => {
    setIsGenerating(true);
    // Simulate AI generation
    setTimeout(() => {
      setScript(`Your content is noise. And that's not an insult—it's a diagnosis.

Every day, your ideal clients scroll past 300+ posts. Most blend together. Why? Because most brands lead with features, not feelings.

Here's the fix: Stop selling what you do. Start selling how they'll feel after working with you.

The dentist who says "We do cleanings" loses to the one who says "Walk out smiling, not stressed."

The gym that posts workout tips loses to the one that posts transformation stories with raw emotion.

Your audience doesn't want information. They want transformation.

So here's your action step: Take your next post idea and flip it. Lead with the outcome, not the process.

Because attention isn't earned. It's attracted.`);
      setIsGenerating(false);
      setCurrentStep(2);
    }, 2000);
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
                  <h2 className="aa-headline-md text-foreground mb-2">Script Editor</h2>
                  <p className="text-muted-foreground">Edit your AI-generated script. Target: 140-160 words (~60s TTS).</p>
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
                    {wordCount} / 160 words
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
                <Button variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate
                </Button>
                <Button variant="outline" size="sm">
                  <Wand2 className="w-4 h-4 mr-2" />
                  Punch Up Hook
                </Button>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button variant="gradient" size="lg" onClick={() => setCurrentStep(3)}>
                  Generate One-Pager
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: One-Pager */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="aa-headline-md text-foreground mb-2">One-Pager Beats</h2>
                <p className="text-muted-foreground">AI-matched beats from your script. Add value within each beat.</p>
              </div>

              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((beat) => (
                  <div key={beat} className="aa-panel">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-primary">{beat}</span>
                      </div>
                      <div className="flex-1">
                        <Input 
                          defaultValue={`Beat ${beat} Title`}
                          className="font-semibold mb-2 bg-transparent border-0 p-0 h-auto text-lg focus-visible:ring-0"
                        />
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <Input 
                              defaultValue="Key point from script"
                              className="bg-transparent border-0 p-0 h-auto focus-visible:ring-0"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                            <Input 
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
                <Button variant="gradient" size="lg" onClick={() => setCurrentStep(4)}>
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
                <p className="text-muted-foreground">Select templates and generate your on-brand designs.</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {["Reel Cover", "One-Pager Scroll", "Bold Text Card"].map((template) => (
                  <div key={template} className="aspect-[4/5] rounded-2xl bg-deep-ink border-2 border-primary/30 flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 mx-auto mb-3 flex items-center justify-center">
                        <Image className="w-6 h-6 text-primary" />
                      </div>
                      <p className="font-medium text-foreground text-sm">{template}</p>
                      <p className="text-xs text-muted-foreground mt-1">Click to generate</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(3)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button variant="gradient" size="lg">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save & Export All
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
