import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { runWorkflow } from "../lib/aa-workflow";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// ✅ Always return JSON (prevents “Unexpected token <”)
app.use((_req, res, next) => {
  res.setHeader("Content-Type", "application/json");
  next();
});

const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

// ✅ Healthcheck for Railway
app.get("/health", (_req, res) => res.status(200).json({ ok: true }));

// ✅ Prevent GET HTML errors
app.get("/api/content-factory", (_req, res) =>
  res.status(405).json({ error: "Use POST" })
);

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// -------------------------------
// JSON parsing helpers
// -------------------------------
function stripCodeFences(s: string) {
  return String(s || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function extractJsonValue(s: string) {
  const str = String(s || "").trim();
  if (!str) return "";

  // Prefer object
  const oStart = str.indexOf("{");
  const oEnd = str.lastIndexOf("}");
  if (oStart !== -1 && oEnd !== -1 && oEnd > oStart) {
    return str.slice(oStart, oEnd + 1).trim();
  }

  // Or array
  const aStart = str.indexOf("[");
  const aEnd = str.lastIndexOf("]");
  if (aStart !== -1 && aEnd !== -1 && aEnd > aStart) {
    return str.slice(aStart, aEnd + 1).trim();
  }

  return "";
}

function tryParseJson(raw: string) {
  const cleaned = extractJsonValue(stripCodeFences(raw));
  if (!cleaned) return { ok: false as const, cleaned: "", json: null };

  try {
    return { ok: true as const, cleaned, json: JSON.parse(cleaned) };
  } catch {
    return { ok: false as const, cleaned, json: null };
  }
}

// -------------------------------
// Normalization helpers
// -------------------------------
function normalizeOnePagerBlocks(onePagerJson: any) {
  let blocks: any[] = [];

  if (Array.isArray(onePagerJson)) blocks = onePagerJson;
  else if (Array.isArray(onePagerJson?.blocks)) blocks = onePagerJson.blocks;
  else if (Array.isArray(onePagerJson?.sections)) blocks = onePagerJson.sections;
  else if (Array.isArray(onePagerJson?.beats)) blocks = onePagerJson.beats;
  else if (Array.isArray(onePagerJson?.items)) blocks = onePagerJson.items;

  blocks = (blocks || []).map((b, idx) => ({
    id: b?.id ?? idx + 1,
    title: b?.title ?? b?.heading ?? `Beat ${idx + 1}`,
    content: b?.content ?? b?.body ?? b?.text ?? b?.copy ?? "",
    details: b?.details ?? b?.notes ?? b?.extras ?? "",
  }));

  return blocks.filter(
    (b) =>
      (b.title && String(b.title).trim()) ||
      (b.content && String(b.content).trim())
  );
}

// -------------------------------
// Workflow helper (retry agent aliases)
// -------------------------------
async function runDesignWorkflowWithFallback(input_as_text: string) {
  const agentCandidates = [
    "AA_Design_Agent", // as per your prompt header
    "aa_design_agent", // common snake-case
    "design_agent", // common generic route
  ];

  let lastErr: any = null;

  for (const agent of agentCandidates) {
    try {
      const r = await runWorkflow({ agent, input_as_text });
      return { ok: true as const, agentUsed: agent, result: r };
    } catch (e: any) {
      lastErr = e;
      const msg = String(e?.message || e || "");
      // If it's an unknown route, try the next alias
      if (/unknown agent route/i.test(msg)) continue;
      // Otherwise bubble up (real failures)
      throw e;
    }
  }

  return { ok: false as const, agentUsed: null as any, result: null, error: lastErr };
}

app.post("/api/content-factory", async (req, res) => {
  try {
    const body = req.body as any;

    const userId = req.header("x-user-id");
    if (!userId) return res.status(401).json({ error: "Missing x-user-id header" });
    if (!uuidRegex.test(userId)) {
      return res.status(400).json({
        error: "x-user-id must be a UUID",
        example: "00000000-0000-0000-0000-000000000001",
      });
    }

    // -------------------------------
    // ACTION 1: GENERATE SCRIPT
    // -------------------------------
    if (body?.action === "generate_script") {
      const { content_type, series, hook, target_audience } = body.inputs ?? {};
      if (!content_type || !series || !target_audience) {
        return res.status(400).json({
          error: "Missing required inputs",
          required: ["content_type", "series", "target_audience"],
        });
      }

      // 1) Create DB row
      let run_id = crypto.randomUUID();
      if (supabase) {
        const { data, error } = await supabase
          .from("content_runs")
          .insert({
            user_id: userId,
            content_type,
            series,
            hook: hook ?? null,
            target_audience,
            status: "DRAFT",
            idempotency_key: body.idempotency_key ?? null,
          })
          .select("id")
          .single();

        if (error) throw error;
        run_id = data.id;
      }

      // 2) Build prompt
      const input_as_text = [
        `content_type: ${content_type}`,
        `series: ${series}`,
        `hook: ${hook ?? ""}`,
        `target_audience: ${target_audience}`,
      ].join("\n");

      // 3) Run script agent
      const workflowResult = await runWorkflow({
        agent: "script_agent",
        input_as_text,
      });

      const script_text =
        workflowResult?.script_text ??
        workflowResult?.finalOutput ??
        workflowResult?.output_text ??
        "";

      if (!script_text) {
        if (supabase) {
          await supabase
            .from("content_runs")
            .update({ status: "FAILED", last_error: "No script text returned" })
            .eq("id", run_id);
        }
        return res.status(500).json({ error: "Workflow returned no script text." });
      }

      // 4) Save results
      if (supabase) {
        await supabase
          .from("content_runs")
          .update({
            status: "SCRIPT_DONE",
            script_text,
            script_json: null,
            brief_json: null,
          })
          .eq("id", run_id);
      }

      return res.status(200).json({
        run_id,
        script_text,
        brief_json: null,
        script_json: null,
      });
    }

    // -------------------------------
    // ACTION 2: GENERATE ONE-PAGER
    // -------------------------------
    if (body?.action === "generate_one_pager") {
      const run_id = body.run_id as string;
      if (!run_id || !uuidRegex.test(run_id)) {
        return res
          .status(400)
          .json({ error: "Missing or invalid run_id (UUID required)" });
      }

      if (!supabase) {
        return res
          .status(500)
          .json({ error: "Supabase not configured on API (missing env vars)" });
      }

      // 1) Load the script from DB
      const { data: row, error: fetchErr } = await supabase
        .from("content_runs")
        .select("id, user_id, content_type, series, hook, target_audience, script_text")
        .eq("id", run_id)
        .single();

      if (fetchErr) throw fetchErr;
      if (!row) return res.status(404).json({ error: "Run not found" });
      if (row.user_id !== userId) return res.status(403).json({ error: "Forbidden" });
      if (!row.script_text) return res.status(400).json({ error: "Run has no script_text yet" });

      // 2) Build prompt: meta + SCRIPT
      const input_as_text = [
        `content_type: ${row.content_type}`,
        `series: ${row.series}`,
        `hook: ${row.hook ?? ""}`,
        `target_audience: ${row.target_audience}`,
        ``,
        `SCRIPT:`,
        row.script_text,
      ].join("\n");

      // 3) Run one-pager agent
      const r = await runWorkflow({
        agent: "one_pager_agent",
        input_as_text,
      });

      const one_pager_text = String(r?.output_text ?? r?.finalOutput ?? "").trim();

      // 4) Parse JSON safely
      const parsed = tryParseJson(one_pager_text);

      if (!parsed.ok) {
        await supabase
          .from("content_runs")
          .update({
            status: "FAILED",
            last_error: "One-pager agent did not return valid JSON",
            one_pager_text,
          })
          .eq("id", run_id);

        return res.status(200).json({
          run_id,
          one_pager_json: null,
          one_pager_text,
          blocks: [],
          error: "One-pager agent returned invalid JSON.",
          debug: {
            cleaned_preview: parsed.cleaned ? parsed.cleaned.slice(0, 400) : null,
            raw_preview: one_pager_text.slice(0, 400),
          },
        });
      }

      const one_pager_json = parsed.json;
      const blocks = normalizeOnePagerBlocks(one_pager_json);

      if (!blocks.length) {
        await supabase
          .from("content_runs")
          .update({
            status: "FAILED",
            last_error:
              "One-pager JSON parsed but produced zero blocks after normalization",
            one_pager_text,
            one_pager_json,
          })
          .eq("id", run_id);

        return res.status(200).json({
          run_id,
          one_pager_json,
          one_pager_text,
          blocks: [],
          error: "One-pager returned no blocks after normalization.",
        });
      }

      // 5) Save
      await supabase
        .from("content_runs")
        .update({
          status: "ONE_PAGER_DONE",
          one_pager_text: JSON.stringify(one_pager_json),
          one_pager_json,
        })
        .eq("id", run_id);

      return res.status(200).json({
        run_id,
        one_pager_json,
        one_pager_text,
        blocks,
      });
    }

    // -------------------------------
    // ACTION 3: GENERATE DESIGN (AA_Design_Agent)
    // -------------------------------
    if (body?.action === "generate_design") {
      const run_id = body.run_id as string;

      // Frontend currently sends `kind` (not `format`)
      const kind = (body.kind ?? body.format) as
        | "bold_text_card"
        | "reel_cover"
        | "one_pager_cover"
        | "one_pager";

      // Map UI kinds to prompt formats
      const formatMap: Record<string, "one_pager" | "bold_text_card" | "reel_cover"> = {
        bold_text_card: "bold_text_card",
        reel_cover: "reel_cover",
        one_pager_cover: "one_pager", // cover is rendered as a one_pager-style spec for 4:5
        one_pager: "one_pager",
      };

      const ratioDefaultMap: Record<string, "1:1" | "9:16" | "4:5"> = {
        bold_text_card: "1:1",
        reel_cover: "9:16",
        one_pager_cover: "4:5",
        one_pager: "4:5",
      };

      const format = formatMap[String(kind || "")];
      const ratio = (body.ratio ?? ratioDefaultMap[String(kind || "")] ?? null) as
        | "4:5"
        | "1:1"
        | "9:16"
        | null;

      const mode = (body.mode ?? "clean") as "clean" | "punchy";

      if (!run_id || !uuidRegex.test(run_id)) {
        return res
          .status(400)
          .json({ error: "Missing or invalid run_id (UUID required)" });
      }

      if (!format) {
        return res.status(400).json({
          error: "Missing or invalid kind/format",
          supported_kinds: ["bold_text_card", "reel_cover", "one_pager_cover"],
          supported_formats: ["one_pager", "bold_text_card", "reel_cover"],
        });
      }

      if (!supabase) {
        return res
          .status(500)
          .json({ error: "Supabase not configured on API (missing env vars)" });
      }

      const { data: row, error: fetchErr } = await supabase
        .from("content_runs")
        .select("id, user_id, series, hook, target_audience, one_pager_json")
        .eq("id", run_id)
        .single();

      if (fetchErr) throw fetchErr;
      if (!row) return res.status(404).json({ error: "Run not found" });
      if (row.user_id !== userId) return res.status(403).json({ error: "Forbidden" });
      if (!row.one_pager_json) {
        return res.status(400).json({ error: "Run has no one_pager_json yet" });
      }

      const blocks = normalizeOnePagerBlocks(row.one_pager_json).slice(0, 7);

      // ✅ Match your Design Agent prompt INPUT fields exactly
      const inputPayload = {
        brand: "Attract Acquisition",
        series: row.series,
        title: row.hook ?? "",
        audience: row.target_audience,
        blocks,
        mode,
        ratio: ratio ?? undefined,
        format,
      };

      const input_as_text = JSON.stringify(inputPayload, null, 2);

      // ✅ Retry common agent aliases to avoid "Unknown agent route"
      const wf = await runDesignWorkflowWithFallback(input_as_text);

      if (!wf.ok) {
        // IMPORTANT: 200 so UI can show debug without fetch() throwing
        return res.status(200).json({
          run_id,
          kind: kind ?? format,
          format,
          design_json: null,
          error: "Unknown agent route (design agent not registered in aa-workflow).",
          debug: {
            tried_agents: ["AA_Design_Agent", "aa_design_agent", "design_agent"],
            message: String((wf as any)?.error?.message || (wf as any)?.error || ""),
          },
        });
      }

      const out = String(wf.result?.output_text ?? wf.result?.finalOutput ?? "").trim();
      const parsed = tryParseJson(out);

      if (!parsed.ok) {
        // IMPORTANT: 200 so UI can show debug without fetch() throwing
        return res.status(200).json({
          run_id,
          kind: kind ?? format,
          format,
          design_json: null,
          error: "Design agent returned invalid JSON.",
          debug: {
            agent_used: wf.agentUsed,
            cleaned_preview: parsed.cleaned ? parsed.cleaned.slice(0, 400) : null,
            raw_preview: out.slice(0, 400),
          },
        });
      }

      return res.status(200).json({
        run_id,
        kind: kind ?? format,
        format,
        design_json: parsed.json,
        debug: { agent_used: wf.agentUsed },
      });
    }

    return res.status(400).json({
      error: "Unsupported action",
      supported: ["generate_script", "generate_one_pager", "generate_design"],
    });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e?.message ?? "Unknown error" });
  }
});

// ✅ Railway must bind to process.env.PORT
const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API listening on http://0.0.0.0:${PORT}`);
});
