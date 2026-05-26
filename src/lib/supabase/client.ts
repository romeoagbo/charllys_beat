import { createBrowserClient } from "@supabase/ssr";
import { assertSupabaseConfig, supabaseConfig } from "@/lib/config";

export function createClient() {
  assertSupabaseConfig();
  return createBrowserClient(supabaseConfig.url, supabaseConfig.anonKey);
}
