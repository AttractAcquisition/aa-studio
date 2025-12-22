import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface ProofScreenshotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proof: {
    headline: string;
    industry?: string;
    publicUrl?: string;
  } | null;
}

export function ProofScreenshotModal({ open, onOpenChange, proof }: ProofScreenshotModalProps) {
  if (!proof) return null;

  const handleDownload = () => {
    if (proof.publicUrl) {
      const link = document.createElement("a");
      link.href = proof.publicUrl;
      link.download = `proof-${proof.headline.slice(0, 20)}`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {proof.industry && (
              <span className="aa-pill-outline text-xs mr-3">{proof.industry}</span>
            )}
            {proof.headline}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {proof.publicUrl ? (
            <img
              src={proof.publicUrl}
              alt={proof.headline}
              className="w-full h-auto max-h-[500px] object-contain rounded-xl bg-muted"
            />
          ) : (
            <div className="w-full h-64 rounded-xl bg-muted flex items-center justify-center">
              <span className="text-muted-foreground">No screenshot available</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {proof.publicUrl && (
            <Button variant="gradient" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
