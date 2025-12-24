import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface TemplatePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: {
    id: string;
    name: string;
    description?: string;
    category?: string;
    formats?: string[];
    preview_asset_path?: string;
  } | null;
  previewComponent?: React.ReactNode;
}

export function TemplatePreviewModal({
  open,
  onOpenChange,
  template,
  previewComponent,
}: TemplatePreviewModalProps) {
  if (!template) return null;

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

          {/* Preview */}
          <div className="aspect-[4/5] rounded-2xl bg-deep-ink overflow-hidden">
            {previewComponent || (
              template.preview_asset_path ? (
                <img
                  src={template.preview_asset_path}
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-muted-foreground">No preview available</span>
                </div>
              )
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
