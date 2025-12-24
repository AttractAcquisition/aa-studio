import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Copy, Lock } from "lucide-react";

interface TemplateCardProps {
  type: string;
  title: string;
  description: string;
  formats: string[];
  preview: React.ReactNode;
  onPreview?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  isSystem?: boolean;
}

export function TemplateCard({ 
  type, 
  title, 
  description, 
  formats, 
  preview, 
  onPreview, 
  onEdit,
  onDuplicate,
  isSystem,
}: TemplateCardProps) {
  return (
    <div className="aa-card group hover:border-primary/30 transition-all duration-300">
      {/* Preview */}
      <div className="aspect-[4/5] rounded-2xl bg-deep-ink overflow-hidden mb-6 relative">
        {preview}
        <div className="absolute inset-0 bg-gradient-to-t from-deep-ink/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onPreview}>
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </Button>
            {isSystem ? (
              <Button variant="gradient" size="sm" onClick={onDuplicate}>
                <Copy className="w-4 h-4 mr-1" />
                Duplicate
              </Button>
            ) : (
              <>
                <Button variant="gradient" size="sm" onClick={onEdit}>
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={onDuplicate}>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="aa-pill bg-primary/10 text-primary text-[10px]">{type}</span>
          {isSystem && (
            <span className="aa-pill-outline text-[10px] flex items-center gap-1">
              <Lock className="w-3 h-3" />
              System
            </span>
          )}
          {formats.map((format) => (
            <span key={format} className="aa-pill-outline text-[10px]">{format}</span>
          ))}
        </div>
        <h3 className="font-bold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );
}
