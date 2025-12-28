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

interface Scene {
  type: string;
  sec: number;
  showExample?: boolean;
  [key: string]: unknown;
}

interface PlanJson {
  style: string;
  format: { w: number; h: number; fps: number };
  brand: typeof AA_BRAND;
  meta: { title: string; target_duration_sec: number };
  scenes: Scene[];
}

const PRESETS: Record<string, Scene[]> = {
  "Angle Testing": [
    { type: "hook", headline: "", highlight: "", sec: 4 },
    { type: "ruleChips", chips: ["OFFER", "CTA"], line: "", sec: 5 },
    { type: "method", headline: "", sub: "", sec: 3 },
    { type: "angleCard", n: 1, name: "Problem", line: "", example: "", sec: 6 },
    { type: "angleCard", n: 2, name: "Proof", line: "", example: "", sec: 6 },
    { type: "angleCard", n: 3, name: "How it works", line: "", example: "", sec: 6 },
    { type: "angleCard", n: 4, name: "Objection", line: "", example: "", sec: 6 },
    { type: "angleCard", n: 5, name: "Offer", line: "", example: "", sec: 6 },
    { type: "testDashboard", headline: "", sub: "", sec: 9 },
    { type: "winnerLoop", lines: ["", "", ""], sec: 7 },
  ],
  "Problem → Proof → Process → CTA": [
    { type: "hook", headline: "", highlight: "", sec: 5 },
    { type: "angleCard", n: 1, name: "Problem", line: "", example: "", sec: 8 },
    { type: "proofGrid", items: [], sec: 10 },
    { type: "threeStep", steps: ["", "", ""], sec: 12 },
    { type: "angleCard", n: 2, name: "Proof", line: "", example: "", sec: 8 },
    { type: "offerStack", offers: [], sec: 10 },
    { type: "winnerLoop", lines: ["", "", ""], sec: 7 },
  ],
  "Myth vs Reality": [
    { type: "hook", headline: "", highlight: "", sec: 4 },
    { type: "objectionBubbles", bubbles: [], sec: 12 },
    { type: "method", headline: "", sub: "", sec: 8 },
    { type: "proofGrid", items: [], sec: 10 },
    { type: "angleCard", n: 1, name: "Reality", line: "", example: "", sec: 10 },
    { type: "offerStack", offers: [], sec: 10 },
    { type: "winnerLoop", lines: ["", "", ""], sec: 6 },
  ],
  "3 Mistakes": [
    { type: "hook", headline: "", highlight: "", sec: 4 },
    { type: "angleCard", n: 1, name: "Mistake 1", line: "", example: "", sec: 10 },
    { type: "angleCard", n: 2, name: "Mistake 2", line: "", example: "", sec: 10 },
    { type: "angleCard", n: 3, name: "Mistake 3", line: "", example: "", sec: 10 },
    { type: "method", headline: "", sub: "", sec: 8 },
    { type: "threeStep", steps: ["", "", ""], sec: 10 },
    { type: "winnerLoop", lines: ["", "", ""], sec: 8 },
  ],
};

/**
 * Split script into sentences properly (avoid mid-word cuts)
 */
function splitIntoSentences(script: string): string[] {
  // Split on sentence boundaries
  return script
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Split script into beats by word boundaries (never mid-word)
 */
function splitScriptIntoBeats(script: string, numBeats: number): string[] {
  const sentences = splitIntoSentences(script);
  const beats: string[] = [];
  const perBeat = Math.max(1, Math.ceil(sentences.length / numBeats));
  
  for (let i = 0; i < numBeats; i++) {
    const start = i * perBeat;
    const chunk = sentences.slice(start, start + perBeat).join(" ");
    beats.push(chunk.trim() || "");
  }
  return beats;
}

/**
 * Truncate text to max length at word boundary (never mid-word)
 */
function truncateAtWordBoundary(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  
  // Find last space before maxLength
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  
  if (lastSpace > maxLength * 0.5) {
    return truncated.slice(0, lastSpace).trim();
  }
  
  // If no good break point, just use the truncated version
  return truncated.trim();
}

/**
 * Extract key words for highlight (complete words only)
 */
function extractHighlight(text: string, wordCount: number = 3): string {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  return words.slice(0, wordCount).join(" ");
}

/**
 * Generate a fallback example when none is provided
 */
function generateFallbackExample(name: string, line: string): string {
  if (!line || line.length < 10) return "";
  
  // Create a short illustrative example based on the context
  const words = line.split(/\s+/).slice(0, 8);
  if (words.length >= 4) {
    return `e.g., ${words.slice(0, 4).join(" ")}...`;
  }
  return "";
}

/**
 * Fill preset with script content (proper word boundaries)
 */
function fillPresetWithScript(preset: Scene[], script: string, title: string): Scene[] {
  const beats = splitScriptIntoBeats(script, preset.length);
  
  return preset.map((scene, i) => {
    const beat = beats[i] || "";
    const filled: Scene = { ...scene };
    
    switch (scene.type) {
      case "hook":
        filled.headline = truncateAtWordBoundary(beat, 60) || title || "Your hook here";
        filled.highlight = extractHighlight(beat, 3);
        break;
        
      case "ruleChips":
        filled.line = truncateAtWordBoundary(beat, 40);
        if (!filled.chips || (filled.chips as string[]).length === 0) {
          filled.chips = ["OFFER", "CTA"];
        }
        break;
        
      case "method":
        filled.headline = truncateAtWordBoundary(beat, 50) || "Our Method";
        filled.sub = truncateAtWordBoundary(beat.slice(50), 50);
        break;
        
      case "angleCard": {
        const name = filled.name as string || `Card ${filled.n || i + 1}`;
        filled.line = truncateAtWordBoundary(beat, 60) || `Key point about ${name}`;
        
        // Generate example or set showExample to false
        const example = truncateAtWordBoundary(beat.slice(60), 60);
        if (example && example.length > 10) {
          filled.example = example;
          filled.showExample = true;
        } else {
          // Try to generate a fallback example
          const fallback = generateFallbackExample(name, filled.line as string);
          if (fallback) {
            filled.example = fallback;
            filled.showExample = true;
          } else {
            filled.example = "";
            filled.showExample = false;
          }
        }
        break;
      }
        
      case "testDashboard":
        filled.headline = truncateAtWordBoundary(beat, 40) || "Testing Results";
        filled.sub = truncateAtWordBoundary(beat.slice(40), 40);
        break;
        
      case "winnerLoop": {
        const words = beat.split(/\s+/).filter(w => w.length > 0);
        const lines = [
          words.slice(0, 4).join(" ") || "Take action now",
          words.slice(4, 8).join(" ") || "Get results",
          words.slice(8, 12).join(" ") || "Transform today",
        ].map(l => l.trim()).filter(l => l.length > 0);
        filled.lines = lines.length >= 1 ? lines : ["Take action now", "Get results", "Transform today"];
        break;
      }
        
      case "threeStep": {
        const words = beat.split(/\s+/).filter(w => w.length > 0);
        filled.steps = [
          words.slice(0, 3).join(" ") || "Step one",
          words.slice(3, 6).join(" ") || "Step two",
          words.slice(6, 9).join(" ") || "Step three",
        ];
        break;
      }
        
      case "proofGrid":
        if (!filled.items || (filled.items as string[]).length === 0) {
          filled.items = ["Proof 1", "Proof 2", "Proof 3"];
        }
        break;
        
      case "objectionBubbles":
        if (!filled.bubbles || (filled.bubbles as string[]).length === 0) {
          filled.bubbles = ["Common objection 1", "Common objection 2"];
        }
        break;
        
      case "offerStack":
        if (!filled.offers || (filled.offers as string[]).length === 0) {
          filled.offers = ["Main offer", "Bonus 1", "Bonus 2"];
        }
        break;
    }
    
    return filled;
  });
}

/**
 * Validate plan before saving
 */
function validatePlan(planJson: PlanJson): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check brand colors
  if (planJson.brand.bg !== AA_BRAND.bg) errors.push("Brand bg must be #0B0F19");
  if (planJson.brand.primary !== AA_BRAND.primary) errors.push("Brand primary must be #6A00F4");
  if (planJson.brand.secondary !== AA_BRAND.secondary) errors.push("Brand secondary must be #9D4BFF");
  if (planJson.brand.soft !== AA_BRAND.soft) errors.push("Brand soft must be #EBD7FF");
  
  // Check scenes
  let totalDuration = 0;
  planJson.scenes.forEach((scene, i) => {
    if (!ALLOWED_SCENE_TYPES.includes(scene.type)) {
      errors.push(`Scene ${i + 1}: invalid type "${scene.type}"`);
    }
    
    if (typeof scene.sec !== 'number' || scene.sec < 1 || scene.sec > 12) {
      errors.push(`Scene ${i + 1}: sec must be 1-12`);
    }
    
    totalDuration += scene.sec || 0;
    
    // Check required non-empty fields (no placeholders)
    if (scene.type === "hook" && !scene.headline) {
      errors.push(`Scene ${i + 1} (hook): headline required`);
    }
    if (scene.type === "method" && !scene.headline) {
      errors.push(`Scene ${i + 1} (method): headline required`);
    }
    if (scene.type === "angleCard") {
      if (!scene.name) errors.push(`Scene ${i + 1} (angleCard): name required`);
      if (!scene.line) errors.push(`Scene ${i + 1} (angleCard): line required`);
    }
    if (scene.type === "testDashboard" && !scene.headline) {
      errors.push(`Scene ${i + 1} (testDashboard): headline required`);
    }
    if (scene.type === "winnerLoop") {
      const lines = scene.lines as string[] | undefined;
      if (!lines || lines.length === 0 || lines.every(l => !l || l.trim() === "")) {
        errors.push(`Scene ${i + 1} (winnerLoop): at least one line required`);
      }
    }
    if (scene.type === "threeStep") {
      const steps = scene.steps as string[] | undefined;
      if (!steps || steps.length !== 3) {
        errors.push(`Scene ${i + 1} (threeStep): exactly 3 steps required`);
      }
    }
  });
  
  if (totalDuration < 55) errors.push(`Duration too short: ${totalDuration}s (min 55s)`);
  if (totalDuration > 65) errors.push(`Duration too long: ${totalDuration}s (max 65s)`);
  
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

    const { script_id, preset } = await req.json();

    if (!script_id) {
      return new Response(JSON.stringify({ error: "script_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load script
    const { data: scriptRow, error: scriptError } = await supabase
      .from("aa_scripts")
      .select("*")
      .eq("id", script_id)
      .single();

    if (scriptError || !scriptRow) {
      return new Response(JSON.stringify({ error: "Script not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const presetName = preset || "Angle Testing";
    const presetScenes = PRESETS[presetName] || PRESETS["Angle Testing"];
    const title = scriptRow.title || "Untitled";
    const filledScenes = fillPresetWithScript(presetScenes, scriptRow.script, title);

    const totalDuration = filledScenes.reduce((sum, s) => sum + (s.sec || 0), 0);

    const planJson: PlanJson = {
      style: "AA",
      format: { w: 1080, h: 1920, fps: 30 },
      brand: AA_BRAND,
      meta: { title, target_duration_sec: 60 },
      scenes: filledScenes,
    };

    // Validate before saving
    const validation = validatePlan(planJson);
    if (!validation.valid) {
      console.warn("Plan validation warnings:", validation.errors);
      // Don't block, but log warnings - these are soft errors
    }

    // Check for existing plan and upsert
    const { data: existingPlan } = await supabase
      .from("aa_scene_plans")
      .select("id")
      .eq("script_id", script_id)
      .eq("user_id", user.id)
      .maybeSingle();

    let planId: string;

    if (existingPlan) {
      const { error: updateError } = await supabase
        .from("aa_scene_plans")
        .update({
          plan_json: planJson,
          duration_sec: totalDuration,
          is_approved: false,
        })
        .eq("id", existingPlan.id);

      if (updateError) {
        console.error("Update error:", updateError);
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      planId = existingPlan.id;
    } else {
      const { data: newPlan, error: insertError } = await supabase
        .from("aa_scene_plans")
        .insert({
          user_id: user.id,
          script_id,
          plan_json: planJson,
          duration_sec: totalDuration,
          is_approved: false,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        return new Response(JSON.stringify({ error: insertError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      planId = newPlan.id;
    }

    console.log("Plan generated:", planId, "duration:", totalDuration + "s");
    return new Response(JSON.stringify({ 
      plan_id: planId, 
      plan_json: planJson,
      validation_warnings: validation.errors.length > 0 ? validation.errors : undefined,
    }), {
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
