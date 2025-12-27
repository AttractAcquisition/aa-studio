import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVideoGenerator } from "@/hooks/useVideoGenerator";
import { SceneEditor } from "@/components/video-generator/SceneEditor";
import { OnBrandCheck } from "@/components/video-generator/OnBrandCheck";
import { RecentRenders } from "@/components/video-generator/RecentRenders";
import { PRESETS, type PresetName } from "@/types/video-generator";
import { Check, Play, Save, RefreshCw, Copy, ExternalLink, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";

const STEPS = ["Script", "Scene Plan", "Create Render", "Render Video", "Output"];

export default function VideoGenerator() {
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [scriptText, setScriptText] = useState("");
  const [preset, setPreset] = useState<PresetName>("Angle Testing");
  const [polling, setPolling] = useState(false);
  
  const {
    loading, script, plan, render, recentRenders,
    saveScript, generatePlan, updatePlan, approvePlan,
    createRender, startRender, checkRenderStatus, loadRecentRenders, reset
  } = useVideoGenerator();

  const wordCount = scriptText.trim().split(/\s+/).filter(Boolean).length;
  const wordCountWarning = wordCount < 120 || wordCount > 180;

  useEffect(() => { loadRecentRenders(); }, [loadRecentRenders]);

  useEffect(() => {
    if (polling && render?.id && render.status === "rendering") {
      const interval = setInterval(async () => {
        const result = await checkRenderStatus(render.id);
        if (result?.status === "done" || result?.status === "failed") {
          setPolling(false);
          if (result.status === "done") setStep(4);
        }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [polling, render, checkRenderStatus]);

  const handleSaveScript = async () => {
    const result = await saveScript(title, scriptText);
    if (result) setStep(1);
  };

  const handleGeneratePlan = async () => {
    if (!script) return;
    await generatePlan(script.id, preset);
  };

  const handleApprovePlan = async () => {
    if (!plan) return;
    const ok = await approvePlan(plan.id);
    if (ok) setStep(2);
  };

  const handleCreateRender = async () => {
    if (!script || !plan) return;
    const result = await createRender(script.id, plan.id);
    if (result) setStep(3);
  };

  const handleStartRender = async () => {
    if (!render) return;
    setPolling(true);
    await startRender(render.id);
  };

  const copyVideoUrl = () => {
    if (render?.video_url) {
      navigator.clipboard.writeText(render.video_url);
      toast.success("URL copied");
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Badge className="bg-primary/20 text-primary border-primary/30">VIDEO GENERATOR</Badge>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Generate AA faceless videos</h1>
          <p className="text-muted-foreground mt-1">Script → Scene Plan → Render → MP4</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Stepper */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step indicators */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {STEPS.map((s, i) => (
                <Badge key={i} variant={step >= i ? "default" : "outline"} className="whitespace-nowrap">
                  {i + 1}. {s}
                </Badge>
              ))}
            </div>

            {/* Step 1: Script */}
            {step === 0 && (
              <Card className="bg-card border-border">
                <CardHeader><CardTitle>Step 1: Script</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Title (optional)</Label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Video title" />
                  </div>
                  <div>
                    <Label>Script (required)</Label>
                    <Textarea value={scriptText} onChange={e => setScriptText(e.target.value)} rows={8} placeholder="Enter your script..." />
                    <p className={`text-xs mt-1 ${wordCountWarning ? "text-destructive" : "text-muted-foreground"}`}>
                      {wordCount} words {wordCountWarning && "(aim for 120-180)"}
                    </p>
                  </div>
                  <Button onClick={handleSaveScript} disabled={loading || !scriptText.trim()}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Script
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Scene Plan */}
            {step === 1 && (
              <Card className="bg-card border-border">
                <CardHeader><CardTitle>Step 2: Scene Plan</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <Select value={preset} onValueChange={v => setPreset(v as PresetName)}>
                      <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PRESETS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleGeneratePlan} disabled={loading}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                      {plan ? "Regenerate" : "Generate"} Plan
                    </Button>
                  </div>
                  {plan && (
                    <>
                      <SceneEditor planJson={plan.plan_json} onChange={json => updatePlan(plan.id, json)} disabled={loading || plan.is_approved} />
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => updatePlan(plan.id, plan.plan_json)} disabled={loading}>Validate Plan</Button>
                        <Button onClick={handleApprovePlan} disabled={loading || plan.is_approved}>
                          <Check className="w-4 h-4 mr-2" />{plan.is_approved ? "Approved" : "Approve Plan"}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 3: Create Render Job */}
            {step === 2 && (
              <Card className="bg-card border-border">
                <CardHeader><CardTitle>Step 3: Create Render Job</CardTitle></CardHeader>
                <CardContent>
                  <Button onClick={handleCreateRender} disabled={loading || !plan?.is_approved}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Create Render Job
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Render Video */}
            {step === 3 && (
              <Card className="bg-card border-border">
                <CardHeader><CardTitle>Step 4: Render Video</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {render && <Badge variant="outline">{render.status}</Badge>}
                  <Button onClick={handleStartRender} disabled={loading || polling || render?.status === "done"}>
                    {polling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                    Render Video
                  </Button>
                  {render?.error && <p className="text-sm text-destructive">{render.error}</p>}
                </CardContent>
              </Card>
            )}

            {/* Step 5: Output */}
            {step === 4 && render?.status === "done" && (
              <Card className="bg-card border-border">
                <CardHeader><CardTitle>Step 5: Output</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {render.video_url && (
                    <video src={render.video_url} controls className="w-full max-w-md rounded-xl border border-border" />
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={copyVideoUrl}><Copy className="w-4 h-4 mr-2" />Copy URL</Button>
                    <Button variant="outline" onClick={() => window.open(render.video_url!, "_blank")}>
                      <ExternalLink className="w-4 h-4 mr-2" />Open
                    </Button>
                    <Button variant="outline"><Calendar className="w-4 h-4 mr-2" />Add to Calendar</Button>
                  </div>
                  <Button variant="ghost" onClick={() => { reset(); setStep(0); setTitle(""); setScriptText(""); }}>
                    Start New Video
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: QA Widgets */}
          <div className="space-y-4">
            <OnBrandCheck planJson={plan?.plan_json || null} />
            <RecentRenders renders={recentRenders} onOpen={r => r.video_url && window.open(r.video_url, "_blank")} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
