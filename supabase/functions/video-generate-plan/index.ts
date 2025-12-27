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

function splitScriptIntoBeats(script: string, numBeats: number): string[] {
  const sentences = script.split(/(?<=[.!?])\s+/).filter(s => s.trim());
  const beats: string[] = [];
  const perBeat = Math.ceil(sentences.length / numBeats);
  
  for (let i = 0; i < numBeats; i++) {
    const start = i * perBeat;
    const chunk = sentences.slice(start, start + perBeat).join(" ");
    beats.push(chunk || "");
  }
  return beats;
}

function fillPresetWithScript(preset: Scene[], script: string): Scene[] {
  const beats = splitScriptIntoBeats(script, preset.length);
  return preset.map((scene, i) => {
    const beat = beats[i] || "";
    const filled = { ...scene };
    
    if (scene.type === "hook") {
      filled.headline = beat.slice(0, 60);
      filled.highlight = beat.split(" ").slice(0, 3).join(" ");
    } else if (scene.type === "ruleChips") {
      filled.line = beat.slice(0, 40);
    } else if (scene.type === "method") {
      filled.headline = beat.slice(0, 50);
      filled.sub = beat.slice(50, 100);
    } else if (scene.type === "angleCard") {
      filled.line = beat.slice(0, 60);
      filled.example = beat.slice(60, 120);
    } else if (scene.type === "testDashboard") {
      filled.headline = beat.slice(0, 40);
      filled.sub = beat.slice(40, 80);
    } else if (scene.type === "winnerLoop") {
      const words = beat.split(" ");
      filled.lines = [
        words.slice(0, 4).join(" "),
        words.slice(4, 8).join(" "),
        words.slice(8, 12).join(" "),
      ];
    } else if (scene.type === "threeStep") {
      const words = beat.split(" ");
      filled.steps = [
        words.slice(0, 3).join(" "),
        words.slice(3, 6).join(" "),
        words.slice(6, 9).join(" "),
      ];
    }
    return filled;
  });
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
    const filledScenes = fillPresetWithScript(presetScenes, scriptRow.script);

    const totalDuration = filledScenes.reduce((sum, s) => sum + (s.sec || 0), 0);

    const planJson: PlanJson = {
      style: "AA",
      format: { w: 1080, h: 1920, fps: 30 },
      brand: AA_BRAND,
      meta: { title: scriptRow.title || "Untitled", target_duration_sec: 60 },
      scenes: filledScenes,
    };

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

    console.log("Plan generated:", planId);
    return new Response(JSON.stringify({ plan_id: planId, plan_json: planJson }), {
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
