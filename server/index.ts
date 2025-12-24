import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import OpenAI from "openai";
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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
// Helpers: map ratio -> image size
// GPT image models support: 1024x1024, 1536x1024, 1024x1536, or auto.
// For 4:5 we generate portrait (1024x1536) and your UI container crops naturally.
// -------------------------------
function sizeForRatio(ratio: "1:1" | "9:16" | "4:5") {
  if (ratio === "1:1") return "1024x1024";
  // both 9:16 and 4:5 are portrait-ish; we'll use portrait and crop in UI
  return "1024x1536";
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
    // ACTION 3: GENERATE DESIGN (prompt -> image)
    // -------------------------------
    if (body?.action === "generate_design") {
      const run_id = body.run_id as string;

      // frontend sends kind; your prompt uses "format"
      const kind = String(body.kind ?? "").trim();

      // Map UI kind -> agent format + ratio
      // (Your agent spec only allows one_pager | bold_text_card | reel_cover)
      let format: "one_pager" | "bold_text_card" | "reel_cover" | null = null;
      let ratio: "1:1" | "9:16" | "4:5" = "1:1";

      if (kind === "bold_text_card") {
        format = "bold_text_card";
        ratio = "1:1";
      } else if (kind === "reel_cover") {
        format = "reel_cover";
        ratio = "9:16";
      } else if (kind === "one_pager_cover") {
        // Treat as one_pager-style design in 4:5 frame (cover-like)
        format = "one_pager";
        ratio = "4:5";
      } else {
        // also accept body.format directly if you decide to pass it later
        const f = String(body.format ?? "").trim();
        if (f === "one_pager" || f === "bold_text_card" || f === "reel_cover") {
          format = f;
        }
        const r = String(body.ratio ?? "").trim();
        if (r === "1:1" || r === "9:16" || r === "4:5") ratio = r;
      }

      const mode = (body.mode ?? "clean") as "clean" | "punchy";

      if (!run_id || !uuidRegex.test(run_id)) {
        return res
          .status(400)
          .json({ error: "Missing or invalid run_id (UUID required)" });
      }

      if (!format) {
        return res.status(400).json({
          error: "Missing or invalid kind/format",
          supported_kind: ["bold_text_card", "reel_cover", "one_pager_cover"],
          supported_format: ["one_pager", "bold_text_card", "reel_cover"],
        });
      }

      if (!supabase) {
        return res
          .status(500)
          .json({ error: "Supabase not configured on API (missing env vars)" });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: "Missing OPENAI_API_KEY on API" });
      }

      // Load one_pager_json to supply blocks
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

      // What we send into the agent
      const inputPayload = {
        brand: "Attract Acquisition",
        series: row.series,
        title: row.hook ?? "",
        audience: row.target_audience,
        blocks,
        mode,
        ratio,
        format,
      };

      const input_as_text = JSON.stringify(inputPayload, null, 2);

      // 1) Ask your design agent for a prompt JSON
      // IMPORTANT: use the workflow route name (design_agent), not AA_Design_Agent
      const r = await runWorkflow({
        agent: "design_agent",
        input_as_text,
      });

      const out = String(r?.output_text ?? r?.finalOutput ?? "").trim();
      const parsed = tryParseJson(out);

      if (!parsed.ok || !parsed.json) {
        return res.status(200).json({
          run_id,
          kind,
          format,
          ratio,
          design_json: null,
          image_b64: null,
          error: "Design agent returned invalid JSON.",
          debug: {
            cleaned_preview: parsed.cleaned ? parsed.cleaned.slice(0, 400) : null,
            raw_preview: out.slice(0, 400),
          },
        });
      }

      const design_json = parsed.json as any;
      const prompt = String(design_json?.prompt ?? "").trim();

      if (!prompt) {
        return res.status(200).json({
          run_id,
          kind,
          format,
          ratio,
          design_json,
          image_b64: null,
          error: "Design JSON missing `prompt`.",
        });
      }

      // 2) Generate image from prompt
      // NOTE: For GPT image models, DO NOT send response_format.
      // Use output_format instead; GPT image models always return base64.  [oai_citation:2‡OpenAI Platform](https://platform.openai.com/docs/api-reference/images?utm_source=chatgpt.com)
      const img = await openai.images.generate({
        model: "gpt-image-1.5",
        prompt,
        n: 1,
        size: sizeForRatio(ratio),
        output_format: "png",
      });

      const image_b64 = img?.data?.[0]?.b64_json ?? null;

      if (!image_b64) {
        return res.status(200).json({
          run_id,
          kind,
          format,
          ratio,
          design_json,
          image_b64: null,
          error: "Image generation returned no b64_json.",
        });
      }

      return res.status(200).json({
        run_id,
        kind,
        format,
        ratio,
        design_json,
        image_b64, // ✅ frontend can display: data:image/png;base64,${image_b64}
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
