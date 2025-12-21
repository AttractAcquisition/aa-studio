interface ProofCardPreviewProps {
  headline?: string;
  score?: number;
}

export function ProofCardPreview({ 
  headline = "More DMs. Better Leads.",
  score = 94
}: ProofCardPreviewProps) {
  return (
    <div className="w-full h-full bg-deep-ink p-4 flex flex-col relative">
      {/* Header */}
      <div className="self-start mb-3">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary text-[7px] font-bold text-primary-foreground uppercase tracking-wider">
          PROOF
        </span>
      </div>

      {/* Headline */}
      <h2 className="text-sm font-bold text-foreground leading-tight mb-3">
        {headline}
      </h2>

      {/* Screenshot Area */}
      <div className="flex-1 rounded-xl border-2 border-lavender/30 bg-lavender/5 mb-3 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 rounded-lg bg-lavender/20 mx-auto mb-1 flex items-center justify-center">
            <span className="text-[8px] text-lavender">📱</span>
          </div>
          <p className="text-[7px] text-muted-foreground">Screenshot</p>
        </div>
      </div>

      {/* Info Panels */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-lg bg-lavender/10 p-2">
          <p className="text-[6px] text-primary font-bold uppercase mb-0.5">What Changed</p>
          <p className="text-[7px] text-muted-foreground">• Redesigned CTA</p>
          <p className="text-[7px] text-muted-foreground">• New hook</p>
        </div>
        <div className="rounded-lg bg-lavender/10 p-2">
          <p className="text-[6px] text-primary font-bold uppercase mb-0.5">Why It Worked</p>
          <p className="text-[7px] text-muted-foreground">• Clear value</p>
          <p className="text-[7px] text-muted-foreground">• Strong CTA</p>
        </div>
      </div>

      {/* Score + Logo */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="px-2 py-1 rounded-full bg-gradient-to-r from-primary to-accent">
            <span className="text-[8px] font-bold text-primary-foreground">{score}% Score</span>
          </div>
        </div>
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <span className="text-[8px] font-black text-primary-foreground">AA</span>
        </div>
      </div>
    </div>
  );
}
