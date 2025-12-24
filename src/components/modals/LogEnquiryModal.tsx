import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useEvents } from "@/hooks/useEvents";
import { toast } from "sonner";

interface LogEnquiryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const platforms = ["instagram", "tiktok", "linkedin", "twitter", "facebook", "email", "other"];

export function LogEnquiryModal({ open, onOpenChange }: LogEnquiryModalProps) {
  const [keyword, setKeyword] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [notes, setNotes] = useState("");

  const { createEvent, isCreating } = useEvents();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!keyword.trim()) {
      toast.error("Please enter a keyword or trigger word");
      return;
    }

    try {
      await createEvent({
        type: "enquiry",
        keyword: keyword.trim(),
        platform,
        notes: notes.trim() || undefined,
      });

      toast.success("Enquiry logged!");
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to log enquiry");
    }
  };

  const resetForm = () => {
    setKeyword("");
    setPlatform("instagram");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Log Enquiry</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label className="text-muted-foreground">Keyword / Trigger *</Label>
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g., AUDIT, FUNNEL, INFO..."
              className="mt-1"
              required
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-1">
              The word or phrase that triggered this enquiry
            </p>
          </div>

          <div>
            <Label className="text-muted-foreground">Platform</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select platform..." />
              </SelectTrigger>
              <SelectContent>
                {platforms.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-muted-foreground">Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional context..."
              className="mt-1"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Logging...
                </>
              ) : (
                "Log Enquiry"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
