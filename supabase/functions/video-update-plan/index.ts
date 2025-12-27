import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AA_BRAND = {
  bg: "#0B0F19",
  primary: "#6A00F4",
  secondary: "#9D4BFF",
  soft: "#EBD7FF",
};

const ALLOWED_SCENE_TYPES = [
  "hook", "ruleChips", "method", "angleCard", "proofGrid",
  "threeStep", "objectionBubbles", "offerStack", "testDashboard", "winnerLoop"
];

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validatePlanJson(planJson: any): ValidationResult {
  const errors: string[] = [];

  if (!planJson || typeof planJson !== "object") {
    return { valid: false, errors: ["Invalid plan structure"] };
  }

  // Check brand colors
  if (planJson.brand) {
    if (planJson.brand.bg !== AA_BRAND.bg) errors.push("Brand bg color must be #0B0F19");
    if (planJson.brand.primary !== AA_BRAND.primary) errors.push("Brand primary color must be #6A00F4");
    if (planJson.brand.secondary !== AA_BRAND.secondary) errors.push("Brand secondary color must be #9D4BFF");
    if (planJson.brand.soft !== AA_BRAND.soft) errors.push("Brand soft color must be #EBD7FF");
  }

  // Check scenes
  if (!Array.isArray(planJson.scenes)) {
    return { valid: false, errors: ["Scenes must be an array"] };
  }

  let totalDuration = 0;

  for (const scene of planJson.scenes) {
    if (!ALLOWED_SCENE_TYPES.includes(scene.type)) {
      errors.push(`Invalid scene type: ${scene.type}`);
      continue;
    }

    totalDuration += scene.sec || 0;

    // Check required fields per type
    switch (scene.type) {
      case "hook":
        if (!scene.headline) errors.push("hook: headline required");
        break;
      case "ruleChips":
        if (!Array.isArray(scene.chips) || scene.chips.length === 0) errors.push("ruleChips: chips required");
        break;
      case "method":
        if (!scene.headline) errors.push("method: headline required");
        break;
      case "angleCard":
        if (!scene.name) errors.push("angleCard: name required");
        break;
      case "threeStep":
        if (!Array.isArray(scene.steps) || scene.steps.length !== 3) errors.push("threeStep: 3 steps required");
        break;
      case "winnerLoop":
        if (!Array.isArray(scene.lines) || scene.lines.length < 1) errors.push("winnerLoop: lines required");
        break;
    }
  }

  // Check duration
  if (totalDuration < 55 || totalDuration > 65) {
    errors.push(`Total duration must be 55-65 seconds (current: ${totalDuration}s)`);
  }

  return { valid: errors.length === 0, errors };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { plan_id, plan_json } = await req.json();

    if (!plan_id || !plan_json) {
      return new Response(JSON.stringify({ error: "plan_id and plan_json required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate plan
    const validation = validatePlanJson(plan_json);
    if (!validation.valid) {
      return new Response(JSON.stringify({ 
        error: "Validation failed", 
        validation_errors: validation.errors 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const totalDuration = plan_json.scenes.reduce((sum: number, s: any) => sum + (s.sec || 0), 0);

    const { error } = await supabase
      .from("aa_scene_plans")
      .update({
        plan_json,
        duration_sec: totalDuration,
      })
      .eq("id", plan_id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Update error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Plan updated:", plan_id);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
