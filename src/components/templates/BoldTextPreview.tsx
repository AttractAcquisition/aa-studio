interface BoldTextPreviewProps {
  tag?: string;
  headline?: string;
  subline?: string;
}

export function BoldTextPreview({ 
  tag = "FRAMEWORK", 
  headline = "STOP CHASING. START ATTRACTING.", 
  subline = "" 
}: BoldTextPreviewProps) {
  return (
    <div className="w-full h-full bg-deep-ink p-6 flex flex-col justify-between relative">
      {/* Tag */}
      {tag && (
        <div className="self-start">
          <span className="inline-flex items-center px-3 py-1 rounded-full border border-border text-[8px] font-medium text-muted-foreground uppercase tracking-wider">
            {tag}
          </span>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center">
        <h2 className="text-lg font-black text-foreground leading-tight">
          {headline.split(' ').map((word, i) => (
            <span key={i}>
              {i === Math.floor(headline.split(' ').length / 2) ? (
                <span className="relative">
                  {word}{' '}
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary" />
                </span>
              ) : (
                word + ' '
              )}
            </span>
          ))}
        </h2>
        {subline && (
          <p className="text-xs text-muted-foreground mt-3">{subline}</p>
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
