import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Save, Copy, Loader2, Image, Lock, Trash2 } from "lucide-react";
import { useTemplates } from "@/hooks/useTemplates";
import { toast } from "sonner";

const CATEGORIES = ["proof", "carousel", "cover", "overlay", "text", "onepager"];
const FORMATS = ["1:1", "4:5", "9:16", "16:9"];

export default function TemplateEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTemplateById, updateTemplate, createTemplate, deleteTemplate, isUpdating, isCreating } = useTemplates();

  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<any>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [formats, setFormats] = useState<string[]>([]);
  const [previewAssetPath, setPreviewAssetPath] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);


  useEffect(() => {
    async function loadTemplate() {
      if (!id) return;
      try {
        const data = await getTemplateById(id);
        setTemplate(data);
        setName(data.name || "");
        setCategory(data.category || "");
        setDescription(data.description || "");
        setFormats(data.formats || []);
        setPreviewAssetPath(data.preview_asset_path || "");
      } catch (error) {
        toast.error("Failed to load template");
        navigate("/templates");
      } finally {
        setLoading(false);
      }
    }
    loadTemplate();
  }, [id]);

  const handleSave = () => {
    if (!id || !template) return;
    
    if (template.is_system) {
      toast.error("Cannot edit system templates");
      return;
    }

    updateTemplate({
      id,
      name,
      category,
      description,
      formats,
      preview_asset_path: previewAssetPath,
    });
    toast.success("Template updated");
  };

  const handleCreateCopy = () => {
    if (!template) return;
    
    createTemplate({
      key: `${template.key}_copy_${Date.now()}`,
      name: `${name} (Copy)`,
      category,
      description,
      formats,
      preview_asset_path: previewAssetPath,
    });
    toast.success("Template copied! You can now edit your copy.");
    navigate("/templates");
  };

  const handleDelete = () => {
    if (!id || !template) return;
    
    if (template.is_system) {
      toast.error("Cannot delete system templates");
      return;
    }

    try {
      deleteTemplate(id);
      toast.success("Template deleted");
      navigate("/templates");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete template");
    }
  };

  const toggleFormat = (format: string) => {
    setFormats((prev) =>
      prev.includes(format)
        ? prev.filter((f) => f !== format)
        : [...prev, format]
    );
  };

  const getPreviewUrl = () => {
    if (!previewAssetPath) return null;
    if (previewAssetPath.startsWith("http")) return previewAssetPath;
    // Construct Supabase storage URL
    return `https://dwhmvzooerxejustfqpt.supabase.co/storage/v1/object/public/${previewAssetPath}`;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const isSystemTemplate = template?.is_system;

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/templates")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="aa-pill-primary mb-2">Template Control</div>
            <h1 className="aa-headline-md text-foreground">
              {isSystemTemplate ? "View Template" : "Edit Template"}
            </h1>
          </div>
          {isSystemTemplate ? (
            <Button variant="gradient" onClick={handleCreateCopy} disabled={isCreating}>
              {isCreating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              Create Copy
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Button variant="gradient" onClick={handleSave} disabled={isUpdating}>
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          )}
        </div>

        {/* System Template Notice */}
        {isSystemTemplate && (
          <div className="aa-card mb-6 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">System Template</p>
                <p className="text-sm text-muted-foreground">
                  This is a built-in template and cannot be edited. Create a copy to customize it.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="aa-card space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Template"
                disabled={isSystemTemplate}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={category}
                onValueChange={setCategory}
                disabled={isSystemTemplate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this template is for..."
                rows={3}
                disabled={isSystemTemplate}
              />
            </div>

            <div className="space-y-2">
              <Label>Formats</Label>
              <div className="flex flex-wrap gap-2">
                {FORMATS.map((format) => (
                  <button
                    key={format}
                    type="button"
                    onClick={() => !isSystemTemplate && toggleFormat(format)}
                    disabled={isSystemTemplate}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      formats.includes(format)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    } ${isSystemTemplate ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    {format}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="previewPath">Preview Asset Path</Label>
              <Input
                id="previewPath"
                value={previewAssetPath}
                onChange={(e) => setPreviewAssetPath(e.target.value)}
                placeholder="aa-designs/user_id/preview.png"
                disabled={isSystemTemplate}
              />
              <p className="text-xs text-muted-foreground">
                Supabase storage path or full URL for preview image
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="aa-card">
            <h3 className="font-bold text-foreground mb-4">Preview</h3>
            <div className="aspect-[4/5] rounded-2xl bg-muted overflow-hidden flex items-center justify-center">
              {getPreviewUrl() ? (
                <img
                  src={getPreviewUrl()!}
                  alt={name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="text-center">
                  <Image className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No preview available</p>
                </div>
              )}
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Category:</span>
                <span className="font-medium text-foreground">{category || "—"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Formats:</span>
                <span className="font-medium text-foreground">
                  {formats.length > 0 ? formats.join(", ") : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Type:</span>
                <span className={`font-medium ${isSystemTemplate ? "text-primary" : "text-foreground"}`}>
                  {isSystemTemplate ? "System" : "Custom"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
