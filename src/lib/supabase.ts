import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Returns a Supabase client if env vars are set, otherwise null (falls back to local storage)
export const supabase = url && anon ? createClient(url, anon) : null;
export const SUPABASE_BUCKET = "media";
export const hasSupabaseStorage = !!supabase;

export async function uploadToSupabase(file: Buffer, filename: string, mimeType: string): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(filename, file, {
      contentType: mimeType,
      upsert: false,
    });
    if (error) {
      console.error("[supabase] upload error:", error.message);
      return null;
    }
    const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(filename);
    return data.publicUrl;
  } catch (e) {
    console.error("[supabase] upload exception:", e);
    return null;
  }
}
