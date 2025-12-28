/**
 * Strict Plan Types for AA Studio Video Generator
 * Matches aa-renderer/src/types/plan.ts for consistency
 */

// AA Brand colors - locked values
export const AA_BRAND = {
  bg: "#0B0F19",
  primary: "#6A00F4",
  secondary: "#9D4BFF",
  soft: "#EBD7FF",
} as const;

// Allowed scene types
export const ALLOWED_SCENE_TYPES = [
  "hook", "ruleChips", "method", "angleCard", "proofGrid",
  "threeStep", "objectionBubbles", "offerStack", "testDashboard", "winnerLoop"
] as const;

export type SceneType = typeof ALLOWED_SCENE_TYPES[number];

// Plan format
export interface PlanFormat {
  w: number;
  h: number;
  fps: number;
}

// Plan brand (locked)
export interface PlanBrand {
  bg: string;
  primary: string;
  secondary: string;
  soft: string;
}

// Plan metadata
export interface PlanMeta {
  title: string;
  target_duration_sec: number;
}

// Base scene interface
interface BaseScene {
  type: SceneType;
  sec: number;
  showExample?: boolean; // If false, hide example even if provided
}

// Scene types
export interface HookScene extends BaseScene {
  type: "hook";
  headline: string;
  highlight?: string;
}

export interface RuleChipsScene extends BaseScene {
  type: "ruleChips";
  chips: string[];
  line?: string;
}

export interface MethodScene extends BaseScene {
  type: "method";
  headline: string;
  sub?: string;
}

export interface AngleCardScene extends BaseScene {
  type: "angleCard";
  n: number;
  name: string;
  line: string;
  example?: string;
}

export interface ProofGridScene extends BaseScene {
  type: "proofGrid";
  items?: string[];
}

export interface ThreeStepScene extends BaseScene {
  type: "threeStep";
  steps: [string, string, string];
}

export interface ObjectionBubblesScene extends BaseScene {
  type: "objectionBubbles";
  bubbles?: string[];
}

export interface OfferStackScene extends BaseScene {
  type: "offerStack";
  offers?: string[];
}

export interface TestDashboardScene extends BaseScene {
  type: "testDashboard";
  headline: string;
  sub?: string;
}

export interface WinnerLoopScene extends BaseScene {
  type: "winnerLoop";
  lines: string[];
}

// Union of all scene types
export type Scene = 
  | HookScene 
  | RuleChipsScene 
  | MethodScene 
  | AngleCardScene 
  | ProofGridScene 
  | ThreeStepScene 
  | ObjectionBubblesScene 
  | OfferStackScene 
  | TestDashboardScene 
  | WinnerLoopScene;

// Full plan structure
export interface PlanJson {
  style: string;
  format: PlanFormat;
  brand: PlanBrand;
  meta: PlanMeta;
  scenes: Scene[];
}

// Database row types
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

// Presets
export const PRESETS = [
  "Angle Testing",
  "Problem → Proof → Process → CTA",
  "Myth vs Reality",
  "3 Mistakes",
] as const;

export type PresetName = typeof PRESETS[number];

// Validation types
export interface ValidationWarning {
  path: string;
  message: string;
  sceneIndex?: number;
  field?: string;
  severity: "low" | "medium" | "high";
}

export interface ValidationResult {
  valid: boolean;
  errors: { path: string; message: string }[];
  warnings: ValidationWarning[];
}
