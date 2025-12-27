import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import type { PlanJson } from "@/types/video-generator";
import { AA_BRAND, ALLOWED_SCENE_TYPES } from "@/types/video-generator";

interface OnBrandCheckProps {
  planJson: PlanJson | null;
}

interface CheckItem {
  label: string;
  passed: boolean;
  message?: string;
}

export function OnBrandCheck({ planJson }: OnBrandCheckProps) {
  if (!planJson) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
            On-Brand Check
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Generate a plan to see checks</p>
        </CardContent>
      </Card>
    );
  }

  const checks: CheckItem[] = [];

  // Check allowed scenes only
  const allScenesValid = planJson.scenes.every(s => 
    ALLOWED_SCENE_TYPES.includes(s.type as any)
  );
  checks.push({
    label: "Allowed scenes only",
    passed: allScenesValid,
    message: allScenesValid ? undefined : "Contains invalid scene types",
  });

  // Check required fields
  let missingFields: string[] = [];
  planJson.scenes.forEach((scene, i) => {
    if (scene.type === "hook" && !scene.headline) {
      missingFields.push(`Scene ${i + 1}: hook missing headline`);
    }
    if (scene.type === "ruleChips" && (!scene.chips || scene.chips.length === 0)) {
      missingFields.push(`Scene ${i + 1}: ruleChips missing chips`);
    }
    if (scene.type === "method" && !scene.headline) {
      missingFields.push(`Scene ${i + 1}: method missing headline`);
    }
    if (scene.type === "angleCard" && !scene.name) {
      missingFields.push(`Scene ${i + 1}: angleCard missing name`);
    }
  });
  checks.push({
    label: "Required fields present",
    passed: missingFields.length === 0,
    message: missingFields.length > 0 ? missingFields.slice(0, 2).join("; ") : undefined,
  });

  // Check duration
  const totalDuration = planJson.scenes.reduce((sum, s) => sum + (s.sec || 0), 0);
  const durationValid = totalDuration >= 55 && totalDuration <= 65;
  checks.push({
    label: "Duration 55-65s",
    passed: durationValid,
    message: durationValid ? undefined : `Current: ${totalDuration}s`,
  });

  // Check AA colors
  const colorsLocked = 
    planJson.brand.bg === AA_BRAND.bg &&
    planJson.brand.primary === AA_BRAND.primary &&
    planJson.brand.secondary === AA_BRAND.secondary &&
    planJson.brand.soft === AA_BRAND.soft;
  checks.push({
    label: "AA colors locked",
    passed: colorsLocked,
    message: colorsLocked ? undefined : "Brand colors modified",
  });

  const passedCount = checks.filter(c => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">On-Brand Check</CardTitle>
          <Badge 
            variant={score === 100 ? "default" : score >= 75 ? "secondary" : "destructive"}
            className="text-xs"
          >
            {score}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {checks.map((check, i) => (
          <div key={i} className="flex items-start gap-2">
            {check.passed ? (
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{check.label}</p>
              {check.message && (
                <p className="text-xs text-muted-foreground truncate">{check.message}</p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
