import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBundle, useBundleMutations } from "@/hooks/useBundles";
import { useToast } from "@/hooks/use-toast";
import { OnePagerRenderer } from "@/components/onepager/OnePagerRenderer";
import { validateOnePagerLayout } from "@/types/one-pager-layout";
import { renderOnePagerToBlob, downloadBlob, downloadFromUrlOrDataUrl } from "@/lib/export-utils";
import { 
  ArrowLeft, 
  Copy, 
  Download, 
  Save, 
  Loader2, 
  Image as ImageIcon,
  FileText,
  Calendar,
  Check
} from "lucide-react";
import { format } from "date-fns";

export default function BundleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: bundle, isLoading, error } = useBundle(id);
  const { updateBundle } = useBundleMutations();
  
  const onePagerRef = useRef<HTMLDivElement>(null);

  // Local state for editing
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [cta, setCta] = useState("");
  const [status, setStatus] = useState<"draft" | "scheduled" | "published">("draft");
  const [scheduledAt, setScheduledAt] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync local state when bundle loads
  useEffect(() => {
    if (bundle) {
      setTitle(bundle.title || "Untitled");
      setCaption(bundle.caption || "");
      setCta(bundle.cta || "");
      setStatus(bundle.status || "draft");
      setScheduledAt(bundle.scheduled_at ? format(new Date(bundle.scheduled_at), "yyyy-MM-dd'T'HH:mm") : "");
    }
  }, [bundle]);

  const handleSave = async () => {
    if (!id) return;
    
    setIsSaving(true);
    try {
      await updateBundle.mutateAsync({
        id,
        data: {
          title,
          caption,
          cta,
          status,
          scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
          published_at: status === "published" && !bundle?.published_at 
            ? new Date().toISOString() 
            : bundle?.published_at || null,
        },
      });
      toast({ title: "Saved", description: "Bundle updated successfully." });
    } catch (e) {
      toast({ 
        title: "Error", 
        description: e instanceof Error ? e.message : "Failed to save", 
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyScript = () => {
    if (!bundle?.script) return;
    navigator.clipboard.writeText(bundle.script);
    setCopied(true);
    toast({ title: "Copied", description: "Script copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportOnePager = async () => {
    if (!onePagerRef.current) {
      toast({ title: "Error", description: "One-pager not available.", variant: "destructive" });
      return;
    }
    try {
      const blob = await renderOnePagerToBlob(onePagerRef.current, 1080);
      downloadBlob(blob, `bundle_one_pager_${Date.now()}.png`);
      toast({ title: "Exported", description: "One-pager PNG downloaded." });
    } catch (e) {
      toast({ title: "Export failed", description: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    }
  };

  const handleExportImage = async (url: string, name: string) => {
    try {
      await downloadFromUrlOrDataUrl(url, `${name}_${Date.now()}.png`);
      toast({ title: "Exported", description: `${name} downloaded.` });
    } catch (e) {
      toast({ title: "Export failed", description: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    }
  };

  // Parse one-pager layout
  const onePagerLayout = bundle?.one_pager_layout_json 
    ? validateOnePagerLayout(bundle.one_pager_layout_json).data 
    : null;

  const designUrls = bundle?.design_image_urls as Record<string, string> | null;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (error || !bundle) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Bundle not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-bold bg-transparent border-none px-0 focus-visible:ring-0"
              placeholder="Bundle Title"
            />
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span>{bundle.series || "No series"}</span>
              <span>•</span>
              <span>{format(new Date(bundle.created_at), "MMM d, yyyy")}</span>
            </div>
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Script Card */}
          <div className="aa-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground">Script</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCopyScript} disabled={!bundle.script}>
                {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            {bundle.script ? (
              <div className="bg-secondary/50 rounded-lg p-4 max-h-[300px] overflow-y-auto">
                <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">{bundle.script}</pre>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No script generated</p>
            )}
          </div>

          {/* One-Pager Card */}
          <div className="aa-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground">One-Pager</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={handleExportOnePager} disabled={!onePagerLayout}>
                <Download className="w-4 h-4 mr-1" />
                Export PNG
              </Button>
            </div>
            {onePagerLayout ? (
              <div className="bg-secondary/50 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                <div ref={onePagerRef}>
                  <OnePagerRenderer layout={onePagerLayout} />
                </div>
              </div>
            ) : bundle.one_pager_export_png_url ? (
              <img 
                src={bundle.one_pager_export_png_url} 
                alt="One-pager preview" 
                className="rounded-lg w-full"
              />
            ) : (
              <p className="text-muted-foreground text-center py-8">No one-pager generated</p>
            )}
          </div>

          {/* Design Assets Card */}
          <div className="aa-card lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-foreground">Design Assets</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Bold Text Card */}
              <div className="bg-secondary/50 rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Bold Text Card</p>
                {designUrls?.bold_text_card ? (
                  <>
                    <img 
                      src={designUrls.bold_text_card} 
                      alt="Bold text card" 
                      className="rounded-lg aspect-square object-cover mb-2"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleExportImage(designUrls.bold_text_card, "bold_text_card")}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </Button>
                  </>
                ) : (
                  <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-xs text-muted-foreground">Not generated</p>
                  </div>
                )}
              </div>

              {/* Reel Cover */}
              <div className="bg-secondary/50 rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Reel Cover</p>
                {designUrls?.reel_cover ? (
                  <>
                    <img 
                      src={designUrls.reel_cover} 
                      alt="Reel cover" 
                      className="rounded-lg aspect-[9/16] object-cover mb-2 max-h-[200px] mx-auto"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleExportImage(designUrls.reel_cover, "reel_cover")}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </Button>
                  </>
                ) : (
                  <div className="aspect-[9/16] bg-muted rounded-lg flex items-center justify-center max-h-[200px] mx-auto">
                    <p className="text-xs text-muted-foreground">Not generated</p>
                  </div>
                )}
              </div>

              {/* One-Pager Cover */}
              <div className="bg-secondary/50 rounded-lg p-4">
                <p className="text-sm font-medium mb-2">One-Pager Cover</p>
                {designUrls?.one_pager_cover ? (
                  <>
                    <img 
                      src={designUrls.one_pager_cover} 
                      alt="One-pager cover" 
                      className="rounded-lg aspect-[4/5] object-cover mb-2 max-h-[200px] mx-auto"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleExportImage(designUrls.one_pager_cover, "one_pager_cover")}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </Button>
                  </>
                ) : (
                  <div className="aspect-[4/5] bg-muted rounded-lg flex items-center justify-center max-h-[200px] mx-auto">
                    <p className="text-xs text-muted-foreground">Not generated</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Caption & CTA Card */}
          <div className="aa-card">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-foreground">Caption & CTA</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Caption</label>
                <Textarea 
                  value={caption} 
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write your post caption..."
                  rows={4}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">CTA</label>
                <Input 
                  value={cta} 
                  onChange={(e) => setCta(e.target.value)}
                  placeholder="e.g. DM me 'AUDIT' to get started"
                />
              </div>
            </div>
          </div>

          {/* Scheduling Card */}
          <div className="aa-card">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-foreground">Scheduling</h3>
            </div>
            <div className="space-y-4">
              {status === "scheduled" && (
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Scheduled For</label>
                  <Input 
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                  />
                </div>
              )}
              {status === "published" && bundle.published_at && (
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Published At</label>
                  <p className="text-foreground">
                    {format(new Date(bundle.published_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              )}
              {status === "draft" && (
                <p className="text-muted-foreground text-center py-4">
                  Change status to "Scheduled" to set a publish date.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
