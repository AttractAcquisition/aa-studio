import { useState, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  FileText,
  Clock,
  Copy,
  Trash2,
  Download,
  Eye,
  Code,
  Edit,
  Loader2,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnePagers, type CreateOnePagerParams } from "@/hooks/useOnePagers";
import { useScriptLibrary } from "@/hooks/useScriptLibrary";
import { OnePagerRenderer } from "@/components/onepager/OnePagerRenderer";
import { TEMPLATE_OPTIONS } from "@/lib/one-pager-templates";
import { validateOnePagerLayout, type OnePagerLayout, type OnePagerTemplateId } from "@/types/one-pager-layout";
import { renderOnePagerToBlob, downloadBlob } from "@/lib/export-utils";
import { toast } from "sonner";

export default function OnePagers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingOnePager, setEditingOnePager] = useState<any>(null);
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [createMode, setCreateMode] = useState<"prompt" | "script">("prompt");
  const [promptInput, setPromptInput] = useState("");
  const [selectedScriptId, setSelectedScriptId] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<OnePagerTemplateId>("auto");
  const [isGenerating, setIsGenerating] = useState(false);
  const [layoutJson, setLayoutJson] = useState("");
  const [layoutError, setLayoutError] = useState<string | null>(null);
  const [parsedLayout, setParsedLayout] = useState<OnePagerLayout | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const { 
    onePagers, 
    isLoading, 
    stats, 
    createOnePager, 
    updateOnePager, 
    deleteOnePager, 
    duplicateOnePager 
  } = useOnePagers();
  const { scripts } = useScriptLibrary();

  const filteredOnePagers = onePagers.filter((op) =>
    op.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGenerate = async () => {
    setIsGenerating(true);
    setLayoutError(null);

    try {
      let scriptContent = "";
      if (createMode === "script" && selectedScriptId) {
        const script = scripts.find((s) => s.id === selectedScriptId);
        scriptContent = script?.body || "";
      } else {
        scriptContent = promptInput;
      }

      if (!scriptContent.trim()) {
        throw new Error("Please provide content to generate from");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-onepager-layout`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            script: scriptContent,
            templateId: selectedTemplate,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate layout' }));
        throw new Error(errorData.error || 'Failed to generate layout');
      }

      const data = await response.json();
      
      if (!data.layout) {
        throw new Error(data.error || 'No layout returned');
      }

      const jsonStr = JSON.stringify(data.layout, null, 2);
      setLayoutJson(jsonStr);
      
      const validation = validateOnePagerLayout(data.layout);
      if (validation.success && validation.data) {
        setParsedLayout(validation.data);
        setLayoutError(null);
      } else {
        setLayoutError(validation.error || 'Invalid layout');
      }

      toast.success("Layout generated!");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to generate layout";
      setLayoutError(msg);
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveNewOnePager = async () => {
    if (!parsedLayout) {
      toast.error("No valid layout to save");
      return;
    }

    try {
      await createOnePager.mutateAsync({
        title: parsedLayout.meta?.title || "Untitled One-Pager",
        layout_json: parsedLayout,
        source_script_id: createMode === "script" ? selectedScriptId : undefined,
        template_id: selectedTemplate !== "auto" ? selectedTemplate : undefined,
        tags: ["draft"],
      });

      toast.success("One-pager created!");
      setCreateModalOpen(false);
      resetCreateModal();
    } catch (e) {
      toast.error("Failed to save one-pager");
    }
  };

  const resetCreateModal = () => {
    setPromptInput("");
    setSelectedScriptId("");
    setSelectedTemplate("auto");
    setLayoutJson("");
    setLayoutError(null);
    setParsedLayout(null);
    setCreateMode("prompt");
  };

  const handleEdit = (onePager: any) => {
    setEditingOnePager(onePager);
    setLayoutJson(JSON.stringify(onePager.layout_json, null, 2));
    setParsedLayout(onePager.layout_json);
    setLayoutError(null);
    setEditModalOpen(true);
  };

  const handleUpdateLayout = (jsonStr: string) => {
    setLayoutJson(jsonStr);
    try {
      const parsed = JSON.parse(jsonStr);
      const validation = validateOnePagerLayout(parsed);
      if (validation.success && validation.data) {
        setParsedLayout(validation.data);
        setLayoutError(null);
      } else {
        setLayoutError(validation.error || 'Invalid layout');
      }
    } catch {
      setLayoutError('Invalid JSON syntax');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingOnePager || !parsedLayout) return;

    try {
      await updateOnePager.mutateAsync({
        id: editingOnePager.id,
        layout_json: parsedLayout,
        title: parsedLayout.meta?.title || editingOnePager.title,
      });
      toast.success("One-pager updated!");
      setEditModalOpen(false);
    } catch (e) {
      toast.error("Failed to update one-pager");
    }
  };

  const handleExportPng = async () => {
    if (!previewRef.current) return;
    try {
      const blob = await renderOnePagerToBlob(previewRef.current, 1080);
      downloadBlob(blob, `one_pager_${Date.now()}.png`);
      toast.success("PNG exported!");
    } catch (e) {
      toast.error("Export failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this one-pager?")) return;
    try {
      await deleteOnePager.mutateAsync(id);
      toast.success("One-pager deleted");
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateOnePager.mutateAsync(id);
      toast.success("One-pager duplicated");
    } catch (e) {
      toast.error("Failed to duplicate");
    }
  };

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="aa-pill-primary mb-4">One-Pagers</div>
            <h1 className="aa-headline-lg text-foreground">
              One-Pager <span className="aa-gradient-text">Library</span>
            </h1>
            <p className="aa-body mt-2">
              Create, edit, and export visual one-pagers with cards, checklists, and charts.
            </p>
          </div>
          <Button variant="gradient" onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create One-Pager
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-10">
          <div className="aa-card text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 mx-auto mb-3 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <p className="text-3xl font-black text-foreground">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </div>
          <div className="aa-card text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 mx-auto mb-3 flex items-center justify-center">
              <Edit className="w-6 h-6 text-primary" />
            </div>
            <p className="text-3xl font-black text-foreground">{stats.draft}</p>
            <p className="text-sm text-muted-foreground">Draft</p>
          </div>
          <div className="aa-card text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 mx-auto mb-3 flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <p className="text-3xl font-black text-foreground">{stats.ready}</p>
            <p className="text-sm text-muted-foreground">Ready</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search one-pagers..."
            className="pl-12 h-14 text-base"
          />
        </div>

        {/* One-Pagers Grid */}
        {isLoading ? (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground mt-4">Loading one-pagers...</p>
          </div>
        ) : filteredOnePagers.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-semibold text-foreground">No one-pagers yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first one-pager to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOnePagers.map((op, index) => (
              <div
                key={op.id}
                className="aa-card hover:border-primary/30 transition-all animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-foreground">{op.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Updated {new Date(op.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  {op.template_id && (
                    <span className="aa-pill-outline text-[10px]">{op.template_id}</span>
                  )}
                </div>

                {op.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {op.tags.map((tag: string) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px]">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(op)}>
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDuplicate(op.id)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(op.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Dialog open={createModalOpen} onOpenChange={(open) => { setCreateModalOpen(open); if (!open) resetCreateModal(); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New One-Pager</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Mode Selection */}
            <div className="flex gap-2">
              <Button
                variant={createMode === "prompt" ? "gradient" : "outline"}
                onClick={() => setCreateMode("prompt")}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                From Prompt
              </Button>
              <Button
                variant={createMode === "script" ? "gradient" : "outline"}
                onClick={() => setCreateMode("script")}
              >
                <FileText className="w-4 h-4 mr-2" />
                From Script
              </Button>
            </div>

            {/* Input */}
            {createMode === "prompt" ? (
              <div>
                <Label className="text-muted-foreground mb-2 block">Content / Prompt</Label>
                <Textarea
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="Enter your content or describe what you want the one-pager to cover..."
                  className="min-h-[120px]"
                />
              </div>
            ) : (
              <div>
                <Label className="text-muted-foreground mb-2 block">Select Script</Label>
                <Select value={selectedScriptId} onValueChange={setSelectedScriptId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a script..." />
                  </SelectTrigger>
                  <SelectContent>
                    {scripts.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Template */}
            <div>
              <Label className="text-muted-foreground mb-2 block">Template</Label>
              <Select value={selectedTemplate} onValueChange={(v) => setSelectedTemplate(v as OnePagerTemplateId)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template..." />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_OPTIONS.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Generate Button */}
            <Button variant="gradient" onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Layout
                </>
              )}
            </Button>

            {/* Layout Display */}
            {layoutJson && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant={!showJsonEditor ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setShowJsonEditor(false)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    variant={showJsonEditor ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setShowJsonEditor(true)}
                  >
                    <Code className="w-4 h-4 mr-2" />
                    JSON
                  </Button>
                </div>

                {layoutError && (
                  <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
                    {layoutError}
                  </div>
                )}

                {showJsonEditor ? (
                  <Textarea
                    value={layoutJson}
                    onChange={(e) => handleUpdateLayout(e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
                  />
                ) : parsedLayout ? (
                  <div className="rounded-2xl border border-border/40 bg-background p-4 max-h-[400px] overflow-y-auto">
                    <div ref={previewRef}>
                      <OnePagerRenderer layout={parsedLayout} brand="AA Studio" />
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={handleSaveNewOnePager} disabled={!parsedLayout}>
              Save One-Pager
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit One-Pager</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Button
                variant={!showJsonEditor ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowJsonEditor(false)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button
                variant={showJsonEditor ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowJsonEditor(true)}
              >
                <Code className="w-4 h-4 mr-2" />
                JSON
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPng} disabled={!parsedLayout}>
                <Download className="w-4 h-4 mr-2" />
                Export PNG
              </Button>
            </div>

            {layoutError && (
              <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
                {layoutError}
              </div>
            )}

            {showJsonEditor ? (
              <Textarea
                value={layoutJson}
                onChange={(e) => handleUpdateLayout(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
              />
            ) : parsedLayout ? (
              <div className="rounded-2xl border border-border/40 bg-background p-4 max-h-[500px] overflow-y-auto">
                <div ref={previewRef}>
                  <OnePagerRenderer layout={parsedLayout} brand="AA Studio" />
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={handleSaveEdit} disabled={!parsedLayout || updateOnePager.isPending}>
              {updateOnePager.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
