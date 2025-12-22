import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2 } from "lucide-react";
import { useProofs } from "@/hooks/useProofs";
import { toast } from "sonner";

interface AddProofModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddProofModal({ open, onOpenChange }: AddProofModalProps) {
  const [industry, setIndustry] = useState("");
  const [headline, setHeadline] = useState("");
  const [metric, setMetric] = useState("");
  const [score, setScore] = useState("");
  const [happenedAt, setHappenedAt] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { createProof, isCreating } = useProofs();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headline) {
      toast.error("Headline is required");
      return;
    }

    try {
      await createProof({
        industry: industry || "",
        headline,
        metric: metric || undefined,
        score: score ? parseInt(score) : undefined,
        happenedAt: happenedAt || undefined,
        screenshotFile: selectedFile || undefined,
      });

      toast.success("Proof added successfully!");
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to add proof");
    }
  };

  const resetForm = () => {
    setIndustry("");
    setHeadline("");
    setMetric("");
    setScore("");
    setHappenedAt("");
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add Proof</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label className="text-muted-foreground">Industry Tag</Label>
            <Input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g., DENTAL CLINIC"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-muted-foreground">Headline *</Label>
            <Input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g., 3x DM increase in 2 weeks"
              className="mt-1"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Score %</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="e.g., 94"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-muted-foreground">Date</Label>
              <Input
                type="date"
                value={happenedAt}
                onChange={(e) => setHappenedAt(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground">Metric (optional)</Label>
            <Input
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              placeholder="e.g., DM conversion rate"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-muted-foreground">Screenshot</Label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />
            {previewUrl ? (
              <div className="relative mt-2">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-40 object-cover rounded-xl"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 p-8 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer text-center"
              >
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Click to upload screenshot</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Add Proof"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}