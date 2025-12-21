interface OnePagerPreviewProps {
  title?: string;
}

export function OnePagerPreview({ 
  title = "The Complete Hook Formula"
}: OnePagerPreviewProps) {
  return (
    <div className="w-full h-full bg-deep-ink p-4 flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="mb-3">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary text-[6px] font-bold text-primary-foreground uppercase tracking-wider mb-2">
          ONE-PAGER
        </span>
        <h2 className="text-xs font-black text-foreground leading-tight">{title}</h2>
      </div>

      {/* Stacked Cards */}
      <div className="flex-1 space-y-2 overflow-hidden">
        {[1, 2, 3].map((beat) => (
          <div key={beat} className="rounded-xl bg-lavender/10 border border-lavender/20 p-2">
            <p className="text-[6px] font-bold text-primary uppercase mb-1">Beat {beat}</p>
            <p className="text-[8px] font-semibold text-foreground mb-1">Key Point Title</p>
            <p className="text-[6px] text-muted-foreground">• Detail point one</p>
            <p className="text-[6px] text-muted-foreground">• Detail point two</p>
          </div>
        ))}
      </div>

      {/* CTA Strip */}
      <div className="mt-3 py-2 px-3 rounded-xl bg-gradient-to-r from-primary to-accent">
        <p className="text-[7px] font-bold text-primary-foreground text-center">Save this for later →</p>
      </div>
    </div>
  );
}
