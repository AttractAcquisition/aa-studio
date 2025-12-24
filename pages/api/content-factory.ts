import type { NextApiRequest, NextApiResponse } from "next";

// This should be your exported workflow runner from lib/aa-workflow.ts
// The exact import name depends on what the Agent SDK export generated.
import { runWorkflow } from "@/lib/aa-workflow";

// (Optional) If you want to save the run + outputs in Supabase:
import { createClient } from "@supabase/supabase-js";

const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

type Body = {
  action: "generate_script";
  inputs: {
    content_type: string;
    series: string;
    hook?: string;
    target_audience: string;
  };
  idempotency_key?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const body = req.body as Body;

    if (body.action !== "generate_script") {
      return res.status(400).json({ error: "Unsupported action" });
    }

    // ✅ temp auth method (matches your UI)
    const userId = req.headers["x-user-id"];
    if (!userId || typeof userId !== "string") {
      return res.status(401).json({ error: "Missing x-user-id header" });
    }

    const { content_type, series, hook, target_audience } = body.inputs;

    // 1) Create the run row (optional but recommended)
    let run_id: string | null = null;

    if (supabase) {
      const { data: runRow, error: insertErr } = await supabase
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

      if (insertErr) throw insertErr;
      run_id = runRow.id;
    } else {
      // if you haven't set Supabase env vars yet
      run_id = crypto.randomUUID();
    }

    // 2) Run the Agent workflow (Brief -> Script)
    // IMPORTANT: You must align the payload shape to what your aa-workflow expects.
    const workflowResult = await runWorkflow({
      inputs: {
        content_type,
        series,
        hook: hook ?? "",
        target_audience,
      },
    });

    // Try to extract the script text from common shapes
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
      // store error so you can debug quickly
      if (supabase && run_id) {
        await supabase
          .from("content_runs")
          .update({
            status: "FAILED",
            last_error: "Workflow returned no script text.",
          })
          .eq("id", run_id);
      }

      return res.status(500).json({
        error:
          "Workflow returned no script text. Check aa-workflow.ts output shape.",
        debug: { workflowKeys: Object.keys(workflowResult || {}) },
      });
    }

    // 3) Save outputs back to Supabase
    if (supabase && run_id) {
      await supabase
        .from("content_runs")
        .update({
          brief_json,
          script_json,
          script_text,
          status: "SCRIPT_DONE",
        })
        .eq("id", run_id);
    }

    // 4) Return to UI
    return res.status(200).json({
      run_id,
      brief_json,
      script_json,
      script_text,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err?.message ?? "Unknown error" });
  }
}
