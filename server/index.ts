import "dotenv/config";
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

// IMPORTANT: adjust this import based on your aa-workflow export
import { runWorkflow } from "../lib/aa-workflow";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// ✅ Always respond with JSON for this route (prevents Express HTML error pages)
app.all("/api/content-factory", (_req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

// ✅ Helpful for proxy sanity tests
app.get("/api/content-factory", (_req, res) => {
  return res.status(405).json({ error: "Use POST" });
});

// ✅ JSON parse error handler (instead of HTML)
app.use((err: any, _req: any, res: any, next: any) => {
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON body" });
  }
  return next(err);
});

const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

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

    // ✅ Run workflow
    const result = await runWorkflow({
      inputs: { content_type, series, hook: hook ?? "", target_audience },
    });

    // ✅ DEBUG ONCE (remove later if you want)
    console.log("WORKFLOW RESULT KEYS:", Object.keys(result || {}));
    console.log("WORKFLOW FINAL OUTPUT:", (result as any)?.finalOutput);

    // ✅ Agents SDK usually puts the final answer here
    const final = (result as any)?.finalOutput;

    // Support either a plain string OR an object output type
    const script_text =
      typeof final === "string"
        ? final
        : final?.script_text ?? final?.text ?? final?.script?.text ?? "";

    // keep these if your workflow returns structured objects too
    const brief_json =
      (typeof final === "object" ? final?.brief_json ?? final?.brief : null) ??
      (result as any)?.brief_json ??
      (result as any)?.brief ??
      null;

    const script_json =
      (typeof final === "object" ? final?.script_json ?? final?.script : null) ??
      (result as any)?.script_json ??
      (result as any)?.script ??
      null;

    if (!script_text) {
      if (supabase) {
        await supabase
          .from("content_runs")
          .update({
            status: "FAILED",
            last_error: "No script text returned (finalOutput empty / unexpected shape)",
          })
          .eq("id", run_id);
      }

      return res.status(500).json({
        error: "Workflow returned no script text. Check runWorkflow() return shape.",
        debug: {
          resultKeys: Object.keys(result || {}),
          finalOutputType: typeof final,
          finalOutputKeys: final && typeof final === "object" ? Object.keys(final) : [],
        },
      });
    }

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

app.listen(3001, () => console.log("API listening on http://localhost:3001"));
