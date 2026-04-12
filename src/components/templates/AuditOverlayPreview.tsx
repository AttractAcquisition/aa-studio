interface AuditOverlayPreviewProps {
  score?: number;
}

export function AuditOverlayPreview({ score = 87 }: AuditOverlayPreviewProps) {
  return (
    <div className="w-full h-full bg-deep-ink p-4 flex flex-col relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary text-[6px] font-bold text-primary-foreground uppercase tracking-wider">
          AUDIT
        </span>
        <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-primary to-accent">
          <span className="text-[7px] font-bold text-primary-foreground">{score}%</span>
        </div>
      </div>

      {/* Screenshot Area with Overlays */}
      <div className="flex-1 rounded-xl border border-border bg-muted/20 relative overflow-hidden">
        {/* Blur rectangles simulation */}
        <div className="absolute top-3 left-3 w-12 h-4 rounded bg-muted/50 backdrop-blur-sm" />
        <div className="absolute top-8 left-3 w-16 h-3 rounded bg-muted/50 backdrop-blur-sm" />
        
        {/* Arrow callout */}
        <div className="absolute top-6 right-4 flex items-center gap-1">
          <div className="w-6 h-0.5 bg-primary" />
          <div className="w-0 h-0 border-l-4 border-l-primary border-y-2 border-y-transparent" />
        </div>

        {/* Center placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[7px] text-muted-foreground">Base Screenshot</p>
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="text-center">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-500/20 text-[6px] font-bold text-red-400 uppercase">
            Problem
          </span>
        </div>
        <div className="text-center">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/20 text-[6px] font-bold text-primary uppercase">
            Fix
          </span>
        </div>
        <div className="text-center">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-500/20 text-[6px] font-bold text-green-400 uppercase">
            Result
          </span>
        </div>
      </div>

      {/* AA Logo */}
      <div className="mt-3 self-end">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <span className="text-[8px] font-black text-primary-foreground">AA</span>
        </div>
      </div>
    </div>
  );
}
