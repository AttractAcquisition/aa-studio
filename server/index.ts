import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
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
app.get("/api/content-factory", (_req, res) => res.status(405).json({ error: "Use POST" }));

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
        workflowResult?.script_text ?? workflowResult?.finalOutput ?? workflowResult?.output_text ?? "";

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

      return res.status(200).json({ run_id, script_text, brief_json: null, script_json: null });
    }

    // -------------------------------
    // ACTION 2: GENERATE ONE-PAGER
    // -------------------------------
    if (body?.action === "generate_one_pager") {
      const run_id = body.run_id as string;
      if (!run_id || !uuidRegex.test(run_id)) {
        return res.status(400).json({ error: "Missing or invalid run_id (UUID required)" });
      }

      if (!supabase) {
        return res.status(500).json({ error: "Supabase not configured on API (missing env vars)" });
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

      const one_pager_text = r?.output_text ?? r?.finalOutput ?? "";

      // 4) Parse JSON safely
      let one_pager_json: any = null;
      try {
        one_pager_json = JSON.parse(one_pager_text);
      } catch {
        await supabase
          .from("content_runs")
          .update({
            status: "FAILED",
            last_error: "One-pager agent did not return valid JSON",
            one_pager_text,
          })
          .eq("id", run_id);

        return res.status(500).json({
          error: "One-pager agent returned invalid JSON.",
          debug: { sample: String(one_pager_text).slice(0, 200) },
        });
      }

      // 5) Save
      await supabase
        .from("content_runs")
        .update({
          status: "ONE_PAGER_DONE",
          one_pager_text,
          one_pager_json,
        })
        .eq("id", run_id);

      return res.status(200).json({ run_id, one_pager_json, one_pager_text });
    }

    return res.status(400).json({
      error: "Unsupported action",
      supported: ["generate_script", "generate_one_pager"],
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
