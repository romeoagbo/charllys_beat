import { NextResponse } from "next/server";
import { syncPurchaseFromTransaction } from "@/lib/payment-sync";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  let body: { purchaseId?: string; transactionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const { purchaseId, transactionId } = body;
  if (!purchaseId || !transactionId) {
    return NextResponse.json(
      { error: "Achat ou transaction manquant." },
      { status: 400 },
    );
  }

  const { data: purchase, error: purchaseError } = await supabase
    .from("purchases")
    .select("id, audio_id, status, fedapay_transaction_id")
    .eq("id", purchaseId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (purchaseError || !purchase) {
    return NextResponse.json({ error: "Achat introuvable." }, { status: 404 });
  }

  if (
    purchase.fedapay_transaction_id &&
    purchase.fedapay_transaction_id !== transactionId
  ) {
    return NextResponse.json(
      { error: "Transaction incompatible avec cet achat." },
      { status: 409 },
    );
  }

  if (!purchase.fedapay_transaction_id) {
    const { error: updateError } = await supabase
      .from("purchases")
      .update({ fedapay_transaction_id: transactionId })
      .eq("id", purchase.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 },
      );
    }
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
