import { supabase } from "@/integrations/supabase/client";

// Upload file to Supabase Storage
export async function uploadToBucket(
  bucket: string,
  file: File,
  userId: string,
  subfolder?: string
): Promise<{ path: string; publicUrl: string } | null> {
  const timestamp = Date.now();
  const fileExt = file.name.split(".").pop();
  const fileName = `${timestamp}.${fileExt}`;
  const path = subfolder 
    ? `${userId}/${subfolder}/${fileName}`
    : `${userId}/${fileName}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file);

  if (error) {
    console.error("Upload error:", error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return {
    path,
    publicUrl: urlData.publicUrl,
  };
}

// Upload blob to Supabase Storage
export async function uploadBlobToBucket(
  bucket: string,
  blob: Blob,
  userId: string,
  filename: string
): Promise<{ path: string; publicUrl: string } | null> {
  const path = `${userId}/${filename}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, {
      contentType: blob.type,
      upsert: true,
    });

  if (error) {
    console.error("Upload error:", error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return {
    path,
    publicUrl: urlData.publicUrl,
  };
}

// Create asset row in database
export async function createAssetRow(
  userId: string,
  bucket: string,
  path: string,
  kind: string,
  tags: string[],
  title?: string,
  meta?: Record<string, any>
) {
  const { data, error } = await supabase
    .from("assets")
    .insert({
      user_id: userId,
      bucket,
      path,
      kind,
      tags,
      title,
      meta: meta || {},
    })
    .select()
    .single();

  if (error) {
    console.error("Create asset error:", error);
    return null;
  }

  return data;
}

// Format filename from naming convention
export function formatFilenameFromConvention(
  convention: string,
  params: {
    series?: string;
    title?: string;
    format?: string;
    date?: Date;
  }
): string {
  const safeStr = (s: string) =>
    s
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, "")
      .trim();

  const dateStr = (params.date || new Date())
    .toISOString()
    .split("T")[0];

  let filename = convention
    .replace("[Series]", safeStr(params.series || "Content"))
    .replace("[Title]", safeStr(params.title || "Untitled"))
    .replace("[Format]", params.format || "9x16")
    .replace("[Date]", dateStr);

  return filename;
}

// Get public URL for an asset
export function getAssetPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// Default brand settings
export const defaultBrandSettings = {
  palette: {
    deepInk: "#0B0F19",
    deepPurple: "#6A00F4",
    electricPurple: "#9D4BFF",
    lightLavender: "#EBD7FF",
    white: "#FFFFFF",
  },
  typography: {
    primary: "Inter",
    fallback: "SF Pro, Helvetica, sans-serif",
    headlineWeight: "800",
  },
  rules: {
    highContrast: true,
    minimalLayout: true,
    singleAccent: true,
    boldTypography: true,
    aaMonogramPlacement: "bottom-right",
  },
  brand_assets: {},
};

// Initialize brand settings for new user
export async function initializeBrandSettings(userId: string) {
  const { data: existing } = await supabase
    .from("brand_settings")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase
    .from("brand_settings")
    .insert({
      user_id: userId,
      naming_convention: "AA_[Series]_[Title]_[Format]_[Date]",
      palette: defaultBrandSettings.palette,
      typography: defaultBrandSettings.typography,
      rules: defaultBrandSettings.rules,
      brand_assets: defaultBrandSettings.brand_assets,
    })
    .select()
    .single();

  if (error) {
    console.error("Init brand settings error:", error);
    return null;
  }

  return data;
}
