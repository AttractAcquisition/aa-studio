import "dotenv/config";
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

// IMPORTANT: adjust this import based on your aa-workflow export
import { runWorkflow } from "../lib/aa-workflow";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

app.post("/api/content-factory", async (req, res) => {
  try {
    const body = req.body as {
      action: "generate_script";
      inputs: { content_type: string; series: string; hook?: string; target_audience: string };
      idempotency_key?: string;
    };

    if (body.action !== "generate_script") {
      return res.status(400).json({ error: "Unsupported action" });
    }

    const userId = req.header("x-user-id");
    if (!userId) return res.status(401).json({ error: "Missing x-user-id header" });

    const { content_type, series, hook, target_audience } = body.inputs;

    // (optional) create DB row
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

    // run workflow
    const workflowResult = await runWorkflow({
      inputs: { content_type, series, hook: hook ?? "", target_audience },
    });

    const script_text =
      workflowResult?.script_text ??
      workflowResult?.script?.text ??
      workflowResult?.output?.script?.text ??
      "";

    const brief_json =
      workflowResult?.brief_json ??
      workflowResult?.brief ??
      workflowResult?.output?.brief ??
      null;

    const script_json =
      workflowResult?.script_json ??
      workflowResult?.script ??
      workflowResult?.output?.script ??
      null;

    if (!script_text) {
      if (supabase) {
        await supabase
          .from("content_runs")
          .update({ status: "FAILED", last_error: "No script text returned" })
          .eq("id", run_id);
      }
      return res.status(500).json({
        error: "Workflow returned no script text. Check aa-workflow.ts output shape.",
        debug: { keys: Object.keys(workflowResult || {}) },
      });
    }

    if (supabase) {
      await supabase
        .from("content_runs")
        .update({ status: "SCRIPT_DONE", brief_json, script_json, script_text })
        .eq("id", run_id);
    }

    return res.json({ run_id, brief_json, script_json, script_text });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e?.message ?? "Unknown error" });
  }
});

app.listen(3001, () => console.log("API listening on http://localhost:3001"));
