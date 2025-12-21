interface CarouselPreviewProps {
  title?: string;
  subtitle?: string;
}

export function CarouselPreview({ 
  title = "The Attraction Framework",
  subtitle = "3 Steps to Magnetic Content"
}: CarouselPreviewProps) {
  return (
    <div className="w-full h-full bg-pure-white p-4 flex flex-col relative">
      {/* Header */}
      <div className="mb-3">
        <h2 className="text-sm font-black text-deep-ink leading-tight">{title}</h2>
        <p className="text-[8px] text-deep-ink/60 mt-0.5">{subtitle}</p>
      </div>

      {/* Panels */}
      <div className="flex-1 space-y-2">
        <div className="rounded-xl bg-lavender p-3">
          <p className="text-[8px] font-bold text-deep-purple uppercase mb-1">Step 1</p>
          <p className="text-[9px] font-bold text-deep-ink">Define Your Positioning</p>
          <p className="text-[7px] text-deep-ink/70 mt-0.5">• Clear value prop</p>
        </div>
        <div className="rounded-xl bg-lavender p-3">
          <p className="text-[8px] font-bold text-deep-purple uppercase mb-1">Step 2</p>
          <p className="text-[9px] font-bold text-deep-ink">Create Magnetic Content</p>
          <p className="text-[7px] text-deep-ink/70 mt-0.5">• Hook-driven posts</p>
        </div>
        <div className="rounded-xl bg-lavender p-3">
          <p className="text-[8px] font-bold text-deep-purple uppercase mb-1">Step 3</p>
          <p className="text-[9px] font-bold text-deep-ink">Convert with Systems</p>
          <p className="text-[7px] text-deep-ink/70 mt-0.5">• DM automation</p>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-3 flex items-center justify-between">
        <div className="px-2 py-1 rounded-full bg-deep-purple">
          <span className="text-[7px] font-bold text-pure-white">Get the Full Guide →</span>
        </div>
        <div className="w-6 h-6 rounded-md bg-deep-ink flex items-center justify-center">
          <span className="text-[8px] font-black text-pure-white">AA</span>
        </div>
      </div>
    </div>
  );
}
