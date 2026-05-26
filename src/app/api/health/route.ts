import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fedapayConfig } from "@/lib/config";

export async function GET() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.getSession();

    return NextResponse.json({
      status: "ok",
      supabase: error ? "error" : "connected",
      fedapay: fedapayConfig.isConfigured ? "configured" : "missing",
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Configuration invalide" },
      { status: 500 },
    );
  }
}
