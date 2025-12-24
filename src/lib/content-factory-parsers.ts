// Content Factory parsing utilities

import type {
  GenerateScriptResponse,
  GenerateOnePagerResponse,
  GenerateDesignResponse,
  OnePagerBlock,
  ExtractedImage,
} from "@/types/content-factory";

/**
 * Extract script text from the API response
 */
export function extractScriptText(data: GenerateScriptResponse): string {
  return (
    data.script_text ??
    data.script?.text ??
    data.output?.script?.text ??
    ""
  );
}

/**
 * Extract one-pager blocks from the API response
 */
export function extractOnePagerBlocks(data: GenerateOnePagerResponse): OnePagerBlock[] {
  // Prefer canonical blocks from server if present
  if (Array.isArray(data.blocks) && data.blocks.length > 0) {
    return data.blocks;
  }

  const opj = data.one_pager_json;
  let blocks: OnePagerBlock[] = [];

  if (Array.isArray(opj)) {
    blocks = opj;
  } else if (opj?.blocks && Array.isArray(opj.blocks)) {
    blocks = opj.blocks;
  } else if (opj?.sections && Array.isArray(opj.sections)) {
    blocks = opj.sections;
  }

  // Normalize block structure
  return blocks.map((b, idx) => ({
    id: b.id ?? idx + 1,
    title: b.title ?? `Beat ${idx + 1}`,
    content: b.content ?? b.body ?? "",
    details: b.details ?? b.notes ?? "",
  }));
}

/**
 * Convert base64 to data URL
 */
export function b64ToDataUrl(b64: string, mime = "image/png"): string {
  return `data:${mime};base64,${b64}`;
}

/**
 * Pick the first image URL from legacy images array
 */
export function pickFirstImageUrl(images?: ExtractedImage[]): string | null {
  if (!Array.isArray(images) || images.length === 0) return null;
  const first = images[0];
  return first?.url || first?.data_url || null;
}

/**
 * Extract design image URL from API response (image_b64-first, fallback to images[])
 */
export function extractDesignImage(data: GenerateDesignResponse): string | null {
  // Prefer image_b64
  if (data.image_b64) {
    return b64ToDataUrl(data.image_b64, data.mime || "image/png");
  }

  // Fallback to legacy images[]
  return pickFirstImageUrl(data.images);
}

/**
 * Escape HTML for safe rendering in new tab viewer
 */
export function escapeHtml(s: string): string {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Generate the full HTML for viewing a one-pager in a new tab
 */
export function generateOnePagerHtml(
  blocks: OnePagerBlock[],
  options: {
    hook?: string;
    series?: string;
    audience?: string;
  }
): string {
  const { hook = "One-Pager", series = "Series", audience = "" } = options;

  const blocksHtml = blocks
    .slice(0, 7)
    .map((b, idx) => {
      return `
        <div class="card">
          <div class="cardTitle">
            <div class="badge">${idx + 1}</div>
            <div class="h">${escapeHtml(b.title || `Section ${idx + 1}`)}</div>
          </div>
          ${b.content ? `<div class="p">${escapeHtml(b.content)}</div>` : ""}
          ${b.details ? `<div class="muted">${escapeHtml(b.details)}</div>` : ""}
        </div>
      `;
    })
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(hook?.trim() || "AA One-Pager")}</title>
  <style>
    body{margin:0;background:#0B0F19;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Inter,Arial;}
    .wrap{max-width:860px;margin:32px auto;padding:0 16px;}
    .paper{background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.35);border:1px solid rgba(0,0,0,.08);}
    .top{background:#6A00F4;color:#fff;padding:26px 28px;}
    .kicker{letter-spacing:.18em;text-transform:uppercase;font-size:11px;color:rgba(255,255,255,.8)}
    .title{font-size:30px;line-height:1.1;margin:10px 0 0;font-weight:700}
    .sub{margin-top:10px;font-size:12px;color:rgba(255,255,255,.8)}
    .aa{width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-weight:800}
    .row{display:flex;gap:16px;align-items:flex-start;justify-content:space-between}
    .body{padding:22px 28px;}
    .meta{display:flex;gap:8px;align-items:center;justify-content:space-between;color:rgba(0,0,0,.55);font-size:12px}
    .pill{display:inline-flex;align-items:center;height:24px;border-radius:999px;background:rgba(0,0,0,.05);padding:0 10px}
    .how{margin-top:14px;background:#F6F1FF;border:1px solid rgba(0,0,0,.10);border-radius:16px;padding:16px}
    .howH{font-weight:700;font-size:14px;margin-bottom:6px}
    .howP{font-size:13px;line-height:1.5;color:rgba(0,0,0,.72)}
    .cards{margin-top:16px;display:grid;grid-template-columns:1fr;gap:12px}
    .card{border:1px solid rgba(0,0,0,.10);border-radius:16px;padding:14px}
    .cardTitle{display:flex;gap:10px;align-items:center}
    .badge{width:28px;height:28px;border-radius:10px;background:rgba(106,0,244,.10);border:1px solid rgba(106,0,244,.20);display:flex;align-items:center;justify-content:center;color:#6A00F4;font-weight:800;font-size:12px}
    .h{font-weight:700}
    .p{margin-top:10px;font-size:13px;line-height:1.55;color:rgba(0,0,0,.72);white-space:pre-wrap}
    .muted{margin-top:10px;font-size:12px;line-height:1.5;color:rgba(0,0,0,.55);white-space:pre-wrap}
    .footer{margin-top:14px;display:flex;justify-content:space-between;font-size:11px;color:rgba(0,0,0,.45)}
    .btns{margin:14px 0 0;display:flex;gap:10px}
    .btn{border:0;border-radius:12px;padding:10px 12px;cursor:pointer;font-weight:700}
    .btnPrimary{background:#6A00F4;color:#fff}
    .btnGhost{background:rgba(255,255,255,.10);color:#fff;border:1px solid rgba(255,255,255,.18)}
    @media print{
      body{background:#fff}
      .wrap{margin:0;max-width:none}
      .btns{display:none}
      .paper{box-shadow:none;border:none}
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="btns">
      <button class="btn btnPrimary" onclick="window.print()">Print / Save as PDF</button>
      <button class="btn btnGhost" onclick="window.close()">Close</button>
    </div>

    <div class="paper">
      <div class="top">
        <div class="row">
          <div>
            <div class="kicker">Attract Acquisition • ${escapeHtml(series)}</div>
            <div class="title">${escapeHtml(hook?.trim() || "One-Pager")}</div>
            <div class="sub">Audience: <b style="color:#fff">${escapeHtml(audience)}</b></div>
          </div>
          <div class="aa">AA</div>
        </div>
      </div>

      <div class="body">
        <div class="meta">
          <div style="display:flex;gap:8px;align-items:center">
            <span class="pill">One page</span>
            <span class="pill">Generated</span>
          </div>
          <div>aa-brand-studio</div>
        </div>

        <div class="how">
          <div class="howH">How to use this one-pager</div>
          <div class="howP">Read top-to-bottom. Use it as a checklist while scripting. Then convert it into a clean reel/carousel with a single outcome.</div>
        </div>

        <div class="cards">
          ${blocksHtml}
        </div>

        <div class="footer">
          <div>Attract Acquisition</div>
          <div>Content Factory</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
