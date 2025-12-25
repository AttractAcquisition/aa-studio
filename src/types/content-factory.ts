// Content Factory shared types

export type DesignAssetKind = "bold_text_card" | "reel_cover" | "one_pager_cover";

export type ExtractedImage = {
  url?: string; // data URL or http(s)
  data_url?: string;
  mime?: string;
  width?: number;
  height?: number;
};

export type GenerateScriptResponse = {
  run_id: string;
  script_text?: string;
  script?: { text?: string };
  output?: { script?: { text?: string } };
  error?: string;
};

export type GenerateOnePagerResponse = {
  run_id: string;
  one_pager_json?: OnePagerJson | OnePagerBlock[];
  one_pager_text?: string;
  blocks?: OnePagerBlock[];
  error?: string;
  debug?: unknown;
};

export type OnePagerJson = {
  blocks?: OnePagerBlock[];
  sections?: OnePagerBlock[];
};

export type OnePagerBlock = {
  id?: string | number;
  title?: string;
  content?: string;
  body?: string;
  details?: string;
  notes?: string;
};

export type GenerateDesignResponse = {
  run_id: string;
  format?: string;
  ratio?: string;
  mode?: string;
  // Preferred server response (base64)
  image_b64?: string | null;
  mime?: string;
  // Legacy server response
  images?: ExtractedImage[];
  design_json?: unknown;
  raw_text?: string | null;
  error?: string;
  debug?: unknown;
};

export type DesignImages = {
  bold_text_card?: string | null;
  reel_cover?: string | null;
  one_pager_cover?: string | null;
};

export type DesignPrompts = {
  bold_text_card?: string | null;
  reel_cover?: string | null;
  one_pager_cover?: string | null;
};

export type ContentFactoryInputs = {
  contentType: string;
  series: string;
  hook: string;
  audience: string;
};

export type ContentFactoryState = {
  currentStep: number;
  contentItemId: string | null;
  contentType: string;
  series: string;
  hook: string;
  audience: string;
  script: string;
  onePagerBlocks: OnePagerBlock[];
  designImages: DesignImages;
  isGenerating: boolean;
  isSaving: boolean;
  isGeneratingDesignKind: DesignAssetKind | null;
};

export const CONTENT_TYPES = [
  { value: "attraction-psychology", label: "Attraction Psychology" },
  { value: "framework", label: "Framework" },
  { value: "service-in-action", label: "Service-in-Action" },
  { value: "proof", label: "Proof" },
  { value: "reel", label: "Reel" },
  { value: "carousel", label: "Carousel" },
] as const;

export const SERIES_LIST = [
  { value: "fix-my-funnel", label: "Fix My Funnel" },
  { value: "attraction-audit", label: "Attraction Audit" },
  { value: "unavoidable-brand", label: "Unavoidable Brand Model" },
  { value: "ad-creative", label: "Ad Creative That Converts" },
  { value: "noise-to-bookings", label: "Noise → Bookings" },
] as const;

export const WORKFLOW_STEPS = [
  { id: 1, title: "Input" },
  { id: 2, title: "Script" },
  { id: 3, title: "One-Pager" },
  { id: 4, title: "Design" },
] as const;
