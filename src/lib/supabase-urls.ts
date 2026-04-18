const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");

export function getSupabaseUrl() {
  if (!supabaseUrl) {
    throw new Error("Missing Supabase environment variables");
  }

  return supabaseUrl;
}

export function supabaseFunctionUrl(functionName: string) {
  return `${getSupabaseUrl()}/functions/v1/${functionName}`;
}

export function supabaseStoragePublicUrl(objectPath: string) {
  return `${getSupabaseUrl()}/storage/v1/object/public/${objectPath}`;
}
