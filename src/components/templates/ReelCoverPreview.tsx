interface ReelCoverPreviewProps {
  categoryTag?: string;
  title?: string;
  subtitle?: string;
}

export function ReelCoverPreview({ 
  categoryTag = "ATTRACTION", 
  title = "YOUR CONTENT IS NOISE.", 
  subtitle = "Here's how to fix it." 
}: ReelCoverPreviewProps) {
  return (
    <div className="w-full h-full bg-deep-ink p-6 flex flex-col justify-between relative">
      {/* Category Tag */}
      <div className="self-start">
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary text-[8px] font-bold text-primary-foreground uppercase tracking-wider">
          {categoryTag}
        </span>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center">
        <h2 className="text-xl font-black text-foreground leading-tight mb-2">
          {title}
        </h2>
        <div className="w-12 h-1 bg-primary rounded-full mb-3" />
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {/* AA Logo */}
      <div className="self-end">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <span className="text-[10px] font-black text-primary-foreground">AA</span>
        </div>
      </div>
    </div>
  );
}
