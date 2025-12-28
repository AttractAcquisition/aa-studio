import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, AlertTriangle } from "lucide-react";
import type { PlanJson } from "@/types/plan";
import { AA_BRAND, ALLOWED_SCENE_TYPES } from "@/types/plan";
import { getPlanWarnings, type ValidationWarning } from "@/lib/plan/validatePlan";

interface OnBrandCheckProps {
  planJson: PlanJson | null;
}

export function OnBrandCheck({ planJson }: OnBrandCheckProps) {
  if (!planJson) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
            Plan QA Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Generate a plan to see checks</p>
        </CardContent>
      </Card>
    );
  }

  // Get warnings from validator
  const warnings = getPlanWarnings(planJson);
  const criticalWarnings = warnings.filter(w => w.severity === "high");
  const mediumWarnings = warnings.filter(w => w.severity === "medium");
  
  // Calculate totals
  const totalDuration = planJson.scenes.reduce((sum, s) => sum + (s.sec || 0), 0);
  const durationValid = totalDuration >= 55 && totalDuration <= 65;
  
  // Check brand colors
  const colorsLocked = 
    planJson.brand?.bg === AA_BRAND.bg &&
    planJson.brand?.primary === AA_BRAND.primary &&
    planJson.brand?.secondary === AA_BRAND.secondary &&
    planJson.brand?.soft === AA_BRAND.soft;
  
  // Check all scenes valid
  const allScenesValid = planJson.scenes.every(s => 
    ALLOWED_SCENE_TYPES.includes(s.type as any)
  );
  
  // Calculate score
  const totalChecks = 4; // scenes, duration, colors, no critical warnings
  let passed = 0;
  if (allScenesValid) passed++;
  if (durationValid) passed++;
  if (colorsLocked) passed++;
  if (criticalWarnings.length === 0) passed++;
  const score = Math.round((passed / totalChecks) * 100);
  
  const canRender = criticalWarnings.length === 0 && durationValid && colorsLocked;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Plan QA Preview</CardTitle>
          <Badge 
            variant={score === 100 ? "default" : score >= 75 ? "secondary" : "destructive"}
            className="text-xs"
          >
            {score}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick checks */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {allScenesValid ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-destructive" />}
            <span className="text-sm">Allowed scenes only</span>
          </div>
          <div className="flex items-center gap-2">
            {durationValid ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-destructive" />}
            <span className="text-sm">Duration 55-65s ({totalDuration}s)</span>
          </div>
          <div className="flex items-center gap-2">
            {colorsLocked ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-destructive" />}
            <span className="text-sm">AA colors locked</span>
          </div>
          <div className="flex items-center gap-2">
            {criticalWarnings.length === 0 ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-destructive" />}
            <span className="text-sm">Required fields present</span>
          </div>
        </div>
        
        {/* Scene summary */}
        <div className="border-t border-border pt-3">
          <p className="text-xs text-muted-foreground mb-2">Scenes ({planJson.scenes.length})</p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {planJson.scenes.map((scene, i) => {
              const sceneWarnings = warnings.filter(w => w.sceneIndex === i);
              const hasIssue = sceneWarnings.some(w => w.severity === "high");
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {hasIssue ? (
                    <AlertTriangle className="w-3 h-3 text-destructive" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                  )}
                  <span className="font-mono">{i + 1}.</span>
                  <Badge variant="outline" className="text-[10px] h-4">{scene.type}</Badge>
                  <span className="text-muted-foreground">{scene.sec}s</span>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Critical warnings */}
        {criticalWarnings.length > 0 && (
          <div className="border-t border-border pt-3">
            <p className="text-xs text-destructive font-medium mb-2">Blocking Issues ({criticalWarnings.length})</p>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {criticalWarnings.slice(0, 5).map((w, i) => (
                <p key={i} className="text-xs text-destructive">{w.message}</p>
              ))}
            </div>
          </div>
        )}
        
        {/* Render status */}
        <div className="border-t border-border pt-3">
          <Badge variant={canRender ? "default" : "destructive"} className="w-full justify-center">
            {canRender ? "Ready to Render" : "Fix issues before rendering"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
