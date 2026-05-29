import { NextResponse } from "next/server";
import { Webhook } from "fedapay";
import { fedapayConfig } from "@/lib/config";
import {
  getWebhookEventName,
  getWebhookTransactionId,
  recordWebhookEvent,
  statusFromWebhookEvent,
  syncPurchaseFromTransaction,
  type FedaPayWebhookEvent,
} from "@/lib/payment-sync";

export async function POST(request: Request) {
  if (!fedapayConfig.webhookSecret) {
    return NextResponse.json(
      { error: "FEDAPAY_WEBHOOK_SECRET non configuré." },
      { status: 503 },
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-fedapay-signature");

  if (!signature) {
    return NextResponse.json({ error: "Signature manquante." }, { status: 400 });
  }

  let event: FedaPayWebhookEvent;

  try {
    event = Webhook.constructEvent(
      rawBody,
      signature,
      fedapayConfig.webhookSecret,
    ) as FedaPayWebhookEvent;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Signature invalide.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const eventName = getWebhookEventName(event);
  const transactionId = getWebhookTransactionId(event);
  const eventId = event.id ? String(event.id) : null;

  if (eventId) {
    try {
      const { duplicate } = await recordWebhookEvent(
        eventId,
        eventName,
        transactionId,
      );
      if (duplicate) {
        return NextResponse.json({ received: true, duplicate: true });
      }
    } catch {
      // Table absente ou erreur DB : on continue quand même le traitement.
    }
  }

  if (!transactionId) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const preferredStatus = statusFromWebhookEvent(event);

  await syncPurchaseFromTransaction(transactionId, {
    preferredStatus,
    verifyWithApi: true,
  });

  return NextResponse.json({ received: true });
}
