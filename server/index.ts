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
// Design kind → prompt format mapping
// (your prompt supports: one_pager | bold_text_card | reel_cover)
// -------------------------------
function mapKindToFormat(kind: string | undefined) {
  if (kind === "bold_text_card") return { format: "bold_text_card", ratio: "1:1" as const };
  if (kind === "reel_cover") return { format: "reel_cover", ratio: "9:16" as const };
  if (kind === "one_pager_cover") return { format: "one_pager", ratio: "4:5" as const };
  return { format: null as any, ratio: null as any };
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

      // 1) Load current row
      const { data: row, error: fetchErr } = await supabase
        .from("content_runs")
        .select("id, user_id, content_type, series, hook, target_audience, script_text")
        .eq("id", run_id)
        .single();

      if (fetchErr) throw fetchErr;
      if (!row) return res.status(404).json({ error: "Run not found" });
      if (row.user_id !== userId) return res.status(403).json({ error: "Forbidden" });

      // ✅ Allow UI to pass edited script_text
      const incomingScript = typeof body.script_text === "string" ? body.script_text : null;
      const scriptToUse = (incomingScript && incomingScript.trim()) ? incomingScript.trim() : row.script_text;

      if (!scriptToUse) {
        return res.status(400).json({ error: "Run has no script_text yet" });
      }

      // ✅ Persist edited script back to DB
      if (incomingScript && incomingScript.trim()) {
        await supabase
          .from("content_runs")
          .update({ script_text: incomingScript.trim() })
          .eq("id", run_id);
      }

      // 2) Build prompt: meta + SCRIPT
      const input_as_text = [
        `content_type: ${row.content_type}`,
        `series: ${row.series}`,
        `hook: ${row.hook ?? ""}`,
        `target_audience: ${row.target_audience}`,
        ``,
        `SCRIPT:`,
        scriptToUse,
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
    // ACTION 3: GENERATE DESIGN (AA_Design_Agent via runWorkflow route "design_agent")
    // -------------------------------
    if (body?.action === "generate_design") {
      const run_id = body.run_id as string;

      // Frontend sends `kind` (bold_text_card | reel_cover | one_pager_cover)
      const kind = (body.kind ?? null) as string | null;

      // Prompt expects `format` (one_pager | bold_text_card | reel_cover)
      const explicitFormat = (body.format ?? null) as
        | "one_pager"
        | "bold_text_card"
        | "reel_cover"
        | null;

      const mapped = kind ? mapKindToFormat(kind) : { format: null, ratio: null };
      const format =
        explicitFormat ?? (mapped.format as any);

      const ratio =
        (body.ratio as "4:5" | "1:1" | "9:16" | null) ??
        (mapped.ratio as any) ??
        null;

      const mode = (body.mode ?? "clean") as "clean" | "punchy";

      if (!run_id || !uuidRegex.test(run_id)) {
        return res
          .status(400)
          .json({ error: "Missing or invalid run_id (UUID required)" });
      }

      if (!format || !["one_pager", "bold_text_card", "reel_cover"].includes(format)) {
        return res.status(400).json({
          error: "Missing or invalid format",
          supported: ["one_pager", "bold_text_card", "reel_cover"],
          note: "If your UI uses kind=one_pager_cover, it is mapped to format=one_pager",
        });
      }

      if (!supabase) {
        return res
          .status(500)
          .json({ error: "Supabase not configured on API (missing env vars)" });
      }

      const { data: row, error: fetchErr } = await supabase
        .from("content_runs")
        .select("id, user_id, content_type, series, hook, target_audience, one_pager_json")
        .eq("id", run_id)
        .single();

      if (fetchErr) throw fetchErr;
      if (!row) return res.status(404).json({ error: "Run not found" });
      if (row.user_id !== userId) return res.status(403).json({ error: "Forbidden" });
      if (!row.one_pager_json) {
        return res.status(400).json({ error: "Run has no one_pager_json yet" });
      }

      const blocks = normalizeOnePagerBlocks(row.one_pager_json).slice(0, 7);

      // Input must match your prompt's "Input" section
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

      const r = await runWorkflow({
        // ✅ IMPORTANT: this must match your runWorkflow routes
        agent: "design_agent",
        input_as_text,
      });

      const out = String(r?.output_text ?? r?.finalOutput ?? "").trim();
      const parsed = tryParseJson(out);

      if (!parsed.ok) {
        return res.status(200).json({
          run_id,
          kind,
          format,
          ratio,
          design_json: null,
          error: "Design agent returned invalid JSON.",
          debug: {
            cleaned_preview: parsed.cleaned ? parsed.cleaned.slice(0, 400) : null,
            raw_preview: out.slice(0, 400),
          },
        });
      }

      return res.status(200).json({
        run_id,
        kind,
        format,
        ratio,
        design_json: parsed.json,
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
