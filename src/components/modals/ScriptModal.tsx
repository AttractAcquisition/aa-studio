import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { X, Sparkles, Wand2, Zap, Copy, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ScriptLibraryItem, ScriptPlatform, ScriptStatus } from "@/hooks/useScriptLibrary";

interface ScriptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  script?: ScriptLibraryItem | null;
  onSave: (data: {
    title: string;
    platform: ScriptPlatform;
    status: ScriptStatus;
    hook: string;
    body: string;
    tags: string[];
  }) => void;
  isSaving?: boolean;
}

const platforms: { value: ScriptPlatform; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "threads", label: "Threads" },
];

const statuses: { value: ScriptStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "ready", label: "Ready" },
  { value: "used", label: "Used" },
];

export function ScriptModal({
  open,
  onOpenChange,
  script,
  onSave,
  isSaving,
}: ScriptModalProps) {
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState<ScriptPlatform>("instagram");
  const [status, setStatus] = useState<ScriptStatus>("draft");
  const [hook, setHook] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [topicInput, setTopicInput] = useState("");

  useEffect(() => {
    if (script) {
      setTitle(script.title);
      setPlatform(script.platform);
      setStatus(script.status);
      setHook(script.hook || "");
      setBody(script.body);
      setTags(script.tags || []);
    } else {
      setTitle("");
      setPlatform("instagram");
      setStatus("draft");
      setHook("");
      setBody("");
      setTags([]);
    }
    setTagInput("");
    setTopicInput("");
  }, [script, open]);

  const handleGenerateWithAI = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-script`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: topicInput || undefined,
            audience: "Physical/local business owners",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate' }));
        throw new Error(errorData.error || 'Failed to generate script');
      }

      const data = await response.json();
      
      if (!data.script) {
        throw new Error('No script returned');
      }

      // Split into hook (first sentence) and body (rest)
      const sentences = data.script.split(/(?<=[.!?])\s+/);
      const generatedHook = sentences[0] || "";
      const generatedBody = sentences.slice(1).join(" ") || data.script;

      setHook(generatedHook);
      setBody(generatedBody);
      
      // Auto-generate title from hook if empty
      if (!title) {
        setTitle(generatedHook.slice(0, 50) + (generatedHook.length > 50 ? "..." : ""));
      }

      toast.success("Script generated! Edit as needed.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to generate script";
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!body.trim()) {
      toast.error("Script body is required");
      return;
    }
    onSave({ title, platform, status, hook, body, tags });
  };

  const handleAIAction = (action: string) => {
    toast.info(`AI action coming soon: ${action}`);
    console.log("AI action clicked:", action);
  };

  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {script ? "Edit Script" : "New Script"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter script title..."
              className="bg-background border-border"
            />
          </div>

          {/* Platform & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as ScriptPlatform)}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {platforms.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ScriptStatus)}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {statuses.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* AI Generation */}
          {!script && (
            <div className="space-y-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <Label className="text-primary font-medium">Generate with AI</Label>
              <div className="flex gap-2">
                <Input
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  placeholder="Optional: Enter a topic (e.g., 'lead generation')"
                  className="bg-background border-border flex-1"
                />
                <Button
                  type="button"
                  onClick={handleGenerateWithAI}
                  disabled={isGenerating}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Generates a 140-160 word on-brand AA script. You can edit it before saving.
              </p>
            </div>
          )}

          {/* Hook */}
          <div className="space-y-2">
            <Label htmlFor="hook">Hook Line</Label>
            <Textarea
              id="hook"
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              placeholder="Enter your hook line..."
              rows={2}
              className="bg-background border-border resize-none"
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="body">Script Body *</Label>
              <span className="text-xs text-muted-foreground">{wordCount} words</span>
            </div>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your full script here..."
              rows={8}
              className="bg-background border-border resize-none font-mono text-sm"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="bg-primary/20 text-primary border-primary/30"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Input
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Type a tag and press Enter..."
              className="bg-background border-border"
            />
          </div>

          {/* AI Actions */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">AI Actions</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAIAction("Expand with AI")}
                className="border-primary/30 text-primary hover:bg-primary/10"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Expand
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAIAction("Summarise")}
                className="border-primary/30 text-primary hover:bg-primary/10"
              >
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                Summarise
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAIAction("Improve Hook")}
                className="border-primary/30 text-primary hover:bg-primary/10"
              >
                <Wand2 className="h-3.5 w-3.5 mr-1.5" />
                Improve Hook
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAIAction("Generate Variations")}
                className="border-primary/30 text-primary hover:bg-primary/10"
              >
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Variations
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAIAction("Rewrite for Platform")}
                className="border-primary/30 text-primary hover:bg-primary/10"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Rewrite
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className="bg-primary hover:bg-primary/90"
          >
            {isSaving ? "Saving..." : "Save Script"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
