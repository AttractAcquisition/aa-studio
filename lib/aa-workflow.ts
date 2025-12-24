import { z } from "zod";
import { Agent, AgentInputItem, Runner, withTrace } from "@openai/agents";

const AaBriefAgentSchema = z.object({});
const AaScriptAgentSchema = z.object({});
const aaBriefAgent = new Agent({
  name: "AA_Brief_Agent",
  instructions: "You are a helpful assistant.",
  model: "gpt-5.2",
  outputType: AaBriefAgentSchema,
  modelSettings: {
    reasoning: {
      effort: "low",
      summary: "auto"
    },
    store: true
  }
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
    store: true
  }
});

const aaTtsAgent = new Agent({
  name: "AA_TTS_Agent",
  instructions: "",
  model: "gpt-5.2",
  modelSettings: {
    reasoning: {
      effort: "low",
      summary: "auto"
    },
    store: true
  }
});

const aaOnePagerAgent = new Agent({
  name: "AA_One_Pager_Agent",
  instructions: "",
  model: "gpt-5.2",
  modelSettings: {
    reasoning: {
      effort: "low",
      summary: "auto"
    },
    store: true
  }
});

const aaDesignAgent = new Agent({
  name: "AA_Design_Agent",
  instructions: "",
  model: "gpt-5.2",
  modelSettings: {
    reasoning: {
      effort: "low",
      summary: "auto"
    },
    store: true
  }
});

type WorkflowInput = { input_as_text: string };


// Main code entrypoint
export const runWorkflow = async (workflow: WorkflowInput) => {
  return await withTrace("AA Studio", async () => {
    const state = {

    };
    const conversationHistory: AgentInputItem[] = [
      { role: "user", content: [{ type: "input_text", text: workflow.input_as_text }] }
    ];
    const runner = new Runner({
      traceMetadata: {
        __trace_source__: "agent-builder",
        workflow_id: "wf_694af8610840819087d276f40d2bdccd09af1291b8755138"
      }
    });
    if ("agent" == "brief_agent") {
      const aaBriefAgentResultTemp = await runner.run(
        aaBriefAgent,
        [
          ...conversationHistory
        ]
      );
      conversationHistory.push(...aaBriefAgentResultTemp.newItems.map((item) => item.rawItem));

      if (!aaBriefAgentResultTemp.finalOutput) {
          throw new Error("Agent result is undefined");
      }

      const aaBriefAgentResult = {
        output_text: JSON.stringify(aaBriefAgentResultTemp.finalOutput),
        output_parsed: aaBriefAgentResultTemp.finalOutput
      };
      return aaBriefAgentResult;
    } else if ("agent" == "script_agent") {
      const aaScriptAgentResultTemp = await runner.run(
        aaScriptAgent,
        [
          ...conversationHistory
        ]
      );
      conversationHistory.push(...aaScriptAgentResultTemp.newItems.map((item) => item.rawItem));

      if (!aaScriptAgentResultTemp.finalOutput) {
          throw new Error("Agent result is undefined");
      }

      const aaScriptAgentResult = {
        output_text: JSON.stringify(aaScriptAgentResultTemp.finalOutput),
        output_parsed: aaScriptAgentResultTemp.finalOutput
      };
      return aaScriptAgentResult;
    } else if ("agent" == "tts_agent") {
      const aaTtsAgentResultTemp = await runner.run(
        aaTtsAgent,
        [
          ...conversationHistory
        ]
      );
      conversationHistory.push(...aaTtsAgentResultTemp.newItems.map((item) => item.rawItem));

      if (!aaTtsAgentResultTemp.finalOutput) {
          throw new Error("Agent result is undefined");
      }

      const aaTtsAgentResult = {
        output_text: aaTtsAgentResultTemp.finalOutput ?? ""
      };
      return aaTtsAgentResult;
    } else if ("agent" == "one_pager_agent") {
      const aaOnePagerAgentResultTemp = await runner.run(
        aaOnePagerAgent,
        [
          ...conversationHistory
        ]
      );
      conversationHistory.push(...aaOnePagerAgentResultTemp.newItems.map((item) => item.rawItem));

      if (!aaOnePagerAgentResultTemp.finalOutput) {
          throw new Error("Agent result is undefined");
      }

      const aaOnePagerAgentResult = {
        output_text: aaOnePagerAgentResultTemp.finalOutput ?? ""
      };
      return aaOnePagerAgentResult;
    } else if ("agent" == "design_agent") {
      const aaDesignAgentResultTemp = await runner.run(
        aaDesignAgent,
        [
          ...conversationHistory
        ]
      );
      conversationHistory.push(...aaDesignAgentResultTemp.newItems.map((item) => item.rawItem));

      if (!aaDesignAgentResultTemp.finalOutput) {
          throw new Error("Agent result is undefined");
      }

      const aaDesignAgentResult = {
        output_text: aaDesignAgentResultTemp.finalOutput ?? ""
      };
      return aaDesignAgentResult;
    } else {

    }
  });
}
