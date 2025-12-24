import "dotenv/config";
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import { runWorkflow } from "../lib/aa-workflow";

const app = express();

// ✅ CORS: allow Lovable + local dev
app.use(
  cors({
    origin: [
      "http://localhost:8080",
      // add your Lovable deployed domain here:
      // "https://your-app.lovable.app"
    ],
  })
);

app.use(express.json({ limit: "2mb" }));

const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

// ✅ Always return JSON for this route (prevents HTML -> JSON parse errors)
app.all("/api/content-factory", (_req, res, next) => {
  res.setHeader("Content-Type", "application/json");
  next();
});

app.get("/api/content-factory", (_req, res) => {
  return res.status(405).json({ error: "Use POST" });
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

    // 1) Create run row
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

    // 2) Run workflow
    const result = await runWorkflow({
      inputs: { content_type, series, hook: hook ?? "", target_audience },
    });

    // ✅ Agents SDK commonly returns final output here:
    const final = (result as any)?.finalOutput;

    const script_text =
      typeof final === "string"
        ? final
        : final?.script_text ?? final?.text ?? final?.script?.text ?? "";

    const brief_json = (result as any)?.brief_json ?? (result as any)?.brief ?? null;
    const script_json = (result as any)?.script_json ?? (result as any)?.script ?? final ?? null;

    if (!script_text) {
      if (supabase) {
        await supabase
          .from("content_runs")
          .update({
            status: "FAILED",
            last_error: "Workflow returned no script text (check finalOutput shape).",
          })
          .eq("id", run_id);
      }

      return res.status(500).json({
        error: "Workflow returned no script text.",
        debug: { keys: Object.keys(result || {}), hasFinalOutput: Boolean((result as any)?.finalOutput) },
      });
    }

    // 3) Save outputs
    if (supabase) {
      await supabase
        .from("content_runs")
        .update({ status: "SCRIPT_DONE", brief_json, script_json, script_text })
        .eq("id", run_id);
    }

    return res.status(200).json({ run_id, brief_json, script_json, script_text });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e?.message ?? "Unknown error" });
  }
});

// ✅ Use host-provided port in production
const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
