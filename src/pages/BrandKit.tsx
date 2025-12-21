import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Palette, 
  Type, 
  Square, 
  Upload,
  Check,
  Lock,
  Eye
} from "lucide-react";

const brandColors = [
  { name: "Deep Ink", value: "#0B0F19", variable: "--deep-ink" },
  { name: "Deep Purple", value: "#6A00F4", variable: "--deep-purple" },
  { name: "Electric Purple", value: "#9D4BFF", variable: "--electric-purple" },
  { name: "Light Lavender", value: "#EBD7FF", variable: "--light-lavender" },
  { name: "White", value: "#FFFFFF", variable: "--pure-white" },
];

const brandRules = [
  { id: "high-contrast", label: "High Contrast", description: "Dark backgrounds with bright accents", locked: true },
  { id: "minimal-layout", label: "Minimal Layout", description: "Big margins, clean spacing", locked: true },
  { id: "single-accent", label: "One Accent Per Design", description: "Focus on single highlight color", locked: true },
  { id: "big-type", label: "Bold Typography", description: "ExtraBold headlines, large sizes", locked: true },
  { id: "aa-monogram", label: "AA Monogram Placement", description: "Bottom-right corner standard", locked: true },
];

export default function BrandKit() {
  const [cornerRadius, setCornerRadius] = useState("24");
  const [headlineWeight, setHeadlineWeight] = useState("800");
  
  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="mb-10">
          <div className="aa-pill-primary mb-4">Brand Kit</div>
          <h1 className="aa-headline-lg text-foreground">
            Brand <span className="aa-gradient-text">Tokens</span>
          </h1>
          <p className="aa-body mt-2 max-w-lg">
            Define your visual identity. These tokens power all template designs.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Color Palette */}
          <div className="lg:col-span-2 space-y-8">
            <div className="aa-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">Color Palette</h2>
                  <p className="text-sm text-muted-foreground">AA brand colors</p>
                </div>
              </div>
              
              <div className="grid grid-cols-5 gap-4">
                {brandColors.map((color) => (
                  <div key={color.name} className="group">
                    <div 
                      className="aspect-square rounded-2xl border border-border mb-3 transition-transform group-hover:scale-105 cursor-pointer"
                      style={{ backgroundColor: color.value }}
                    />
                    <p className="font-medium text-sm text-foreground">{color.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{color.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Typography */}
            <div className="aa-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Type className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">Typography</h2>
                  <p className="text-sm text-muted-foreground">Font settings</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-muted-foreground mb-2 block">Primary Font</Label>
                    <div className="p-4 rounded-xl bg-secondary flex items-center justify-between">
                      <span className="font-semibold text-foreground">Inter</span>
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground mb-2 block">Fallback</Label>
                    <div className="p-4 rounded-xl bg-secondary flex items-center justify-between">
                      <span className="font-semibold text-foreground">SF Pro / Helvetica</span>
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-6 rounded-2xl bg-secondary">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Headline XL</p>
                    <p className="text-5xl font-black text-foreground">Your Content Is Noise.</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-secondary">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Headline LG</p>
                    <p className="text-3xl font-extrabold text-foreground">Stop Chasing. Start Attracting.</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-secondary">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Body</p>
                    <p className="text-base text-muted-foreground">The brands that win don't chase attention. They attract it through strategic positioning and magnetic content.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Layout */}
            <div className="aa-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Square className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">Layout Rules</h2>
                  <p className="text-sm text-muted-foreground">Spacing and corners</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-muted-foreground mb-2 block">Corner Radius</Label>
                  <div className="flex items-center gap-3">
                    <Input 
                      type="number" 
                      value={cornerRadius} 
                      onChange={(e) => setCornerRadius(e.target.value)}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">px</span>
                    <div 
                      className="w-16 h-16 bg-primary"
                      style={{ borderRadius: `${cornerRadius}px` }}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground mb-2 block">Content Margins</Label>
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-xl bg-secondary">
                      <span className="font-mono text-sm text-foreground">80–110px</span>
                    </div>
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Brand Rules */}
            <div className="aa-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">Brand Rules</h2>
                  <p className="text-sm text-muted-foreground">Locked guardrails</p>
                </div>
              </div>

              <div className="space-y-4">
                {brandRules.map((rule) => (
                  <div key={rule.id} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{rule.label}</p>
                      <p className="text-xs text-muted-foreground">{rule.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Brand Assets */}
            <div className="aa-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">Brand Assets</h2>
                  <p className="text-sm text-muted-foreground">Logos & references</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-6 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer text-center">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent mx-auto flex items-center justify-center mb-3">
                    <span className="text-xl font-black text-primary-foreground">AA</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">AA Monogram</p>
                  <p className="text-xs text-muted-foreground">White transparent • Uploaded</p>
                </div>

                <Button variant="outline" className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Reference Images
                </Button>
              </div>
            </div>

            {/* Preview Button */}
            <Button variant="gradient" className="w-full gap-2">
              <Eye className="w-4 h-4" />
              Preview Templates
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
