import * as React from "react";

type OnePagerBlock = {
  id?: number | string;
  title?: string;
  content?: string;
  details?: string;
};

type Props = {
  series?: string;
  hook?: string;
  audience?: string;
  blocks: OnePagerBlock[];
};

/**
 * A clean "document-style" one-pager (white page, clear hierarchy)
 * Designed to look like a real downloadable page (like your 2nd screenshot).
 */
export function AaOnePagerDocument({
  series,
  hook,
  audience,
  blocks,
}: Props) {
  const title = (hook || "One-Pager").trim();
  const safeSeries = (series || "Series").trim();
  const safeAudience = (audience || "Audience").trim();

  const topBlocks = blocks?.slice(0, 2) ?? [];
  const workflowBlocks = blocks?.slice(2, 6) ?? [];
  const extraBlocks = blocks?.slice(6) ?? [];

  return (
    <div className="w-full h-full bg-white text-slate-900">
      {/* PAGE */}
      <div className="w-full h-full p-10">
        {/* Header band */}
        <div className="rounded-2xl overflow-hidden border border-slate-200">
          <div className="px-7 py-6 bg-[#6A00F4] text-white">
            <div className="flex items-center justify-between gap-6">
              <div>
                <div className="text-xs tracking-widest uppercase text-white/80">
                  Attract Acquisition • {safeSeries}
                </div>
                <div className="mt-2 text-3xl font-semibold leading-tight">
                  {title}
                </div>
                <div className="mt-2 text-sm text-white/80">
                  Audience: {safeAudience}
                </div>
              </div>

              <div className="shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center font-bold">
                  AA
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-7 py-7 bg-white">
            {/* Intro callout */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-8 h-8 rounded-xl bg-[#6A00F4]/10 border border-[#6A00F4]/20 flex items-center justify-center text-[#6A00F4] font-semibold">
                  i
                </div>
                <div>
                  <div className="font-semibold">How to use this one-pager</div>
                  <div className="text-sm text-slate-600 mt-1 leading-relaxed">
                    Read top-to-bottom. Turn each step into a post (or a short
                    video). Save it, reuse it, and tweak the examples for the
                    exact business you’re marketing.
                  </div>
                </div>
              </div>
            </div>

            {/* Two-column layout */}
            <div className="mt-7 grid grid-cols-1 lg:grid-cols-12 gap-7">
              {/* Left column */}
              <div className="lg:col-span-5 space-y-6">
                <SectionTitle title="What’s actually happening" />

                {topBlocks.length ? (
                  <div className="space-y-4">
                    {topBlocks.map((b, idx) => (
                      <Card key={String(b.id ?? idx)}>
                        <CardHeader
                          number={idx + 1}
                          title={b.title || `Point ${idx + 1}`}
                        />
                        <CardBody content={b.content} details={b.details} />
                      </Card>
                    ))}
                  </div>
                ) : (
                  <EmptyHint />
                )}

                <div className="rounded-2xl border border-slate-200 p-5">
                  <div className="font-semibold">Quick checklist</div>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    <li className="flex gap-2">
                      <span className="text-[#6A00F4] font-bold">•</span>
                      One clear promise (what this helps them do)
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#6A00F4] font-bold">•</span>
                      4–6 steps they can follow today
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#6A00F4] font-bold">•</span>
                      Examples (so it’s not “generic advice”)
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#6A00F4] font-bold">•</span>
                      A tiny CTA (comment / DM / book)
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right column */}
              <div className="lg:col-span-7 space-y-6">
                <SectionTitle title="The 5-minute workflow (use this daily)" />

                {workflowBlocks.length ? (
                  <div className="space-y-3">
                    {workflowBlocks.map((b, idx) => (
                      <StepRow
                        key={String(b.id ?? idx)}
                        number={idx + 1}
                        title={b.title || `Step ${idx + 1}`}
                        content={b.content}
                        details={b.details}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyHint />
                )}

                {extraBlocks.length ? (
                  <div className="mt-6">
                    <SectionTitle title="Extra notes / examples" />
                    <div className="mt-3 space-y-3">
                      {extraBlocks.slice(0, 4).map((b, idx) => (
                        <Card key={String(b.id ?? idx)}>
                          <CardHeader
                            number={idx + 1}
                            title={b.title || `Extra ${idx + 1}`}
                          />
                          <CardBody content={b.content} details={b.details} />
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="font-semibold">CTA (optional)</div>
                  <div className="mt-2 text-sm text-slate-700 leading-relaxed">
                    If you want this turned into a full content system, drop a
                    comment with <span className="font-semibold">“ONE-PAGER”</span>{" "}
                    and I’ll send you the template.
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div>Attract Acquisition • aa-brand-studio</div>
              <div className="text-slate-600">v1 • Document layout</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- UI bits ---------------- */

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-lg font-semibold">{title}</div>
      <div className="h-px flex-1 mx-4 bg-slate-200" />
      <div className="text-xs uppercase tracking-widest text-slate-500">
        One-Pager
      </div>
    </div>
  );
}

function EmptyHint() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
      No blocks were provided for this section yet.
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      {children}
    </div>
  );
}

function CardHeader({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-xl bg-[#6A00F4] text-white flex items-center justify-center font-bold text-sm">
        {number}
      </div>
      <div className="font-semibold leading-snug">{title}</div>
    </div>
  );
}

function CardBody({
  content,
  details,
}: {
  content?: string;
  details?: string;
}) {
  return (
    <div className="mt-3 space-y-3">
      {content?.trim() ? (
        <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
          {content}
        </div>
      ) : null}

      {details?.trim() ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
          {details}
        </div>
      ) : null}
    </div>
  );
}

function StepRow({
  number,
  title,
  content,
  details,
}: {
  number: number;
  title: string;
  content?: string;
  details?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-2xl bg-[#6A00F4]/10 border border-[#6A00F4]/20 flex items-center justify-center text-[#6A00F4] font-bold">
          {number}
        </div>
        <div className="flex-1">
          <div className="font-semibold">{title}</div>
          {content?.trim() ? (
            <div className="mt-2 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {content}
            </div>
          ) : null}

          {details?.trim() ? (
            <div className="mt-3 text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
              <span className="font-semibold text-slate-700">Example:</span>{" "}
              {details}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
