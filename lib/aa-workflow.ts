// lib/aa-workflow.ts
import { z } from "zod";
import { Agent, AgentInputItem, Runner, withTrace } from "@openai/agents";

// ✅ Script output is text, so schema must be string
const AaScriptAgentSchema = z.string();

// (Optional) brief as any for now (you can tighten later)
const AaBriefAgentSchema = z.any();

const aaBriefAgent = new Agent({
  name: "AA_Brief_Agent",
  instructions: "You are a helpful assistant.",
  model: "gpt-5.2",
  outputType: AaBriefAgentSchema,
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
  outputType: AaScriptAgentSchema,
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
  modelSettings: { reasoning: { effort: "low", summary: "auto" }, store: true },
});

const aaOnePagerAgent = new Agent({
  name: "AA_One_Pager_Agent",
  instructions: "",
  model: "gpt-5.2",
  modelSettings: { reasoning: { effort: "low", summary: "auto" }, store: true },
});

const aaDesignAgent = new Agent({
  name: "AA_Design_Agent",
  instructions: "",
  model: "gpt-5.2",
  modelSettings: { reasoning: { effort: "low", summary: "auto" }, store: true },
});

// ✅ You MUST pass which branch to run
export type WorkflowInput = {
  agent:
    | "brief_agent"
    | "script_agent"
    | "tts_agent"
    | "one_pager_agent"
    | "design_agent";
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

      // ✅ With outputType z.string(), this should be the script text
      const script_text = typeof r.finalOutput === "string" ? r.finalOutput : "";

      if (!script_text) {
        // fallback: try to grab last assistant text if schema parsing ever fails
        const last = r.newItems
          ?.slice()
          .reverse()
          .find((i) => (i as any)?.rawItem?.role === "assistant");

        const content = (last as any)?.rawItem?.content;

        // content can be string or array depending on SDK internals
        const maybeText =
          typeof content === "string"
            ? content
            : Array.isArray(content)
              ? content
                  .map((c: any) => c?.text ?? "")
                  .filter(Boolean)
                  .join("\n")
              : "";

        if (!maybeText) throw new Error("Script agent returned no script text");
        return { script_text: maybeText, output_text: maybeText };
      }

      return { script_text, output_text: script_text };
    }

    if (workflow.agent === "tts_agent") {
      const r = await runner.run(aaTtsAgent, conversationHistory);
      return { output_text: String(r.finalOutput ?? "") };
    }

    if (workflow.agent === "one_pager_agent") {
      const r = await runner.run(aaOnePagerAgent, conversationHistory);
      return { output_text: String(r.finalOutput ?? "") };
    }

    if (workflow.agent === "design_agent") {
      const r = await runner.run(aaDesignAgent, conversationHistory);
      return { output_text: String(r.finalOutput ?? "") };
    }

    throw new Error("Unknown agent route");
  });
};
