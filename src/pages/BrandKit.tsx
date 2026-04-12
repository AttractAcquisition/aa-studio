import { useState, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Palette, 
  Type, 
  Square, 
  Upload,
  Check,
  Lock,
  Eye,
  RefreshCw,
  X,
  Save
} from "lucide-react";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { uploadBlobToBucket, createAssetRow, getAssetPublicUrl } from "@/lib/supabase-helpers";

const defaultBrandColors = [
  { name: "Deep Ink", value: "#0B0F19", variable: "--deep-ink" },
  { name: "Deep Purple", value: "#6A00F4", variable: "--deep-purple" },
  { name: "Electric Purple", value: "#9D4BFF", variable: "--electric-purple" },
  { name: "Light Lavender", value: "#EBD7FF", variable: "--light-lavender" },
  { name: "White", value: "#FFFFFF", variable: "--pure-white" },
];

const defaultBrandRules = [
  { id: "high-contrast", label: "High Contrast", description: "Dark backgrounds with bright accents", locked: true },
  { id: "minimal-layout", label: "Minimal Layout", description: "Big margins, clean spacing", locked: true },
  { id: "single-accent", label: "One Accent Per Design", description: "Focus on single highlight color", locked: true },
  { id: "big-type", label: "Bold Typography", description: "ExtraBold headlines, large sizes", locked: true },
  { id: "aa-monogram", label: "AA Monogram Placement", description: "Bottom-right corner standard", locked: true },
];

export default function BrandKit() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { brandSettings, isLoading, updateBrandSettings, isUpdating } = useBrandSettings();
  const monogramInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);

  const palette = (brandSettings?.palette as Record<string, string>) || {};
  const typography = (brandSettings?.typography as Record<string, string>) || {};
  const rules = (brandSettings?.rules as Record<string, any>) || {};
  const brandAssets = (brandSettings?.brand_assets as Record<string, any>) || {};

  const brandColors = defaultBrandColors.map(c => ({
    ...c,
    value: palette[c.variable] || c.value,
  }));

  const handleColorChange = (variable: string, value: string) => {
    updateBrandSettings({
      palette: { ...palette, [variable]: value }
    });
  };

  const handleUploadMonogram = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const blob = new Blob([await file.arrayBuffer()], { type: file.type });
      const uploaded = await uploadBlobToBucket("aa-brand", blob, user.id, `monogram_${Date.now()}.png`);
      
      if (!uploaded) throw new Error("Upload failed");

      const asset = await createAssetRow(user.id, "aa-brand", uploaded.path, "monogram", ["brand", "logo"], file.name);
      
      updateBrandSettings({
        brand_assets: {
          ...brandAssets,
          monogram: {
            assetId: asset?.id,
            path: uploaded.path,
            url: uploaded.publicUrl,
            name: file.name,
          }
        }
      });

      toast({ title: "Monogram uploaded!", description: file.name });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadReferences = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    setIsUploading(true);
    const newReferences = [...(brandAssets.references || [])];

    try {
      for (const file of Array.from(files)) {
        const blob = new Blob([await file.arrayBuffer()], { type: file.type });
        const uploaded = await uploadBlobToBucket("aa-brand", blob, user.id, `ref_${Date.now()}_${file.name}`);
        
        if (uploaded) {
          const asset = await createAssetRow(user.id, "aa-brand", uploaded.path, "reference", ["brand", "reference"], file.name);
          newReferences.push({
            assetId: asset?.id,
            path: uploaded.path,
            url: uploaded.publicUrl,
            name: file.name,
          });
        }
      }

      updateBrandSettings({
        brand_assets: {
          ...brandAssets,
          references: newReferences,
        }
      });

      toast({ title: "References uploaded!", description: `${files.length} file(s) added.` });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveReference = (index: number) => {
    const newReferences = [...(brandAssets.references || [])];
    newReferences.splice(index, 1);
    updateBrandSettings({
      brand_assets: {
        ...brandAssets,
        references: newReferences,
      }
    });
    toast({ title: "Reference removed" });
  };

  const handleSaveAll = () => {
    toast({ title: "Settings saved!", description: "All brand settings have been updated." });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="aa-pill-primary mb-4">Brand Kit</div>
            <h1 className="aa-headline-lg text-foreground">
              Brand <span className="aa-gradient-text">Tokens</span>
            </h1>
            <p className="aa-body mt-2 max-w-lg">
              Define your visual identity. These tokens power all template designs.
            </p>
          </div>
          <Button variant="gradient" onClick={handleSaveAll} disabled={isUpdating}>
            {isUpdating ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save All
          </Button>
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
                      className="aspect-square rounded-2xl border border-border mb-3 transition-transform group-hover:scale-105 cursor-pointer relative overflow-hidden"
                      style={{ backgroundColor: color.value }}
                    >
                      <input
                        type="color"
                        value={color.value}
                        onChange={(e) => handleColorChange(color.variable, e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
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
                      <span className="font-semibold text-foreground">{typography.primary || "Inter"}</span>
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground mb-2 block">Fallback</Label>
                    <div className="p-4 rounded-xl bg-secondary flex items-center justify-between">
                      <span className="font-semibold text-foreground">{typography.fallback || "SF Pro / Helvetica"}</span>
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
                      value={rules.cornerRadius || 24}
                      onChange={(e) => updateBrandSettings({ rules: { ...rules, cornerRadius: parseInt(e.target.value) || 24 } })}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">px</span>
                    <div 
                      className="w-16 h-16 bg-primary"
                      style={{ borderRadius: `${rules.cornerRadius || 24}px` }}
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
                {defaultBrandRules.map((rule) => (
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
                {/* Monogram */}
                <div 
                  className="p-6 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer text-center"
                  onClick={() => monogramInputRef.current?.click()}
                >
                  {brandAssets.monogram?.url ? (
                    <img 
                      src={brandAssets.monogram.url} 
                      alt="AA Monogram" 
                      className="w-12 h-12 mx-auto mb-3 rounded-xl object-contain bg-secondary"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent mx-auto flex items-center justify-center mb-3">
                      <span className="text-xl font-black text-primary-foreground">AA</span>
                    </div>
                  )}
                  <p className="text-sm font-medium text-foreground">AA Monogram</p>
                  <p className="text-xs text-muted-foreground">
                    {brandAssets.monogram?.name || "Click to upload"}
                  </p>
                  <input
                    ref={monogramInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUploadMonogram}
                    className="hidden"
                  />
                </div>

                {/* Reference Images */}
                {brandAssets.references?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Reference Images</p>
                    <div className="grid grid-cols-3 gap-2">
                      {brandAssets.references.map((ref: any, index: number) => (
                        <div key={index} className="relative group">
                          <img 
                            src={ref.url} 
                            alt={ref.name} 
                            className="aspect-square rounded-lg object-cover"
                          />
                          <button
                            onClick={() => handleRemoveReference(index)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3 text-destructive-foreground" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => referenceInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Upload Reference Images
                </Button>
                <input
                  ref={referenceInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleUploadReferences}
                  className="hidden"
                />
              </div>
            </div>

            {/* Preview Button */}
            <Button variant="gradient" className="w-full gap-2" onClick={() => window.location.href = "/templates"}>
              <Eye className="w-4 h-4" />
              Preview Templates
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
