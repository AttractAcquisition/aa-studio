export const AA_BRAND = {
  bg: "#0B0F19",
  primary: "#6A00F4",
  secondary: "#9D4BFF",
  soft: "#EBD7FF",
} as const;

export const ALLOWED_SCENE_TYPES = [
  "hook", "ruleChips", "method", "angleCard", "proofGrid",
  "threeStep", "objectionBubbles", "offerStack", "testDashboard", "winnerLoop"
] as const;

export type SceneType = typeof ALLOWED_SCENE_TYPES[number];

export interface Scene {
  type: SceneType;
  sec: number;
  headline?: string;
  highlight?: string;
  chips?: string[];
  line?: string;
  sub?: string;
  n?: number;
  name?: string;
  example?: string;
  items?: string[];
  steps?: string[];
  bubbles?: string[];
  offers?: string[];
  lines?: string[];
}

export interface PlanJson {
  style: string;
  format: { w: number; h: number; fps: number };
  brand: typeof AA_BRAND;
  meta: { title: string; target_duration_sec: number };
  scenes: Scene[];
}

export interface AAScript {
  id: string;
  user_id: string;
  title: string | null;
  script: string;
  created_at: string;
}

export interface AAScenePlan {
  id: string;
  user_id: string;
  script_id: string;
  plan_json: PlanJson;
  duration_sec: number | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface AAVideoRender {
  id: string;
  user_id: string;
  script_id: string;
  plan_id: string;
  status: "queued" | "rendering" | "done" | "failed";
  video_url: string | null;
  renderer_job_id: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export const PRESETS = [
  "Angle Testing",
  "Problem → Proof → Process → CTA",
  "Myth vs Reality",
  "3 Mistakes",
] as const;

export type PresetName = typeof PRESETS[number];
