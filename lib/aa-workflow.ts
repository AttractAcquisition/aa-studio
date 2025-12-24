import { Agent, AgentInputItem, Runner, withTrace } from "@openai/agents";

/**
 * Extract the last assistant text from runner output, regardless of SDK internals.
 */
function extractLastAssistantText(runResult: any): string {
  // Prefer finalOutput if it is already a string
  const fo = runResult?.finalOutput;
  if (typeof fo === "string" && fo.trim()) return fo.trim();

  // Try to find the last assistant message in newItems
  const items = runResult?.newItems ?? [];
  for (let i = items.length - 1; i >= 0; i--) {
    const raw = items[i]?.rawItem ?? items[i];
    if (raw?.role !== "assistant") continue;

    const content = raw?.content;

    // Sometimes assistant content is a string
    if (typeof content === "string" && content.trim()) return content.trim();

    // Sometimes assistant content is array of parts
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
  // IMPORTANT: No outputType here (avoids text.format.type / schema headaches)
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
  instructions: "",
  model: "gpt-5.2",
  modelSettings: {
    reasoning: { effort: "low", summary: "auto" },
    store: true,
  },
});

const aaDesignAgent = new Agent({
  name: "AA_Design_Agent",
  instructions: "",
  model: "gpt-5.2",
  modelSettings: {
    reasoning: { effort: "low", summary: "auto" },
    store: true,
  },
});

type WorkflowInput = {
  agent: "brief_agent" | "script_agent" | "tts_agent" | "one_pager_agent" | "design_agent";
  input_as_text: string;
};

export const runWorkflow = async (workflow: WorkflowInput) => {
  return await withTrace("AA Studio", async () => {
    const conversationHistory: AgentInputItem[] = [
      {
        role: "user",
        content: [{ type: "input_text", text: workflow.input_as_text }],
      },
    ];

    // IMPORTANT: No workflow_id here (that was causing "No such project")
    const runner = new Runner();

    if (workflow.agent === "brief_agent") {
      const r = await runner.run(aaBriefAgent, conversationHistory);
      const text = extractLastAssistantText(r);
      return { finalOutput: r.finalOutput ?? text, output_text: text, brief_json: r.finalOutput ?? null };
    }

    if (workflow.agent === "script_agent") {
      const r = await runner.run(aaScriptAgent, conversationHistory);
      const script_text = extractLastAssistantText(r);
      if (!script_text) throw new Error("Script agent returned no script text");
      return { finalOutput: script_text, script_text, output_text: script_text };
    }

    if (workflow.agent === "tts_agent") {
      const r = await runner.run(aaTtsAgent, conversationHistory);
      const text = extractLastAssistantText(r);
      return { finalOutput: r.finalOutput ?? text, output_text: text };
    }

    if (workflow.agent === "one_pager_agent") {
      const r = await runner.run(aaOnePagerAgent, conversationHistory);
      const text = extractLastAssistantText(r);
      return { finalOutput: r.finalOutput ?? text, output_text: text };
    }

    if (workflow.agent === "design_agent") {
      const r = await runner.run(aaDesignAgent, conversationHistory);
      const text = extractLastAssistantText(r);
      return { finalOutput: r.finalOutput ?? text, output_text: text };
    }

    throw new Error("Unknown agent route");
  });
};
