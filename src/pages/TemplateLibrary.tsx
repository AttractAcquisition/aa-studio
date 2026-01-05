import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { ReelCoverPreview } from "@/components/templates/ReelCoverPreview";
import { BoldTextPreview } from "@/components/templates/BoldTextPreview";
import { ProofCardPreview } from "@/components/templates/ProofCardPreview";
import { CarouselPreview } from "@/components/templates/CarouselPreview";
import { OnePagerPreview } from "@/components/templates/OnePagerPreview";
import { AuditOverlayPreview } from "@/components/templates/AuditOverlayPreview";
import { TemplatePreviewModal } from "@/components/modals/TemplatePreviewModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Filter, RefreshCw } from "lucide-react";
import { useTemplates } from "@/hooks/useTemplates";
import { useToast } from "@/hooks/use-toast";
import { getAssetPublicUrl } from "@/lib/supabase-helpers";

// Preview components for system templates
const templatePreviews: Record<string, React.ReactNode> = {
  "reel-cover": <ReelCoverPreview />,
  "bold-text-card": <BoldTextPreview />,
  "carousel-framework": <CarouselPreview />,
  "one-pager-scroll": <OnePagerPreview />,
  "audit-overlay": <AuditOverlayPreview />,
  "proof-card": <ProofCardPreview />,
};

const categoryOptions = ["attraction", "framework", "proof", "audit", "carousel", "reel"];
const formatOptions = ["9:16", "4:5", "1:1", "16:9"];

export default function TemplateLibrary() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { templates, isLoading, createTemplate, deleteTemplate, isCreating } = useTemplates();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [deleteTemplateName, setDeleteTemplateName] = useState<string>("");
  const [newTemplate, setNewTemplate] = useState({
    key: "",
    name: "",
    category: "",
    description: "",
    formats: [] as string[],
  });

  // Filter templates based on selected categories and formats
  const filteredTemplates = templates.filter((template: any) => {
    const categoryMatch =
      selectedCategories.length === 0 ||
      selectedCategories.includes(template.category?.toLowerCase() || "");
    const formatMatch =
      selectedFormats.length === 0 ||
      (template.formats || []).some((f: string) => selectedFormats.includes(f));
    return categoryMatch && formatMatch;
  });

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const toggleFormat = (format: string) => {
    setSelectedFormats((prev) =>
      prev.includes(format) ? prev.filter((f) => f !== format) : [...prev, format]
    );
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.key || !newTemplate.name) {
      toast({
        title: "Missing fields",
        description: "Please fill in key and name",
        variant: "destructive",
      });
      return;
    }

    try {
      createTemplate({
        key: newTemplate.key.toLowerCase().replace(/\s+/g, "-"),
        name: newTemplate.name,
        category: newTemplate.category || undefined,
        description: newTemplate.description || undefined,
        formats: newTemplate.formats.length > 0 ? newTemplate.formats : undefined,
      });

      toast({
        title: "Template created!",
        description: `${newTemplate.name} has been added to your library.`,
      });

      setIsModalOpen(false);
      setNewTemplate({ key: "", name: "", category: "", description: "", formats: [] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create template",
        variant: "destructive",
      });
    }
  };

  // ✅ UPDATED: Prefer preview_asset_path PNG/JPG first, then fall back to system preview components
  const getTemplatePreview = (template: any) => {
    // 1) Prefer preview_asset_path (PNG/JPG) if present
    if (template.preview_asset_path) {
      const url = template.preview_asset_path.startsWith("http")
        ? template.preview_asset_path
        : getAssetPublicUrl(
            template.preview_asset_path.split("/")[0] || "aa-designs",
            template.preview_asset_path.split("/").slice(1).join("/") || template.preview_asset_path
          );

      return (
        <div className="aspect-[4/5] bg-secondary rounded-xl overflow-hidden">
          <img
            src={url}
            alt={template.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      );
    }

    // 2) Then check for system template preview component
    if (templatePreviews[template.key]) {
      return templatePreviews[template.key];
    }

    // 3) Fallback
    return (
      <div className="aspect-[4/5] bg-secondary rounded-xl flex items-center justify-center">
        <span className="text-muted-foreground text-sm">{template.name}</span>
      </div>
    );
  };

  const handleDuplicateTemplate = (template: any) => {
    createTemplate({
      key: `${template.key}-copy-${Date.now()}`,
      name: `${template.name} (Copy)`,
      category: template.category,
      description: template.description,
      formats: template.formats,
      preview_asset_path: template.preview_asset_path,
    });
    toast({
      title: "Template duplicated!",
      description: "You can now edit your copy.",
    });
  };

  const handleDeleteTemplate = (template: any) => {
    setDeleteTemplateId(template.id);
    setDeleteTemplateName(template.name);
  };

  const confirmDeleteTemplate = () => {
    if (!deleteTemplateId) return;
    try {
      deleteTemplate(deleteTemplateId);
      toast({
        title: "Template deleted",
        description: `${deleteTemplateName} has been removed.`,
      });
    } catch (error: any) {
      toast({
        title: "Error deleting template",
        description: error.message || "Failed to delete template",
        variant: "destructive",
      });
    } finally {
      setDeleteTemplateId(null);
      setDeleteTemplateName("");
    }
  };

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="aa-pill-primary mb-4">Template Library</div>
            <h1 className="aa-headline-lg text-foreground">
              Design <span className="aa-gradient-text">Templates</span>
            </h1>
            <p className="aa-body mt-2 max-w-lg">
              {templates.length} brand-locked templates for consistent, on-brand content. Edit
              fields, not layouts.
            </p>
          </div>
          <div className="flex gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                  {(selectedCategories.length > 0 || selectedFormats.length > 0) && (
                    <span className="ml-2 px-1.5 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
                      {selectedCategories.length + selectedFormats.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Categories
                </div>
                {categoryOptions.map((category) => (
                  <DropdownMenuCheckboxItem
                    key={category}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={() => toggleCategory(category)}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </DropdownMenuCheckboxItem>
                ))}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
                  Formats
                </div>
                {formatOptions.map((format) => (
                  <DropdownMenuCheckboxItem
                    key={format}
                    checked={selectedFormats.includes(format)}
                    onCheckedChange={() => toggleFormat(format)}
                  >
                    {format}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="gradient" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </div>
        </div>

        {/* Template Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No templates match your filters.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSelectedCategories([]);
                setSelectedFormats([]);
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template: any, index: number) => (
              <div
                key={template.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <TemplateCard
                  type={template.category?.toUpperCase() || template.key.toUpperCase()}
                  title={template.name}
                  description={template.description || "Custom template"}
                  formats={template.formats || []}
                  preview={getTemplatePreview(template)}
                  onPreview={() => setPreviewTemplate(template)}
                  onEdit={() => {
                    if (template.is_system) {
                      toast({
                        title: "System template",
                        description:
                          "System templates cannot be edited. Use 'Duplicate' to create an editable copy.",
                        variant: "destructive",
                      });
                    } else {
                      navigate(`/templates/${template.id}/edit`);
                    }
                  }}
                  onDuplicate={() => handleDuplicateTemplate(template)}
                  onDelete={!template.is_system ? () => handleDeleteTemplate(template) : undefined}
                  isSystem={template.is_system}
                />
              </div>
            ))}
          </div>
        )}

        {/* Format Legend */}
        <div className="mt-12 aa-card">
          <h3 className="font-bold text-foreground mb-4">Format Reference</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-20 rounded-lg bg-primary/10 border border-primary/30" />
              <div>
                <p className="font-medium text-foreground">9:16</p>
                <p className="text-xs text-muted-foreground">1080 × 1920px</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-16 h-20 rounded-lg bg-primary/10 border border-primary/30" />
              <div>
                <p className="font-medium text-foreground">4:5</p>
                <p className="text-xs text-muted-foreground">1080 × 1350px</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg bg-primary/10 border border-primary/30" />
              <div>
                <p className="font-medium text-foreground">1:1</p>
                <p className="text-xs text-muted-foreground">1080 × 1080px</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-20 h-12 rounded-lg bg-primary/10 border border-primary/30" />
              <div>
                <p className="font-medium text-foreground">16:9</p>
                <p className="text-xs text-muted-foreground">1920 × 1080px</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Template Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-muted-foreground mb-2 block">Template Key</Label>
              <Input
                value={newTemplate.key}
                onChange={(e) => setNewTemplate({ ...newTemplate, key: e.target.value })}
                placeholder="e.g., my-custom-template"
              />
            </div>
            <div>
              <Label className="text-muted-foreground mb-2 block">Template Name</Label>
              <Input
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                placeholder="e.g., My Custom Template"
              />
            </div>
            <div>
              <Label className="text-muted-foreground mb-2 block">Category</Label>
              <Select
                value={newTemplate.category}
                onValueChange={(v) => setNewTemplate({ ...newTemplate, category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-muted-foreground mb-2 block">Description</Label>
              <Textarea
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                placeholder="Describe your template..."
                rows={3}
              />
            </div>
            <div>
              <Label className="text-muted-foreground mb-2 block">Formats</Label>
              <div className="flex flex-wrap gap-2">
                {formatOptions.map((format) => (
                  <Button
                    key={format}
                    type="button"
                    variant={newTemplate.formats.includes(format) ? "gradient" : "outline"}
                    size="sm"
                    onClick={() => {
                      setNewTemplate({
                        ...newTemplate,
                        formats: newTemplate.formats.includes(format)
                          ? newTemplate.formats.filter((f) => f !== format)
                          : [...newTemplate.formats, format],
                      });
                    }}
                  >
                    {format}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={handleCreateTemplate} disabled={isCreating}>
              {isCreating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Template"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Preview Modal */}
      <TemplatePreviewModal
        open={!!previewTemplate}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
        template={previewTemplate}
        previewComponent={previewTemplate ? getTemplatePreview(previewTemplate) : undefined}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTemplateId} onOpenChange={(open) => !open && setDeleteTemplateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTemplateName}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTemplate}
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
