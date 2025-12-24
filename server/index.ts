import "dotenv/config";
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import { runWorkflow } from "../lib/aa-workflow";

const app = express();

// CORS is fine open for now; later restrict to your Lovable domain
app.use(cors());

// Always parse JSON
app.use(express.json({ limit: "2mb" }));

// Always return JSON (prevents “Unexpected token <” from HTML error pages)
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json");
  next();
});

const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

app.get("/api/content-factory", (_req, res) => {
  return res.status(405).json({ error: "Use POST" });
});

app.all("/api/content-factory", (_req, res, next) => {
  res.setHeader("Content-Type", "application/json");
  next();
});

app.get("/api/content-factory", (_req, res) => {
  return res.status(405).json({ error: "Use POST" });
});

app.get("/health", (_req, res) => {
  return res.status(200).json({ ok: true });
});

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

    // Create run row (recommended)
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

    // Run workflow
    const result = await runWorkflow({
      inputs: { content_type, series, hook: hook ?? "", target_audience },
    });

    // ✅ Agents SDK commonly puts final output here
    const final = (result as any)?.finalOutput;

    const script_text =
      typeof final === "string"
        ? final
        : final?.script_text ?? final?.text ?? final?.script?.text ?? "";

    const brief_json = (result as any)?.output?.brief ?? (result as any)?.brief ?? null;
    const script_json = (result as any)?.output?.script ?? (result as any)?.script ?? final ?? null;

    if (!script_text) {
      if (supabase) {
        await supabase
          .from("content_runs")
          .update({
            status: "FAILED",
            last_error: "No script text returned (check workflow output shape)",
          })
          .eq("id", run_id);
      }

      return res.status(500).json({
        error: "Workflow returned no script text. Check aa-workflow.ts output shape.",
        debug: { keys: Object.keys(result || {}), finalType: typeof final },
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

// ✅ Railway requires binding to process.env.PORT
const PORT = Number(process.env.PORT) || 3001;

app.get("/health", (_req, res) => {
  return res.status(200).json({ ok: true });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API listening on http://0.0.0.0:${PORT}`);
});
