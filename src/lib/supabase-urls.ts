const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? "https://fgyvcyksgbivhrqoxkmj.supabase.co").replace(/\/$/, "");

export function getSupabaseUrl() {
  return SUPABASE_URL;
}

export function supabaseFunctionUrl(functionName: string) {
  if (!SUPABASE_URL) {
    throw new Error("Missing VITE_SUPABASE_URL");
  }
  return `${SUPABASE_URL}/functions/v1/${functionName}`;
}

export function supabaseStoragePublicUrl(objectPath: string) {
  if (!SUPABASE_URL) {
    throw new Error("Missing VITE_SUPABASE_URL");
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${objectPath}`;
}
