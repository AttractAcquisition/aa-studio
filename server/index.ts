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
app.get("/health", (_req, res) => {
  return res.status(200).json({ ok: true });
});

// ✅ Prevent GET HTML errors
app.get("/api/content-factory", (_req, res) => {
  return res.status(405).json({ error: "Use POST" });
});

type Body =
  | {
      action: "generate_script";
      inputs: {
        content_type: string;
        series: string;
        hook?: string;
        target_audience: string;
      };
      idempotency_key?: string;
    }
  | {
      action: "generate_one_pager";
      run_id: string;
      idempotency_key?: string;
    };

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

app.post("/api/content-factory", async (req, res) => {
  try {
    const body = req.body as Body;

    const userId = req.header("x-user-id");
    if (!userId) {
      return res.status(401).json({ error: "Missing x-user-id header" });
    }
    if (!uuidRegex.test(userId)) {
      return res.status(400).json({
        error: "x-user-id must be a UUID",
        example: "00000000-0000-0000-0000-000000000001",
      });
    }

    // ---------------------------
    // ACTION: generate_script
    // ---------------------------
    if (body?.action === "generate_script") {
      const { content_type, series, hook, target_audience } = body.inputs ?? {};
      if (!content_type || !series || !target_audience) {
        return res.status(400).json({
          error: "Missing required inputs",
          required: ["content_type", "series", "target_audience"],
        });
      }

      // 1) Create DB row (optional but recommended)
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

      // 2) Build single text prompt for the workflow
      const input_as_text = [
        `content_type: ${content_type}`,
        `series: ${series}`,
        `hook: ${hook ?? ""}`,
        `target_audience: ${target_audience}`,
      ].join("\n");

      // 3) Run ONLY the script agent branch
      const workflowResult = await runWorkflow({
        agent: "script_agent",
        input_as_text,
      });

      // 4) Extract from YOUR workflow return shape
      const script_text =
        (workflowResult as any)?.script_text ??
        (workflowResult as any)?.finalOutput ??
        (workflowResult as any)?.output_text ??
        "";

      const brief_json = (workflowResult as any)?.brief_json ?? null;
      const script_json = (workflowResult as any)?.script_json ?? null;

      if (!script_text) {
        if (supabase) {
          await supabase
            .from("content_runs")
            .update({
              status: "FAILED",
              last_error: "No script text returned (check aa-workflow.ts return shape)",
            })
            .eq("id", run_id);
        }

        return res.status(500).json({
          error: "Workflow returned no script text.",
          debug: { workflowKeys: Object.keys(workflowResult || {}) },
        });
      }

      // 5) Save results
      if (supabase) {
        await supabase
          .from("content_runs")
          .update({
            status: "SCRIPT_DONE",
            brief_json,
            script_json,
            script_text,
          })
          .eq("id", run_id);
      }

      return res.status(200).json({ run_id, brief_json, script_json, script_text });
    }

    // ---------------------------
    // ACTION: generate_one_pager
    // ---------------------------
    if (body?.action === "generate_one_pager") {
      const { run_id } = body as any;
      if (!run_id || !uuidRegex.test(run_id)) {
        return res.status(400).json({ error: "run_id must be a UUID" });
      }
      if (!supabase) {
        return res.status(500).json({ error: "Supabase is not configured on server" });
      }

      // 1) Load existing run (and make sure it belongs to this user)
      const { data: runRow, error: fetchErr } = await supabase
        .from("content_runs")
        .select("id,user_id,content_type,series,hook,target_audience,script_text")
        .eq("id", run_id)
        .single();

      if (fetchErr) throw fetchErr;
      if (!runRow) return res.status(404).json({ error: "Run not found" });
      if (runRow.user_id !== userId) return res.status(403).json({ error: "Forbidden" });

      if (!runRow.script_text || !String(runRow.script_text).trim()) {
        return res.status(400).json({ error: "Missing script_text on run. Generate script first." });
      }

      // 2) Mark status
      await supabase
        .from("content_runs")
        .update({ status: "ONEPAGER_DRAFT" })
        .eq("id", run_id);

      // 3) Build input for one-pager agent
      const input_as_text = [
        `content_type: ${runRow.content_type}`,
        `series: ${runRow.series}`,
        `hook: ${runRow.hook ?? ""}`,
        `target_audience: ${runRow.target_audience}`,
        ``,
        `SCRIPT:`,
        String(runRow.script_text),
      ].join("\n");

      // 4) Run one-pager agent branch
      const workflowResult = await runWorkflow({
        agent: "one_pager_agent",
        input_as_text,
      });

      // IMPORTANT: for step 1+2 we’ll store whatever comes back as JSONB.
      // Later we’ll enforce strict JSON output.
      const one_pager_json =
        (workflowResult as any)?.one_pager_json ??
        (workflowResult as any)?.finalOutput ??
        (workflowResult as any)?.output_text ??
        null;

      if (!one_pager_json) {
        await supabase
          .from("content_runs")
          .update({
            status: "FAILED",
            last_error: "No one_pager_json returned (check aa-workflow.ts one_pager_agent branch)",
          })
          .eq("id", run_id);

        return res.status(500).json({
          error: "Workflow returned no one-pager output.",
          debug: { workflowKeys: Object.keys(workflowResult || {}) },
        });
      }

      // 5) Save one-pager result
      await supabase
        .from("content_runs")
        .update({
          status: "ONEPAGER_DONE",
          one_pager_json,
        })
        .eq("id", run_id);

      return res.status(200).json({ run_id, one_pager_json });
    }

    return res.status(400).json({ error: "Unsupported action" });
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
