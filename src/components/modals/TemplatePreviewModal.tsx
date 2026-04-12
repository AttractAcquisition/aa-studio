import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { getAssetPublicUrl } from "@/lib/supabase-helpers";

interface TemplatePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: {
    id: string;
    key?: string;
    name: string;
    description?: string;
    category?: string;
    formats?: string[];
    preview_asset_path?: string;
  } | null;
  previewComponent?: React.ReactNode;
}

function getPreviewUrl(path?: string): string | null {
  if (!path) return null;
  // If already a full URL, use as-is
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  // If contains bucket/path format like "aa-designs/user_id/file.png"
  const parts = path.split("/");
  if (parts.length >= 2) {
    const bucket = parts[0];
    const filePath = parts.slice(1).join("/");
    return getAssetPublicUrl(bucket, filePath);
  }
  // Fallback: assume aa-designs bucket
  return getAssetPublicUrl("aa-designs", path);
}

export function TemplatePreviewModal({
  open,
  onOpenChange,
  template,
  previewComponent,
}: TemplatePreviewModalProps) {
  if (!template) return null;

  const previewUrl = getPreviewUrl(template.preview_asset_path);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center justify-between">
            {template.name}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Info */}
          <div className="flex items-center gap-2 flex-wrap">
            {template.category && (
              <span className="aa-pill bg-primary/10 text-primary text-xs">
                {template.category.toUpperCase()}
              </span>
            )}
            {template.formats?.map((format) => (
              <span key={format} className="aa-pill-outline text-xs">
                {format}
              </span>
            ))}
          </div>

          {template.description && (
            <p className="text-sm text-muted-foreground">{template.description}</p>
          )}

          {/* Preview - prioritize previewComponent, then preview URL, then fallback */}
          <div className="aspect-[4/5] rounded-2xl bg-deep-ink overflow-hidden">
            {previewComponent ? (
              previewComponent
            ) : previewUrl ? (
              <img
                src={previewUrl}
                alt={template.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-muted-foreground">No preview available</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
