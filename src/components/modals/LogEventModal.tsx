import { useState, useEffect } from "react";
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
import { useEvents, EventType } from "@/hooks/useEvents";
import { toast } from "sonner";

interface LogEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: EventType;
}

const platforms = ["instagram", "tiktok", "linkedin", "twitter", "facebook", "email", "other"];

const eventTypeLabels: Record<EventType, string> = {
  enquiry: "Enquiry",
  audit_request: "Audit Request",
  booked_call: "Booked Call",
  conversion: "Conversion",
};

export function LogEventModal({ open, onOpenChange, defaultType = "enquiry" }: LogEventModalProps) {
  const [type, setType] = useState<EventType>(defaultType);
  const [keyword, setKeyword] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [contactName, setContactName] = useState("");
  const [contactHandle, setContactHandle] = useState("");
  const [notes, setNotes] = useState("");
  const [value, setValue] = useState("");
  const [occurredAt, setOccurredAt] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  const { createEvent, isCreating } = useEvents();

  // Reset type when defaultType changes
  useEffect(() => {
    if (open) {
      setType(defaultType);
    }
  }, [defaultType, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createEvent({
        type,
        keyword: keyword.trim() || undefined,
        platform,
        contact_name: contactName.trim() || undefined,
        contact_handle: contactHandle.trim() || undefined,
        notes: notes.trim() || undefined,
        value: type === "conversion" && value ? parseFloat(value) : undefined,
        occurred_at: new Date(occurredAt).toISOString(),
      });

      toast.success(`${eventTypeLabels[type]} logged!`);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error(`Failed to log ${eventTypeLabels[type].toLowerCase()}`);
    }
  };

  const resetForm = () => {
    setKeyword("");
    setPlatform("instagram");
    setContactName("");
    setContactHandle("");
    setNotes("");
    setValue("");
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setOccurredAt(now.toISOString().slice(0, 16));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Log {eventTypeLabels[type]}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Event Type */}
          <div>
            <Label className="text-muted-foreground">Event Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as EventType)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(eventTypeLabels) as EventType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {eventTypeLabels[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Keyword/Trigger - most relevant for enquiry/audit */}
          <div>
            <Label className="text-muted-foreground">
              Keyword / Trigger {type === "enquiry" && "*"}
            </Label>
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g., AUDIT, FUNNEL, INFO..."
              className="mt-1"
              required={type === "enquiry"}
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-1">
              The word or phrase that triggered this lead
            </p>
          </div>

          {/* Platform */}
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

          {/* Contact fields - two columns */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-muted-foreground">Contact Name</Label>
              <Input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="John Doe"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-muted-foreground">Contact Handle</Label>
              <Input
                value={contactHandle}
                onChange={(e) => setContactHandle(e.target.value)}
                placeholder="@johndoe"
                className="mt-1"
              />
            </div>
          </div>

          {/* Occurred At */}
          <div>
            <Label className="text-muted-foreground">Occurred At</Label>
            <Input
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Conversion Value - only for conversions */}
          {type === "conversion" && (
            <div>
              <Label className="text-muted-foreground">Value (ZAR)</Label>
              <Input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g., 5000"
                className="mt-1"
                min="0"
                step="0.01"
              />
            </div>
          )}

          {/* Notes */}
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
                `Log ${eventTypeLabels[type]}`
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
