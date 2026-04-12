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
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface EditProofModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proof: {
    id: string;
    headline: string;
    industry?: string;
    metric?: string;
    score?: number;
    happened_at?: string;
  } | null;
  onSave: (data: {
    id: string;
    headline?: string;
    industry?: string;
    metric?: string;
    score?: number;
    happened_at?: string;
  }) => Promise<void>;
}

export function EditProofModal({ open, onOpenChange, proof, onSave }: EditProofModalProps) {
  const [headline, setHeadline] = useState("");
  const [industry, setIndustry] = useState("");
  const [metric, setMetric] = useState("");
  const [score, setScore] = useState("");
  const [happenedAt, setHappenedAt] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (proof) {
      setHeadline(proof.headline || "");
      setIndustry(proof.industry || "");
      setMetric(proof.metric || "");
      setScore(proof.score?.toString() || "");
      setHappenedAt(proof.happened_at || "");
    }
  }, [proof]);

  const handleSave = async () => {
    if (!proof) return;
    setIsSaving(true);
    try {
      await onSave({
        id: proof.id,
        headline,
        industry: industry || undefined,
        metric: metric || undefined,
        score: score ? parseInt(score, 10) : undefined,
        happened_at: happenedAt || undefined,
      });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Proof</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label className="text-muted-foreground mb-2 block">Headline</Label>
            <Input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g., Client achieved 5x ROAS"
            />
          </div>
          <div>
            <Label className="text-muted-foreground mb-2 block">Industry Tag</Label>
            <Input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g., E-commerce, SaaS"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground mb-2 block">Metric</Label>
              <Input
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                placeholder="e.g., 5x ROAS"
              />
            </div>
            <div>
              <Label className="text-muted-foreground mb-2 block">Score %</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="e.g., 95"
              />
            </div>
          </div>
          <div>
            <Label className="text-muted-foreground mb-2 block">Date</Label>
            <Input
              type="date"
              value={happenedAt}
              onChange={(e) => setHappenedAt(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="gradient" onClick={handleSave} disabled={isSaving || !headline}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
