// Content Factory API client

import type { Session, User } from "@supabase/supabase-js";
import type {
  GenerateScriptResponse,
  GenerateOnePagerResponse,
  GenerateDesignResponse,
  DesignAssetKind,
} from "@/types/content-factory";

const CONTENT_FACTORY_WEBHOOK =
  import.meta.env.VITE_CONTENT_FACTORY_WEBHOOK_URL ||
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/content-factory`;

/**
 * Build authorization headers for API requests
 */
export function buildAuthHeaders(
  session: Session | null,
  user: User | null
): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const accessToken = session?.access_token;
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  if (user?.id) {
    headers["x-user-id"] = user.id;
  }

  return headers;
}

/**
 * Generate a unique idempotency key
 */
export function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random()}`;
}

/**
 * Generic POST to the content factory API
 */
export async function postContentFactory<T>(
  payload: Record<string, unknown>,
  headers: Record<string, string>
): Promise<T> {
  const res = await fetch(CONTENT_FACTORY_WEBHOOK, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || `Request failed with status ${res.status}`);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as T;
}

/**
 * Generate a script from inputs
 */
export async function generateScript(
  inputs: {
    content_type: string;
    series: string;
    hook?: string;
    target_audience: string;
  },
  session: Session | null,
  user: User | null
): Promise<GenerateScriptResponse> {
  const headers = buildAuthHeaders(session, user);
  const payload = {
    action: "generate_script",
    inputs,
    idempotency_key: generateIdempotencyKey(),
  };

  return postContentFactory<GenerateScriptResponse>(payload, headers);
}

/**
 * Generate a one-pager from an existing run
 */
export async function generateOnePager(
  runId: string,
  session: Session | null,
  user: User | null
): Promise<GenerateOnePagerResponse> {
  const headers = buildAuthHeaders(session, user);
  const payload = {
    action: "generate_one_pager",
    run_id: runId,
    idempotency_key: generateIdempotencyKey(),
  };

  return postContentFactory<GenerateOnePagerResponse>(payload, headers);
}

/**
 * Generate a design asset
 */
export async function generateDesignAsset(
  runId: string,
  kind: DesignAssetKind,
  session: Session | null,
  user: User | null
): Promise<GenerateDesignResponse> {
  const headers = buildAuthHeaders(session, user);

  const ratio =
    kind === "bold_text_card"
      ? "1:1"
      : kind === "reel_cover"
        ? "9:16"
        : "4:5";

  const payload = {
    action: "generate_design",
    run_id: runId,
    kind,
    ratio,
    mode: "clean",
    idempotency_key: generateIdempotencyKey(),
  };

  return postContentFactory<GenerateDesignResponse>(payload, headers);
}
