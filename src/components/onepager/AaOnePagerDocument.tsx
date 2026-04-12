import React from "react";

type OnePagerBlock = {
  id?: number | string;
  title?: string;
  content?: string;
  details?: string;
};

type Props = {
  brand?: string;
  series?: string;
  title?: string; // usually your hook
  audience?: string;
  blocks?: OnePagerBlock[];
};

function splitToBullets(text: string) {
  const t = String(text || "").trim();
  if (!t) return [];
  // split on new lines or "•" or "-" style bullets
  const raw = t
    .replace(/\r/g, "")
    .split(/\n+|•\s*/g)
    .map((s) => s.trim())
    .filter(Boolean);

  // if it's just one long sentence, don't force bullets
  if (raw.length <= 1) return [];
  return raw;
}

export function AaOnePagerDocument({
  brand = "Attract Acquisition",
  series = "Series",
  title = "One-Pager",
  audience = "Audience",
  blocks = [],
}: Props) {
  const safeBlocks = Array.isArray(blocks) ? blocks : [];
  const headerTitle = (title || "One-Pager").trim();

  // Map blocks into a doc-like structure:
  const howTo = safeBlocks[0];
  const remaining = safeBlocks.slice(1);

  const readMins = Math.max(
    1,
    Math.round(
      safeBlocks
        .map((b) => `${b.title || ""} ${b.content || ""} ${b.details || ""}`)
        .join(" ")
        .trim()
        .split(/\s+/).filter(Boolean).length / 180
    )
  );

  return (
    <div className="w-full max-w-[780px] mx-auto">
      {/* Paper */}
      <div className="rounded-2xl overflow-hidden bg-white text-[#0B0F19] border border-black/10 shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
        {/* Top brand bar */}
        <div className="bg-[#6A00F4] px-7 py-6 text-white">
          <div className="flex items-start justify-between gap-5">
            <div>
              <div className="text-[11px] tracking-[0.18em] uppercase text-white/80">
                {brand} • {series}
              </div>
              <div className="mt-2 text-[30px] leading-tight font-semibold">
                {headerTitle}
              </div>
              <div className="mt-2 text-[12px] text-white/80">
                Audience: <span className="text-white">{audience}</span>
              </div>
            </div>

            <div className="shrink-0">
              <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center font-bold">
                AA
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-7 py-6">
          {/* Meta row */}
          <div className="flex items-center justify-between gap-4 text-[12px] text-black/60">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 items-center rounded-full bg-black/5 px-3">
                One page
              </span>
              <span className="inline-flex h-6 items-center rounded-full bg-black/5 px-3">
                ~{readMins} min read
              </span>
            </div>
            <div className="text-black/50">aa-brand-studio</div>
          </div>

          {/* How to use */}
          <div className="mt-5 rounded-2xl border border-black/10 bg-[#F6F1FF] p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-9 h-9 rounded-xl bg-white border border-black/10 flex items-center justify-center">
                <span className="text-[#6A00F4] font-bold">i</span>
              </div>

              <div className="min-w-0">
                <div className="font-semibold text-[14px]">
                  How to use this one-pager
                </div>

                <div className="mt-2 text-[13px] leading-relaxed text-black/70">
                  {howTo?.content?.trim()
                    ? howTo.content
                    : "Read top-to-bottom. Use it as a checklist while scripting. Then convert it into a clean reel/carousel with a single outcome."}
                </div>

                {howTo?.details?.trim() ? (
                  <div className="mt-3 text-[12px] text-black/60 leading-relaxed">
                    {howTo.details}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="mt-6 grid grid-cols-1 gap-4">
            {remaining.length ? (
              remaining.slice(0, 6).map((b, idx) => {
                const bullets = splitToBullets(b.details || "");
                return (
                  <div
                    key={String(b.id ?? idx)}
                    className="rounded-2xl border border-black/10 bg-white p-5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#6A00F4]/10 border border-[#6A00F4]/20 flex items-center justify-center text-[12px] font-bold text-[#6A00F4]">
                        {idx + 1}
                      </div>
                      <div className="font-semibold text-[14px]">
                        {b.title?.trim() ? b.title : `Section ${idx + 1}`}
                      </div>
                    </div>

                    {b.content?.trim() ? (
                      <div className="mt-3 text-[13px] leading-relaxed text-black/70 whitespace-pre-wrap">
                        {b.content}
                      </div>
                    ) : null}

                    {bullets.length ? (
                      <ul className="mt-3 space-y-1.5 text-[12px] text-black/60 list-disc pl-5">
                        {bullets.slice(0, 8).map((x, i) => (
                          <li key={i}>{x}</li>
                        ))}
                      </ul>
                    ) : b.details?.trim() ? (
                      <div className="mt-3 text-[12px] text-black/60 whitespace-pre-wrap">
                        {b.details}
                      </div>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-black/10 bg-white p-6 text-[13px] text-black/60">
                No sections yet.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-between text-[11px] text-black/45">
            <div>{brand}</div>
            <div>Generated via Content Factory</div>
          </div>
        </div>
      </div>
    </div>
  );
}
