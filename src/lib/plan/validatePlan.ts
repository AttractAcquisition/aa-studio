/**
 * Strict Plan Validator for AA Studio Video Generator
 * Ensures plan_json is complete and valid BEFORE saving or triggering renders
 */

import { z } from "zod";

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

// Placeholder values that should be rejected
const PLACEHOLDER_PATTERNS = [
  /^EXAMPLE$/i,
  /^\.\.\.$/,
  /^''$/,
  /^""$/,
  /^\s*$/,
  /^placeholder$/i,
  /^TODO$/i,
  /^TBD$/i,
  /^\[.*\]$/,  // [text in brackets]
];

function isPlaceholder(value: string | undefined | null): boolean {
  if (!value || typeof value !== 'string') return true;
  const trimmed = value.trim();
  if (trimmed === '') return true;
  return PLACEHOLDER_PATTERNS.some(pattern => pattern.test(trimmed));
}

function isValidString(value: string | undefined | null): boolean {
  return !!value && typeof value === 'string' && value.trim().length > 0 && !isPlaceholder(value);
}

// Zod schemas for strict validation
const PlanFormatSchema = z.object({
  w: z.number().default(1080),
  h: z.number().default(1920),
  fps: z.number().default(30),
});

const PlanBrandSchema = z.object({
  bg: z.literal(AA_BRAND.bg),
  primary: z.literal(AA_BRAND.primary),
  secondary: z.literal(AA_BRAND.secondary),
  soft: z.literal(AA_BRAND.soft),
});

const PlanMetaSchema = z.object({
  title: z.string().min(1),
  target_duration_sec: z.number().min(30).max(120).default(60),
});

// Base scene schema
const BaseSceneSchema = z.object({
  sec: z.number().min(1).max(12),
  showExample: z.boolean().optional(),
});

// Scene-specific schemas
const HookSceneSchema = BaseSceneSchema.extend({
  type: z.literal("hook"),
  headline: z.string().min(1).refine(val => !isPlaceholder(val), "Headline cannot be a placeholder"),
  highlight: z.string().optional(),
});

const RuleChipsSceneSchema = BaseSceneSchema.extend({
  type: z.literal("ruleChips"),
  chips: z.array(z.string().min(1)).min(1),
  line: z.string().optional(),
});

const MethodSceneSchema = BaseSceneSchema.extend({
  type: z.literal("method"),
  headline: z.string().min(1).refine(val => !isPlaceholder(val), "Headline cannot be a placeholder"),
  sub: z.string().optional(),
});

const AngleCardSceneSchema = BaseSceneSchema.extend({
  type: z.literal("angleCard"),
  n: z.number().min(1),
  name: z.string().min(1).refine(val => !isPlaceholder(val), "Name cannot be a placeholder"),
  line: z.string().min(1).refine(val => !isPlaceholder(val), "Line cannot be a placeholder"),
  example: z.string().optional(),
});

const ProofGridSceneSchema = BaseSceneSchema.extend({
  type: z.literal("proofGrid"),
  items: z.array(z.string()).optional(),
});

const ThreeStepSceneSchema = BaseSceneSchema.extend({
  type: z.literal("threeStep"),
  steps: z.array(z.string().min(1)).length(3),
});

const ObjectionBubblesSceneSchema = BaseSceneSchema.extend({
  type: z.literal("objectionBubbles"),
  bubbles: z.array(z.string()).optional(),
});

const OfferStackSceneSchema = BaseSceneSchema.extend({
  type: z.literal("offerStack"),
  offers: z.array(z.string()).optional(),
});

const TestDashboardSceneSchema = BaseSceneSchema.extend({
  type: z.literal("testDashboard"),
  headline: z.string().min(1).refine(val => !isPlaceholder(val), "Headline cannot be a placeholder"),
  sub: z.string().optional(),
});

const WinnerLoopSceneSchema = BaseSceneSchema.extend({
  type: z.literal("winnerLoop"),
  lines: z.array(z.string().min(1)).min(1).max(5),
});

const SceneSchema = z.discriminatedUnion("type", [
  HookSceneSchema,
  RuleChipsSceneSchema,
  MethodSceneSchema,
  AngleCardSceneSchema,
  ProofGridSceneSchema,
  ThreeStepSceneSchema,
  ObjectionBubblesSceneSchema,
  OfferStackSceneSchema,
  TestDashboardSceneSchema,
  WinnerLoopSceneSchema,
]);

export const PlanJsonSchema = z.object({
  style: z.string().default("AA"),
  format: PlanFormatSchema,
  brand: PlanBrandSchema,
  meta: PlanMetaSchema,
  scenes: z.array(SceneSchema).min(1),
});

export type PlanJson = z.infer<typeof PlanJsonSchema>;
export type Scene = z.infer<typeof SceneSchema>;

export interface ValidationError {
  path: string;
  message: string;
  sceneIndex?: number;
  field?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationWarning {
  path: string;
  message: string;
  sceneIndex?: number;
  field?: string;
  severity: "low" | "medium" | "high";
}

/**
 * Get warnings for a plan (non-blocking issues)
 */
export function getPlanWarnings(plan: unknown): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  
  if (!plan || typeof plan !== 'object') {
    return [{ path: "root", message: "Invalid plan structure", severity: "high" }];
  }
  
  const p = plan as any;
  
  // Check format defaults
  if (!p.format) {
    warnings.push({ path: "format", message: "Missing format, will use defaults", severity: "low" });
  } else {
    if (p.format.w !== 1080) warnings.push({ path: "format.w", message: "Non-standard width (expected 1080)", severity: "medium" });
    if (p.format.h !== 1920) warnings.push({ path: "format.h", message: "Non-standard height (expected 1920)", severity: "medium" });
    if (p.format.fps !== 30) warnings.push({ path: "format.fps", message: "Non-standard FPS (expected 30)", severity: "low" });
  }
  
  // Check total duration
  if (Array.isArray(p.scenes)) {
    const totalDuration = p.scenes.reduce((sum: number, s: any) => sum + (s.sec || 0), 0);
    if (totalDuration < 55) {
      warnings.push({ path: "scenes", message: `Duration too short: ${totalDuration}s (min 55s)`, severity: "high" });
    } else if (totalDuration > 65) {
      warnings.push({ path: "scenes", message: `Duration too long: ${totalDuration}s (max 65s)`, severity: "high" });
    }
    
    // Check each scene
    p.scenes.forEach((scene: any, i: number) => {
      if (!ALLOWED_SCENE_TYPES.includes(scene.type)) {
        warnings.push({ 
          path: `scenes[${i}].type`, 
          message: `Invalid scene type: ${scene.type}`, 
          sceneIndex: i, 
          severity: "high" 
        });
      }
      
      // Check for placeholder values
      if (scene.type === "hook" && isPlaceholder(scene.headline)) {
        warnings.push({ 
          path: `scenes[${i}].headline`, 
          message: "Hook headline is empty or placeholder", 
          sceneIndex: i, 
          field: "headline",
          severity: "high" 
        });
      }
      
      if (scene.type === "angleCard") {
        if (isPlaceholder(scene.name)) {
          warnings.push({ 
            path: `scenes[${i}].name`, 
            message: "AngleCard name is empty or placeholder", 
            sceneIndex: i, 
            field: "name",
            severity: "high" 
          });
        }
        if (isPlaceholder(scene.line)) {
          warnings.push({ 
            path: `scenes[${i}].line`, 
            message: "AngleCard line is empty or placeholder", 
            sceneIndex: i, 
            field: "line",
            severity: "high" 
          });
        }
        // Example is optional - if empty, set showExample to false
        if (isPlaceholder(scene.example) && scene.showExample !== false) {
          warnings.push({ 
            path: `scenes[${i}].example`, 
            message: "AngleCard example is empty - card will show without example", 
            sceneIndex: i, 
            field: "example",
            severity: "medium" 
          });
        }
      }
      
      if (scene.type === "method" && isPlaceholder(scene.headline)) {
        warnings.push({ 
          path: `scenes[${i}].headline`, 
          message: "Method headline is empty or placeholder", 
          sceneIndex: i, 
          field: "headline",
          severity: "high" 
        });
      }
      
      if (scene.type === "testDashboard" && isPlaceholder(scene.headline)) {
        warnings.push({ 
          path: `scenes[${i}].headline`, 
          message: "TestDashboard headline is empty or placeholder", 
          sceneIndex: i, 
          field: "headline",
          severity: "high" 
        });
      }
      
      if (scene.type === "winnerLoop") {
        if (!Array.isArray(scene.lines) || scene.lines.length === 0) {
          warnings.push({ 
            path: `scenes[${i}].lines`, 
            message: "WinnerLoop has no lines", 
            sceneIndex: i, 
            field: "lines",
            severity: "high" 
          });
        } else if (scene.lines.every((l: string) => isPlaceholder(l))) {
          warnings.push({ 
            path: `scenes[${i}].lines`, 
            message: "All WinnerLoop lines are empty or placeholder", 
            sceneIndex: i, 
            field: "lines",
            severity: "high" 
          });
        }
      }
      
      if (scene.type === "threeStep") {
        if (!Array.isArray(scene.steps) || scene.steps.length !== 3) {
          warnings.push({ 
            path: `scenes[${i}].steps`, 
            message: "ThreeStep must have exactly 3 steps", 
            sceneIndex: i, 
            field: "steps",
            severity: "high" 
          });
        } else if (scene.steps.some((s: string) => isPlaceholder(s))) {
          warnings.push({ 
            path: `scenes[${i}].steps`, 
            message: "Some ThreeStep steps are empty or placeholder", 
            sceneIndex: i, 
            field: "steps",
            severity: "medium" 
          });
        }
      }
      
      // Check sec range
      if (typeof scene.sec !== 'number' || scene.sec < 1 || scene.sec > 12) {
        warnings.push({ 
          path: `scenes[${i}].sec`, 
          message: `Scene duration out of range: ${scene.sec}s (should be 1-12s)`, 
          sceneIndex: i, 
          field: "sec",
          severity: "medium" 
        });
      }
    });
  } else {
    warnings.push({ path: "scenes", message: "Scenes array is missing", severity: "high" });
  }
  
  // Check brand colors
  if (p.brand) {
    if (p.brand.bg !== AA_BRAND.bg) warnings.push({ path: "brand.bg", message: "Non-AA background color", severity: "high" });
    if (p.brand.primary !== AA_BRAND.primary) warnings.push({ path: "brand.primary", message: "Non-AA primary color", severity: "high" });
    if (p.brand.secondary !== AA_BRAND.secondary) warnings.push({ path: "brand.secondary", message: "Non-AA secondary color", severity: "high" });
    if (p.brand.soft !== AA_BRAND.soft) warnings.push({ path: "brand.soft", message: "Non-AA soft color", severity: "high" });
  } else {
    warnings.push({ path: "brand", message: "Missing brand colors", severity: "high" });
  }
  
  return warnings;
}

/**
 * Validate and throw if invalid (for use before saving/rendering)
 */
export function validatePlanOrThrow(plan: unknown): PlanJson {
  // First check warnings for more descriptive errors
  const warnings = getPlanWarnings(plan);
  const criticalWarnings = warnings.filter(w => w.severity === "high");
  
  if (criticalWarnings.length > 0) {
    const messages = criticalWarnings.map(w => w.message).join("; ");
    throw new Error(`Plan validation failed: ${messages}`);
  }
  
  // Then do Zod validation for type safety
  const result = PlanJsonSchema.safeParse(plan);
  
  if (!result.success) {
    const errors = result.error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("; ");
    throw new Error(`Plan validation failed: ${errors}`);
  }
  
  return result.data;
}

/**
 * Validate plan and return result (non-throwing)
 */
export function validatePlan(plan: unknown): ValidationResult {
  const warnings = getPlanWarnings(plan);
  const errors: ValidationError[] = [];
  
  try {
    const result = PlanJsonSchema.safeParse(plan);
    if (!result.success) {
      result.error.errors.forEach(e => {
        errors.push({
          path: e.path.join("."),
          message: e.message,
        });
      });
    }
  } catch (err: any) {
    errors.push({ path: "root", message: err.message });
  }
  
  const valid = errors.length === 0 && warnings.filter(w => w.severity === "high").length === 0;
  
  return { valid, errors, warnings };
}

/**
 * Check if plan has blocking issues that prevent rendering
 */
export function hasCriticalWarnings(plan: unknown): boolean {
  const warnings = getPlanWarnings(plan);
  return warnings.some(w => w.severity === "high");
}

/**
 * Normalize and clean a plan (trim strings, remove placeholders, set defaults)
 */
export function normalizePlan(plan: any): any {
  if (!plan || typeof plan !== 'object') {
    return {
      style: "AA",
      format: { w: 1080, h: 1920, fps: 30 },
      brand: AA_BRAND,
      meta: { title: "Untitled", target_duration_sec: 60 },
      scenes: [],
    };
  }
  
  const normalized = {
    style: plan.style || "AA",
    format: {
      w: plan.format?.w || 1080,
      h: plan.format?.h || 1920,
      fps: plan.format?.fps || 30,
    },
    brand: {
      bg: AA_BRAND.bg,
      primary: AA_BRAND.primary,
      secondary: AA_BRAND.secondary,
      soft: AA_BRAND.soft,
    },
    meta: {
      title: (plan.meta?.title || "Untitled").trim(),
      target_duration_sec: plan.meta?.target_duration_sec || 60,
    },
    scenes: [] as any[],
  };
  
  if (Array.isArray(plan.scenes)) {
    normalized.scenes = plan.scenes.map((scene: any) => {
      const cleaned = { ...scene };
      
      // Trim all string fields
      Object.keys(cleaned).forEach(key => {
        if (typeof cleaned[key] === 'string') {
          cleaned[key] = cleaned[key].trim();
        }
        if (Array.isArray(cleaned[key])) {
          cleaned[key] = cleaned[key].map((v: any) => 
            typeof v === 'string' ? v.trim() : v
          ).filter((v: any) => typeof v === 'string' ? v.length > 0 : true);
        }
      });
      
      // Ensure sec is in valid range
      if (typeof cleaned.sec !== 'number' || cleaned.sec < 1) cleaned.sec = 3;
      if (cleaned.sec > 12) cleaned.sec = 12;
      
      // Handle empty examples for angleCard
      if (cleaned.type === "angleCard" && isPlaceholder(cleaned.example)) {
        cleaned.showExample = false;
        cleaned.example = "";
      }
      
      return cleaned;
    });
  }
  
  return normalized;
}
