export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
};

export const fedapayConfig = {
  secretKey: process.env.FEDAPAY_SECRET_KEY ?? "",
  publicKey: process.env.NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY ?? "",
  isConfigured: Boolean(
    process.env.FEDAPAY_SECRET_KEY &&
      process.env.NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY,
  ),
};

export function assertSupabaseConfig() {
  if (!supabaseConfig.url || !supabaseConfig.anonKey) {
    throw new Error(
      "Supabase non configuré : NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY requis.",
    );
  }
}
