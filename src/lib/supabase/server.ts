import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { assertSupabaseConfig, supabaseConfig } from "@/lib/config";

export async function createClient() {
  assertSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(supabaseConfig.url, supabaseConfig.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Ignoré dans les Server Components en lecture seule
        }
      },
    },
  });
}
