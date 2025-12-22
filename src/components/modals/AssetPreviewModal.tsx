import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Trash2, Copy, X } from "lucide-react";
import { toast } from "sonner";

interface AssetPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: {
    id: string;
    title?: string;
    publicUrl?: string;
    tags?: string[];
    created_at?: string;
  } | null;
  onDelete?: (id: string) => void;
}

export function AssetPreviewModal({ open, onOpenChange, asset, onDelete }: AssetPreviewModalProps) {
  if (!asset) return null;

  const handleCopyUrl = () => {
    if (asset.publicUrl) {
      navigator.clipboard.writeText(asset.publicUrl);
      toast.success("URL copied to clipboard");
    }
  };

  const handleDownload = () => {
    if (asset.publicUrl) {
      const link = document.createElement("a");
      link.href = asset.publicUrl;
      link.download = asset.title || "asset";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(asset.id);
      onOpenChange(false);
      toast.success("Asset deleted");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold truncate">
            {asset.title || "Asset Preview"}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {asset.publicUrl ? (
            <img
              src={asset.publicUrl}
              alt={asset.title || "Asset"}
              className="w-full h-auto max-h-[400px] object-contain rounded-xl bg-muted"
            />
          ) : (
            <div className="w-full h-64 rounded-xl bg-muted flex items-center justify-center">
              <span className="text-muted-foreground">No preview available</span>
            </div>
          )}
        </div>

        {asset.tags && asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {asset.tags.map((tag) => (
              <span key={tag} className="aa-pill-outline text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}

        {asset.created_at && (
          <p className="text-sm text-muted-foreground mt-2">
            Uploaded: {new Date(asset.created_at).toLocaleDateString()}
          </p>
        )}

        <div className="flex justify-between mt-6">
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCopyUrl}>
              <Copy className="w-4 h-4 mr-2" />
              Copy URL
            </Button>
            <Button variant="gradient" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
