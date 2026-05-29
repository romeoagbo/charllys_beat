export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
};

export const fedapayConfig = {
  secretKey: process.env.FEDAPAY_SECRET_KEY ?? "",
  publicKey: process.env.NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY ?? "",
  webhookSecret: process.env.FEDAPAY_WEBHOOK_SECRET ?? "",
  environment: (process.env.FEDAPAY_ENVIRONMENT ?? "sandbox") as
    | "sandbox"
    | "live",
  isConfigured: Boolean(
    process.env.FEDAPAY_SECRET_KEY &&
      process.env.NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY,
  ),
  isWebhookConfigured: Boolean(process.env.FEDAPAY_WEBHOOK_SECRET),
};

export function getSiteUrl(request?: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  if (request) {
    const host = request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") ?? "http";
    if (host) return `${proto}://${host}`;
  }

  return "http://localhost:3000";
}

export function siteRedirectPath(
  path: string,
  request?: Request,
  params?: Record<string, string>,
) {
  const url = new URL(path, `${getSiteUrl(request)}/`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return url;
}

export function assertSupabaseConfig() {
  if (!supabaseConfig.url || !supabaseConfig.anonKey) {
    throw new Error(
      "Supabase non configuré : NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY requis.",
    );
  }
}
