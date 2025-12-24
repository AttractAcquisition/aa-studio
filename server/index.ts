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

app.post("/api/content-factory", async (req, res) => {
  try {
    const body = req.body as {
      action: "generate_script";
      inputs: {
        content_type: string;
        series: string;
        hook?: string;
        target_audience: string;
      };
      idempotency_key?: string;
    };

    if (body?.action !== "generate_script") {
      return res.status(400).json({ error: "Unsupported action" });
    }

    const userId = req.header("x-user-id");
    if (!userId) {
      return res.status(401).json({ error: "Missing x-user-id header" });
    }

    const { content_type, series, hook, target_audience } = body.inputs ?? {};
    if (!content_type || !series || !target_audience) {
      return res.status(400).json({
        error: "Missing required inputs",
        required: ["content_type", "series", "target_audience"],
      });
    }

    // ✅ If your DB column user_id is UUID, enforce it here to avoid Supabase errors
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return res.status(400).json({
        error: "x-user-id must be a UUID",
        example: "00000000-0000-0000-0000-000000000001",
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
