import { Agent, AgentInputItem, Runner, withTrace } from "@openai/agents";

/**
 * Extract the last assistant text from runner output, regardless of SDK internals.
 */
function extractLastAssistantText(runResult: any): string {
  const fo = runResult?.finalOutput;
  if (typeof fo === "string" && fo.trim()) return fo.trim();

  const items = runResult?.newItems ?? [];
  for (let i = items.length - 1; i >= 0; i--) {
    const raw = items[i]?.rawItem ?? items[i];
    if (raw?.role !== "assistant") continue;

    const content = raw?.content;

    if (typeof content === "string" && content.trim()) return content.trim();

    if (Array.isArray(content)) {
      for (let j = content.length - 1; j >= 0; j--) {
        const part = content[j];
        const t = part?.text ?? part?.value ?? part?.content;
        if (typeof t === "string" && t.trim()) return t.trim();
      }
    }
  }

  return "";
}

// -------------------------------
// JSON helpers (safe parsing)
// -------------------------------
function stripCodeFences(s: string) {
  return String(s || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function extractJsonValue(s: string) {
  const str = String(s || "").trim();
  if (!str) return "";

  const oStart = str.indexOf("{");
  const oEnd = str.lastIndexOf("}");
  if (oStart !== -1 && oEnd !== -1 && oEnd > oStart) {
    return str.slice(oStart, oEnd + 1).trim();
  }

  const aStart = str.indexOf("[");
  const aEnd = str.lastIndexOf("]");
  if (aStart !== -1 && aEnd !== -1 && aEnd > aStart) {
    return str.slice(aStart, aEnd + 1).trim();
  }

  return "";
}

function tryParseJson(raw: string) {
  const cleaned = extractJsonValue(stripCodeFences(raw));
  if (!cleaned) return { ok: false as const, cleaned: "", json: null };

  try {
    return { ok: true as const, cleaned, json: JSON.parse(cleaned) };
  } catch {
    return { ok: false as const, cleaned, json: null };
  }
}

// -------------------------------
// Image generation (server-side)
// -------------------------------
type ImageGenResult = {
  data_url: string; // data:image/png;base64,...
  mime: string;
};

function sizeForRatio(ratio?: string) {
  // NOTE: gpt-image-1 commonly supports: 1024x1024, 1024x1536, 1536x1024.
  // For 9:16 and 4:5 we use 1024x1536 (vertical) and let UI crop via object-cover/aspect boxes.
  if (ratio === "1:1") return "1024x1024";
  if (ratio === "9:16") return "1024x1536";
  if (ratio === "4:5") return "1024x1536";
  return "1024x1024";
}

async function generateImage(prompt: string, ratio?: string): Promise<ImageGenResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY on server");

  const size = sizeForRatio(ratio);

  const resp = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size,
      n: 1,
      // For widest compatibility:
      response_format: "b64_json",
    }),
  });

  const json = await resp.json().catch(() => ({} as any));

  if (!resp.ok) {
    const msg =
      json?.error?.message ||
      json?.message ||
      `Image generation failed (${resp.status})`;
    throw new Error(msg);
  }

  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error("Image API returned no b64_json");

  return {
    data_url: `data:image/png;base64,${b64}`,
    mime: "image/png",
  };
}

// ---------------- Agents ----------------

const aaBriefAgent = new Agent({
  name: "AA_Brief_Agent",
  instructions: "You are a helpful assistant.",
  model: "gpt-5.2",
  modelSettings: {
    reasoning: { effort: "low", summary: "auto" },
    store: true,
  },
});

const aaScriptAgent = new Agent({
  name: "AA_Script_Agent",
  instructions: `You are a short-form content scriptwriter for Attract Acquisition.
You use the style you were fine-tuned on: fast, punchy, confident, no fluff, written as spoken word for vertical videos (Reels, TikTok, Shorts).
You talk directly to one viewer using “you”, start with a strong hook in the first sentence or two, use short sentences and natural line breaks, and keep the script flowing as one monologue.
Output only the script text with line breaks, no headings, no labels, no bullet points.`,
  model: "ft:gpt-4.1-mini-2025-04-14:personal:script-writer-2:ClalQnCo",
  modelSettings: {
    temperature: 1,
    topP: 1,
    maxTokens: 2048,
    store: true,
  },
});

const aaTtsAgent = new Agent({
  name: "AA_TTS_Agent",
  instructions: "",
  model: "gpt-5.2",
  modelSettings: {
    reasoning: { effort: "low", summary: "auto" },
    store: true,
  },
});

const aaOnePagerAgent = new Agent({
  name: "AA_One_Pager_Agent",
  instructions: `You are the Attract Acquisition One-Pager Agent.

INPUT: You will receive metadata (content_type, series, hook, target_audience) and then a SCRIPT.

TASK: Convert the SCRIPT into a downloadable one-pager structure.

STRICT OUTPUT RULES:
- Output ONLY valid JSON. No markdown. No code fences. No commentary.
- The JSON MUST be a single object with EXACTLY this top-level shape:
{
  "title": string,
  "subtitle": string,
  "blocks": [
    { "id": number, "title": string, "content": string, "details": string }
  ]
}

CONTENT RULES:
- The one-pager must match the SCRIPT 1:1 in beats (no missing beats).
- You may add extra value ONLY inside "details" (examples, checklist, micro-steps), but do not introduce new beats.
- Return 4–6 blocks.
- Keep "content" concise (1–3 short sentences). Put extra value in "details".`,
  model: "gpt-5.2",
  modelSettings: { reasoning: { effort: "low", summary: "auto" }, store: true },
});

/**
 * DESIGN AGENT (text → image prompt JSON)
 * This MUST output strict JSON so the backend can reliably generate an image.
 */
const aaDesignAgent = new Agent({
  name: "AA_Design_Agent",
  instructions: `You are AA_Design_Agent for Attract Acquisition.

You will receive INPUT as JSON text with:
{
  "brand": "Attract Acquisition",
  "series": string,
  "title": string,
  "audience": string,
  "blocks": [{ "id": number, "title": string, "content": string, "details": string }],
  "mode": "clean" | "punchy",
  "ratio": "1:1" | "9:16" | "4:5",
  "format": "bold_text_card" | "reel_cover" | "one_pager"
}

TASK:
Create a SINGLE image-generation prompt that produces an on-brand social design.

BRAND STYLE:
- Deep ink background #0B0F19
- Primary purple #6A00F4
- Minimal, high-contrast, Klarna-ish layout
- Bold typography, clean grid, premium
- Avoid clutter. Strong focal hierarchy.
- Avoid photoreal faces unless explicitly required. Prefer mixed-media / abstract / UI-like composition.
- Include tasteful "AA" monogram element or subtle brand mark when appropriate.

STRICT OUTPUT RULES:
- Output ONLY valid JSON. No markdown. No code fences. No extra text.
- Top-level JSON shape MUST be exactly:
{
  "prompt": string,
  "ratio": "1:1" | "9:16" | "4:5",
  "format": "bold_text_card" | "reel_cover" | "one_pager"
}

PROMPT RULES:
- Your "prompt" must be self-contained and describe:
  - composition
  - colors
  - typography style (not specific fonts)
  - layout (header, main headline, subtext, accents)
  - include short text that should appear in the image (headline/kicker), but keep it minimal.
- Use the input title/series/audience/blocks to decide the headline/subhead.
- Keep visible text short (headline + small kicker).`,
  model: "gpt-5.2",
  modelSettings: {
    reasoning: { effort: "low", summary: "auto" },
    store: true,
  },
});

type WorkflowAgentRoute =
  | "brief_agent"
  | "script_agent"
  | "tts_agent"
  | "one_pager_agent"
  | "design_agent"
  // ✅ aliases (so your API can call by playground-ish names without breaking)
  | "AA_Brief_Agent"
  | "AA_Script_Agent"
  | "AA_TTS_Agent"
  | "AA_One_Pager_Agent"
  | "AA_Design_Agent";

type WorkflowInput = {
  agent: WorkflowAgentRoute;
  input_as_text: string;
};

function normalizeRoute(route: WorkflowAgentRoute) {
  switch (route) {
    case "AA_Brief_Agent":
      return "brief_agent";
    case "AA_Script_Agent":
      return "script_agent";
    case "AA_TTS_Agent":
      return "tts_agent";
    case "AA_One_Pager_Agent":
      return "one_pager_agent";
    case "AA_Design_Agent":
      return "design_agent";
    default:
      return route;
  }
}

export const runWorkflow = async (workflow: WorkflowInput) => {
  return await withTrace("AA Studio", async () => {
    const conversationHistory: AgentInputItem[] = [
      {
        role: "user",
        content: [{ type: "input_text", text: workflow.input_as_text }],
      },
    ];

    const runner = new Runner();
    const route = normalizeRoute(workflow.agent);

    if (route === "brief_agent") {
      const r = await runner.run(aaBriefAgent, conversationHistory);
      const text = extractLastAssistantText(r);
      return {
        finalOutput: r.finalOutput ?? text,
        output_text: text,
        brief_json: r.finalOutput ?? null,
      };
    }

    if (route === "script_agent") {
      const r = await runner.run(aaScriptAgent, conversationHistory);
      const script_text = extractLastAssistantText(r);
      if (!script_text) throw new Error("Script agent returned no script text");
      return { finalOutput: script_text, script_text, output_text: script_text };
    }

    if (route === "tts_agent") {
      const r = await runner.run(aaTtsAgent, conversationHistory);
      const text = extractLastAssistantText(r);
      return { finalOutput: r.finalOutput ?? text, output_text: text };
    }

    if (route === "one_pager_agent") {
      const r = await runner.run(aaOnePagerAgent, conversationHistory);
      const text = extractLastAssistantText(r);
      return { finalOutput: r.finalOutput ?? text, output_text: text };
    }

    if (route === "design_agent") {
      // 1) Ask design agent for STRICT JSON containing an image prompt
      const r = await runner.run(aaDesignAgent, conversationHistory);
      const outText = extractLastAssistantText(r);

      const parsed = tryParseJson(outText);
      if (!parsed.ok || !parsed.json?.prompt) {
        return {
          finalOutput: outText,
          output_text: outText,
          images: [],
          design_json: null,
          error: "Design agent returned invalid JSON (expected {prompt, ratio, format}).",
          debug: {
            cleaned_preview: parsed.cleaned ? parsed.cleaned.slice(0, 600) : null,
            raw_preview: outText ? outText.slice(0, 600) : null,
          },
        };
      }

      const prompt = String(parsed.json.prompt || "").trim();
      const ratio = String(parsed.json.ratio || "").trim();

      if (!prompt) {
        return {
          finalOutput: outText,
          output_text: outText,
          images: [],
          design_json: parsed.json,
          error: "Design agent JSON missing prompt text.",
        };
      }

      // 2) Generate image on the server (reliable) using gpt-image-1
      const img = await generateImage(prompt, ratio);

      return {
        finalOutput: outText,
        output_text: outText,
        design_json: parsed.json,
        images: [
          {
            data_url: img.data_url,
            url: img.data_url,
            mime: img.mime,
          },
        ],
      };
    }

    throw new Error("Unknown agent route");
  });
};
