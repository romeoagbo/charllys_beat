import { NextResponse } from "next/server";
import { fedapayConfig, getSiteUrl } from "@/lib/config";
import { createFedaPayTransaction, customerFromProfile } from "@/lib/fedapay";
import { hasApprovedPurchase } from "@/lib/purchases";
import { getProfile } from "@/lib/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!fedapayConfig.isConfigured) {
    return NextResponse.json(
      { error: "Fedapay n'est pas configuré." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  if (!user.email) {
    return NextResponse.json(
      { error: "Votre compte doit avoir une adresse email valide." },
      { status: 400 },
    );
  }

  let body: { audioId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const audioId = body.audioId;
  if (!audioId) {
    return NextResponse.json({ error: "Audio manquant." }, { status: 400 });
  }

  const profile = await getProfile(user.id);

  const { data: audio, error: audioError } = await supabase
    .from("audios")
    .select("id, title, price_fcfa, kind, status")
    .eq("id", audioId)
    .single();

  if (audioError || !audio) {
    return NextResponse.json({ error: "Audio introuvable." }, { status: 404 });
  }

  if (audio.kind !== "catalog" || audio.status !== "published") {
    return NextResponse.json(
      { error: "Cet audio n'est pas disponible à l'achat." },
      { status: 400 },
    );
  }

  if (audio.price_fcfa <= 0) {
    return NextResponse.json(
      { error: "Le prix de cet audio est invalide." },
      { status: 400 },
    );
  }

  if (await hasApprovedPurchase(user.id, audioId)) {
    return NextResponse.json({ alreadyOwned: true });
  }

  const callbackUrl = `${getSiteUrl(request)}/api/payments/callback`;

  const { data: purchase, error: purchaseError } = await supabase
    .from("purchases")
    .insert({
      user_id: user.id,
      audio_id: audioId,
      amount_fcfa: audio.price_fcfa,
      status: "pending",
    })
    .select("id")
    .single();

  if (purchaseError || !purchase) {
    return NextResponse.json(
      { error: purchaseError?.message ?? "Impossible de créer l'achat." },
      { status: 500 },
    );
  }

  try {
    const customer = customerFromProfile({
      email: user.email,
      displayName: profile?.display_name ?? null,
    });

    const transaction = await createFedaPayTransaction({
      description: `Achat audio — ${audio.title}`,
      amount: audio.price_fcfa,
      callbackUrl,
      customer,
    });

    const admin = createAdminClient();
    const { error: updateError } = await admin
      .from("purchases")
      .update({ fedapay_transaction_id: String(transaction.id) })
      .eq("id", purchase.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({
      purchaseId: purchase.id,
      checkout: {
        publicKey: fedapayConfig.publicKey,
        environment: fedapayConfig.environment,
        transaction: {
          id: transaction.id,
          amount: audio.price_fcfa,
          description: `Achat audio — ${audio.title}`,
        },
        currency: { iso: "XOF" },
        customer,
        callbackUrl,
      },
    });
  } catch (error) {
    const admin = createAdminClient();
    await admin.from("purchases").delete().eq("id", purchase.id);

    const message =
      error instanceof Error ? error.message : "Paiement impossible.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
