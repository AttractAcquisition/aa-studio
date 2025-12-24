import { z } from "zod";
import { Agent, AgentInputItem, Runner, withTrace } from "@openai/agents";

// Optional: keep brief schema loose for now
const AaBriefAgentSchema = z.any();

const aaBriefAgent = new Agent({
  name: "AA_Brief_Agent",
  instructions: "You are a helpful assistant.",
  model: "gpt-5.2",
  outputType: AaBriefAgentSchema,
});

const aaScriptAgent = new Agent({
  name: "AA_Script_Agent",
  instructions: `You are a short-form content scriptwriter for Attract Acquisition.
You use the style you were fine-tuned on: fast, punchy, confident, no fluff, written as spoken word for vertical videos (Reels, TikTok, Shorts).
You talk directly to one viewer using “you”, start with a strong hook in the first sentence or two, use short sentences and natural line breaks, and keep the script flowing as one monologue.
Output only the script text with line breaks, no headings, no labels, no bullet points.`,
  model: "ft:gpt-4.1-mini-2025-04-14:personal:script-writer-2:ClalQnCo",
  // IMPORTANT: no outputType here — return plain text
});

const aaTtsAgent = new Agent({
  name: "AA_TTS_Agent",
  instructions: "",
  model: "gpt-5.2",
});

const aaOnePagerAgent = new Agent({
  name: "AA_One_Pager_Agent",
  instructions: "",
  model: "gpt-5.2",
});

const aaDesignAgent = new Agent({
  name: "AA_Design_Agent",
  instructions: "",
  model: "gpt-5.2",
});

export type WorkflowInput = {
  agent: "brief_agent" | "script_agent" | "tts_agent" | "one_pager_agent" | "design_agent";
  input_as_text: string;
};

function extractLastAssistantText(runResult: any): string {
  const items = runResult?.newItems ?? [];
  for (let i = items.length - 1; i >= 0; i--) {
    const raw = items[i]?.rawItem;
    if (raw?.role !== "assistant") continue;

    // content can be array of blocks
    const blocks = raw?.content ?? [];
    for (const b of blocks) {
      // common shapes:
      if (typeof b?.text === "string" && b.text.trim()) return b.text.trim();
      if (typeof b?.output_text === "string" && b.output_text.trim()) return b.output_text.trim();
    }

    // fallback: sometimes assistant content is a plain string
    if (typeof raw?.content === "string" && raw.content.trim()) return raw.content.trim();
  }
  return "";
}

export const runWorkflow = async (workflow: WorkflowInput) => {
  return await withTrace("AA Studio", async () => {
    const conversationHistory: AgentInputItem[] = [
      { role: "user", content: [{ type: "input_text", text: workflow.input_as_text }] },
    ];

    const runner = new Runner({
      traceMetadata: {
        __trace_source__: "agent-builder",
        workflow_id: "wf_694af8610840819087d276f40d2bdccd09af1291b8755138",
      },
    });

    if (workflow.agent === "brief_agent") {
      const r = await runner.run(aaBriefAgent, conversationHistory);
      if (r.finalOutput == null) throw new Error("Brief agent returned no output");
      return { brief_json: r.finalOutput, output_text: JSON.stringify(r.finalOutput) };
    }

    if (workflow.agent === "script_agent") {
      const r = await runner.run(aaScriptAgent, conversationHistory);

      // try finalOutput if it exists as a string
      const final = typeof r.finalOutput === "string" ? r.finalOutput.trim() : "";
      if (final) return { script_text: final, output_text: final };

      // fallback: extract from assistant messages
      const script_text = extractLastAssistantText(r);
      if (!script_text) throw new Error("Script agent returned no script text");

      return { script_text, output_text: script_text };
    }

    if (workflow.agent === "tts_agent") {
      const r = await runner.run(aaTtsAgent, conversationHistory);
      const t = typeof r.finalOutput === "string" ? r.finalOutput : extractLastAssistantText(r);
      return { output_text: String(t ?? "") };
    }

    if (workflow.agent === "one_pager_agent") {
      const r = await runner.run(aaOnePagerAgent, conversationHistory);
      const t = typeof r.finalOutput === "string" ? r.finalOutput : extractLastAssistantText(r);
      return { output_text: String(t ?? "") };
    }

    if (workflow.agent === "design_agent") {
      const r = await runner.run(aaDesignAgent, conversationHistory);
      const t = typeof r.finalOutput === "string" ? r.finalOutput : extractLastAssistantText(r);
      return { output_text: String(t ?? "") };
    }

    throw new Error("Unknown agent route");
  });
};
