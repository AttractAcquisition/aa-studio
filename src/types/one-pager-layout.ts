// One-Pager Block-Based Layout Schema
import { z } from "zod";

// Block type definitions
export const CardBlockSchema = z.object({
  type: z.literal("card"),
  title: z.string(),
  bullets: z.array(z.string()),
});

export const ChecklistBlockSchema = z.object({
  type: z.literal("checklist"),
  title: z.string().optional(),
  items: z.array(z.string()),
});

export const StepsBlockSchema = z.object({
  type: z.literal("steps"),
  title: z.string().optional(),
  steps: z.array(z.string()),
});

export const TemplateBlockSchema = z.object({
  type: z.literal("template"),
  title: z.string(),
  lines: z.array(z.string()),
});

export const TableBlockSchema = z.object({
  type: z.literal("table"),
  title: z.string().optional(),
  columns: z.array(z.string()),
  rows: z.array(z.array(z.string())),
});

export const ScorecardBlockSchema = z.object({
  type: z.literal("scorecard"),
  title: z.string(),
  rows: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })),
});

export const MiniBarChartBlockSchema = z.object({
  type: z.literal("mini_bar_chart"),
  title: z.string().optional(),
  data: z.array(z.object({
    name: z.string(),
    value: z.number(),
  })),
});

export const WarningBlockSchema = z.object({
  type: z.literal("warning"),
  title: z.string().optional(),
  text: z.string(),
});

export const CTAButtonsBlockSchema = z.object({
  type: z.literal("cta_buttons"),
  primary: z.object({
    label: z.string(),
    actionText: z.string(),
  }),
  secondary: z.object({
    label: z.string(),
    actionText: z.string(),
  }).optional(),
});

// Union of all block types
export const OnePagerBlockSchema = z.discriminatedUnion("type", [
  CardBlockSchema,
  ChecklistBlockSchema,
  StepsBlockSchema,
  TemplateBlockSchema,
  TableBlockSchema,
  ScorecardBlockSchema,
  MiniBarChartBlockSchema,
  WarningBlockSchema,
  CTAButtonsBlockSchema,
]);

// Section schema
export const OnePagerSectionSchema = z.object({
  id: z.string(),
  beatNumber: z.number(),
  heading: z.string(),
  blocks: z.array(OnePagerBlockSchema),
});

// Footer schema
export const OnePagerFooterSchema = z.object({
  text: z.string().optional(),
});

// Meta schema
export const OnePagerMetaSchema = z.object({
  title: z.string(),
  audience: z.string().optional(),
  readTime: z.string().optional(),
  tag: z.string().optional(),
});

// Complete layout schema
export const OnePagerLayoutSchema = z.object({
  version: z.literal(1),
  meta: OnePagerMetaSchema,
  sections: z.array(OnePagerSectionSchema),
  footer: OnePagerFooterSchema.optional(),
});

// TypeScript types derived from schemas
export type CardBlock = z.infer<typeof CardBlockSchema>;
export type ChecklistBlock = z.infer<typeof ChecklistBlockSchema>;
export type StepsBlock = z.infer<typeof StepsBlockSchema>;
export type TemplateBlock = z.infer<typeof TemplateBlockSchema>;
export type TableBlock = z.infer<typeof TableBlockSchema>;
export type ScorecardBlock = z.infer<typeof ScorecardBlockSchema>;
export type MiniBarChartBlock = z.infer<typeof MiniBarChartBlockSchema>;
export type WarningBlock = z.infer<typeof WarningBlockSchema>;
export type CTAButtonsBlock = z.infer<typeof CTAButtonsBlockSchema>;

export type OnePagerBlock = z.infer<typeof OnePagerBlockSchema>;
export type OnePagerSection = z.infer<typeof OnePagerSectionSchema>;
export type OnePagerMeta = z.infer<typeof OnePagerMetaSchema>;
export type OnePagerFooter = z.infer<typeof OnePagerFooterSchema>;
export type OnePagerLayout = z.infer<typeof OnePagerLayoutSchema>;

// Validation helper
export function validateOnePagerLayout(data: unknown): { 
  success: boolean; 
  data?: OnePagerLayout; 
  error?: string;
} {
  try {
    const parsed = OnePagerLayoutSchema.parse(data);
    return { success: true, data: parsed };
  } catch (e) {
    if (e instanceof z.ZodError) {
      const issues = e.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
      return { success: false, error: issues };
    }
    return { success: false, error: 'Invalid JSON structure' };
  }
}

// Template IDs
export type OnePagerTemplateId = 'auto' | 'definition-steps' | 'problem-fix' | 'framework-scorecard' | 'playbook' | 'audit-sheet';
