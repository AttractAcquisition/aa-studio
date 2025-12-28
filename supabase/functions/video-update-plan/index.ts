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

// Placeholder patterns to reject
const PLACEHOLDER_PATTERNS = [
  /^EXAMPLE$/i,
  /^\.\.\.$/,
  /^''$/,
  /^""$/,
  /^\s*$/,
  /^placeholder$/i,
  /^TODO$/i,
  /^TBD$/i,
  /^\[.*\]$/,
];

function isPlaceholder(value: string | undefined | null): boolean {
  if (!value || typeof value !== 'string') return true;
  const trimmed = value.trim();
  if (trimmed === '') return true;
  return PLACEHOLDER_PATTERNS.some(pattern => pattern.test(trimmed));
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validatePlanJson(planJson: any): ValidationResult {
  const errors: string[] = [];

  if (!planJson || typeof planJson !== "object") {
    return { valid: false, errors: ["Invalid plan structure"] };
  }

  // Check brand colors - must match AA exactly
  if (planJson.brand) {
    if (planJson.brand.bg !== AA_BRAND.bg) errors.push("Brand bg color must be #0B0F19");
    if (planJson.brand.primary !== AA_BRAND.primary) errors.push("Brand primary color must be #6A00F4");
    if (planJson.brand.secondary !== AA_BRAND.secondary) errors.push("Brand secondary color must be #9D4BFF");
    if (planJson.brand.soft !== AA_BRAND.soft) errors.push("Brand soft color must be #EBD7FF");
  } else {
    errors.push("Missing brand colors");
  }

  // Ensure format defaults
  if (!planJson.format) {
    planJson.format = { w: 1080, h: 1920, fps: 30 };
  } else {
    if (!planJson.format.w) planJson.format.w = 1080;
    if (!planJson.format.h) planJson.format.h = 1920;
    if (!planJson.format.fps) planJson.format.fps = 30;
  }

  // Check scenes
  if (!Array.isArray(planJson.scenes)) {
    return { valid: false, errors: ["Scenes must be an array"] };
  }

  let totalDuration = 0;

  for (let i = 0; i < planJson.scenes.length; i++) {
    const scene = planJson.scenes[i];
    const sceneNum = i + 1;
    
    if (!ALLOWED_SCENE_TYPES.includes(scene.type)) {
      errors.push(`Scene ${sceneNum}: invalid type "${scene.type}"`);
      continue;
    }

    // Validate sec range (1-12)
    if (typeof scene.sec !== 'number' || scene.sec < 1 || scene.sec > 12) {
      errors.push(`Scene ${sceneNum}: duration must be 1-12 seconds`);
    }
    
    totalDuration += scene.sec || 0;

    // Check required fields per type (reject placeholders)
    switch (scene.type) {
      case "hook":
        if (isPlaceholder(scene.headline)) {
          errors.push(`Scene ${sceneNum} (hook): headline is required and cannot be empty/placeholder`);
        }
        break;
        
      case "ruleChips":
        if (!Array.isArray(scene.chips) || scene.chips.length === 0) {
          errors.push(`Scene ${sceneNum} (ruleChips): at least one chip required`);
        }
        break;
        
      case "method":
        if (isPlaceholder(scene.headline)) {
          errors.push(`Scene ${sceneNum} (method): headline is required and cannot be empty/placeholder`);
        }
        break;
        
      case "angleCard":
        if (isPlaceholder(scene.name)) {
          errors.push(`Scene ${sceneNum} (angleCard): name is required and cannot be empty/placeholder`);
        }
        if (isPlaceholder(scene.line)) {
          errors.push(`Scene ${sceneNum} (angleCard): line is required and cannot be empty/placeholder`);
        }
        // Example is optional - if empty/placeholder, ensure showExample is false
        if (isPlaceholder(scene.example) && scene.showExample !== false) {
          // Auto-fix: set showExample to false
          scene.showExample = false;
        }
        break;
        
      case "threeStep":
        if (!Array.isArray(scene.steps) || scene.steps.length !== 3) {
          errors.push(`Scene ${sceneNum} (threeStep): exactly 3 steps required`);
        } else if (scene.steps.some((s: string) => isPlaceholder(s))) {
          errors.push(`Scene ${sceneNum} (threeStep): steps cannot be empty/placeholder`);
        }
        break;
        
      case "winnerLoop":
        if (!Array.isArray(scene.lines) || scene.lines.length < 1) {
          errors.push(`Scene ${sceneNum} (winnerLoop): at least one line required`);
        } else if (scene.lines.every((l: string) => isPlaceholder(l))) {
          errors.push(`Scene ${sceneNum} (winnerLoop): lines cannot all be empty/placeholder`);
        }
        break;
        
      case "testDashboard":
        if (isPlaceholder(scene.headline)) {
          errors.push(`Scene ${sceneNum} (testDashboard): headline is required and cannot be empty/placeholder`);
        }
        break;
    }
  }

  // Check duration
  if (totalDuration < 55) {
    errors.push(`Total duration too short: ${totalDuration}s (minimum 55s)`);
  }
  if (totalDuration > 65) {
    errors.push(`Total duration too long: ${totalDuration}s (maximum 65s)`);
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

    // Validate plan strictly
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

    console.log("Plan updated:", plan_id, "duration:", totalDuration + "s");
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
