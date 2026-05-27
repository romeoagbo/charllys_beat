import { NextResponse } from "next/server";
import { syncPurchaseFromTransaction } from "@/lib/payment-sync";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get("transactionId");

  if (!transactionId) {
    return NextResponse.json({ error: "Transaction manquante." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const { data: owned } = await supabase
    .from("purchases")
    .select("id")
    .eq("fedapay_transaction_id", transactionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!owned) {
    return NextResponse.json({ error: "Achat introuvable." }, { status: 404 });
  }

  try {
    const result = await syncPurchaseFromTransaction(transactionId, {
      verifyWithApi: true,
    });

    if (!result.found) {
      return NextResponse.json({ error: "Achat introuvable." }, { status: 404 });
    }

    return NextResponse.json({
      status: result.status,
      audioId: result.audioId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Vérification impossible.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
