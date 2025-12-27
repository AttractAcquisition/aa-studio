import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { GripVertical, Clock } from "lucide-react";
import type { Scene, PlanJson } from "@/types/video-generator";

interface SceneEditorProps {
  planJson: PlanJson;
  onChange: (planJson: PlanJson) => void;
  disabled?: boolean;
}

export function SceneEditor({ planJson, onChange, disabled }: SceneEditorProps) {
  const totalDuration = planJson.scenes.reduce((sum, s) => sum + (s.sec || 0), 0);
  const isValidDuration = totalDuration >= 55 && totalDuration <= 65;

  const updateScene = (index: number, updates: Partial<Scene>) => {
    const newScenes = [...planJson.scenes];
    newScenes[index] = { ...newScenes[index], ...updates };
    onChange({ ...planJson, scenes: newScenes });
  };

  const getSceneLabel = (scene: Scene, index: number) => {
    switch (scene.type) {
      case "angleCard":
        return `${scene.n || index + 1}. ${scene.name || "Angle Card"}`;
      default:
        return `${index + 1}. ${scene.type}`;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            Total Duration: 
            <span className={isValidDuration ? "text-green-500" : "text-destructive"}>
              {" "}{totalDuration}s
            </span>
          </span>
        </div>
        <Badge variant={isValidDuration ? "default" : "destructive"}>
          {isValidDuration ? "Valid (55-65s)" : "Invalid duration"}
        </Badge>
      </div>

      <Accordion type="multiple" className="space-y-2">
        {planJson.scenes.map((scene, index) => (
          <AccordionItem 
            key={index} 
            value={`scene-${index}`}
            className="border border-border rounded-xl bg-card"
          >
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-3 w-full">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
                <Badge variant="outline" className="capitalize">
                  {scene.type}
                </Badge>
                <span className="text-sm font-medium">
                  {getSceneLabel(scene, index)}
                </span>
                <span className="ml-auto text-xs text-muted-foreground mr-2">
                  {scene.sec}s
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Duration (seconds)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={scene.sec}
                      onChange={(e) => updateScene(index, { sec: parseInt(e.target.value) || 1 })}
                      disabled={disabled}
                    />
                  </div>
                </div>

                {scene.type === "hook" && (
                  <>
                    <div>
                      <Label>Headline</Label>
                      <Input
                        value={scene.headline || ""}
                        onChange={(e) => updateScene(index, { headline: e.target.value })}
                        placeholder="Main hook headline"
                        disabled={disabled}
                      />
                    </div>
                    <div>
                      <Label>Highlight</Label>
                      <Input
                        value={scene.highlight || ""}
                        onChange={(e) => updateScene(index, { highlight: e.target.value })}
                        placeholder="Highlighted text"
                        disabled={disabled}
                      />
                    </div>
                  </>
                )}

                {scene.type === "ruleChips" && (
                  <>
                    <div>
                      <Label>Chips (comma separated)</Label>
                      <Input
                        value={(scene.chips || []).join(", ")}
                        onChange={(e) => updateScene(index, { 
                          chips: e.target.value.split(",").map(s => s.trim()).filter(Boolean) 
                        })}
                        placeholder="OFFER, CTA, PROOF"
                        disabled={disabled}
                      />
                    </div>
                    <div>
                      <Label>Line</Label>
                      <Input
                        value={scene.line || ""}
                        onChange={(e) => updateScene(index, { line: e.target.value })}
                        placeholder="Supporting text"
                        disabled={disabled}
                      />
                    </div>
                  </>
                )}

                {scene.type === "method" && (
                  <>
                    <div>
                      <Label>Headline</Label>
                      <Input
                        value={scene.headline || ""}
                        onChange={(e) => updateScene(index, { headline: e.target.value })}
                        disabled={disabled}
                      />
                    </div>
                    <div>
                      <Label>Subheadline</Label>
                      <Input
                        value={scene.sub || ""}
                        onChange={(e) => updateScene(index, { sub: e.target.value })}
                        disabled={disabled}
                      />
                    </div>
                  </>
                )}

                {scene.type === "angleCard" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Card Number</Label>
                        <Input
                          type="number"
                          value={scene.n || 1}
                          onChange={(e) => updateScene(index, { n: parseInt(e.target.value) || 1 })}
                          disabled={disabled}
                        />
                      </div>
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={scene.name || ""}
                          onChange={(e) => updateScene(index, { name: e.target.value })}
                          disabled={disabled}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Line</Label>
                      <Input
                        value={scene.line || ""}
                        onChange={(e) => updateScene(index, { line: e.target.value })}
                        disabled={disabled}
                      />
                    </div>
                    <div>
                      <Label>Example</Label>
                      <Input
                        value={scene.example || ""}
                        onChange={(e) => updateScene(index, { example: e.target.value })}
                        disabled={disabled}
                      />
                    </div>
                  </>
                )}

                {scene.type === "threeStep" && (
                  <div>
                    <Label>Steps (comma separated)</Label>
                    <Input
                      value={(scene.steps || []).join(", ")}
                      onChange={(e) => updateScene(index, { 
                        steps: e.target.value.split(",").map(s => s.trim()) 
                      })}
                      placeholder="Step 1, Step 2, Step 3"
                      disabled={disabled}
                    />
                  </div>
                )}

                {scene.type === "winnerLoop" && (
                  <div>
                    <Label>Lines (comma separated)</Label>
                    <Input
                      value={(scene.lines || []).join(", ")}
                      onChange={(e) => updateScene(index, { 
                        lines: e.target.value.split(",").map(s => s.trim()) 
                      })}
                      placeholder="Line 1, Line 2, Line 3"
                      disabled={disabled}
                    />
                  </div>
                )}

                {scene.type === "testDashboard" && (
                  <>
                    <div>
                      <Label>Headline</Label>
                      <Input
                        value={scene.headline || ""}
                        onChange={(e) => updateScene(index, { headline: e.target.value })}
                        disabled={disabled}
                      />
                    </div>
                    <div>
                      <Label>Subheadline</Label>
                      <Input
                        value={scene.sub || ""}
                        onChange={(e) => updateScene(index, { sub: e.target.value })}
                        disabled={disabled}
                      />
                    </div>
                  </>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
