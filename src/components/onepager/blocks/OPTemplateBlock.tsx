// One-Pager Template Block (copy-paste code panel)
import { useState } from "react";
import type { TemplateBlock } from "@/types/one-pager-layout";
import { Copy, Check } from "lucide-react";

interface OPTemplateBlockProps {
  block: TemplateBlock;
}

export function OPTemplateBlock({ block }: OPTemplateBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = block.lines.join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl bg-secondary/50 border border-border/40 overflow-hidden">
      {/* Header with title and copy button */}
      <div className="flex items-center justify-between px-4 py-3 bg-secondary/80 border-b border-border/40">
        <h4 className="font-semibold text-foreground text-sm">{block.title}</h4>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code-like lines */}
      <div className="p-4 font-mono text-sm space-y-1">
        {block.lines.map((line, idx) => (
          <div key={idx} className="text-muted-foreground">
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
