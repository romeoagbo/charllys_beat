import { mapFedaPayStatus, retrieveFedaPayTransaction } from "@/lib/fedapay";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PurchaseStatus } from "@/types/purchase";

export type FedaPayWebhookEvent = {
  id?: string | number;
  name?: string;
  type?: string;
  object_id?: number;
  entity?: {
    id?: number;
    status?: string;
  };
};

export function getWebhookEventName(event: FedaPayWebhookEvent) {
  return event.name ?? event.type ?? "";
}

export function getWebhookTransactionId(event: FedaPayWebhookEvent) {
  if (event.entity?.id) return String(event.entity.id);
  if (event.object_id) return String(event.object_id);
  return null;
}

export function statusFromWebhookEvent(
  event: FedaPayWebhookEvent,
): PurchaseStatus | null {
  const name = getWebhookEventName(event);
  const entityStatus = event.entity?.status;

  switch (name) {
    case "transaction.approved":
      return "approved";
    case "transaction.canceled":
    case "transaction.cancelled":
      return "canceled";
    case "transaction.declined":
      return "failed";
    case "transaction.updated":
    case "transaction.created":
      return entityStatus ? mapFedaPayStatus(entityStatus) : null;
    default:
      return entityStatus ? mapFedaPayStatus(entityStatus) : null;
  }
}

export async function syncPurchaseFromTransaction(
  transactionId: string,
  options?: { verifyWithApi?: boolean; preferredStatus?: PurchaseStatus | null },
) {
  const admin = createAdminClient();

  const { data: purchase } = await admin
    .from("purchases")
    .select("id, audio_id, status")
    .eq("fedapay_transaction_id", transactionId)
    .maybeSingle();

  if (!purchase) {
    return { found: false as const };
  }

  let mappedStatus = options?.preferredStatus ?? null;

  if (options?.verifyWithApi !== false) {
    try {
      const transaction = await retrieveFedaPayTransaction(transactionId);
      mappedStatus = mapFedaPayStatus(transaction.status);
    } catch {
      if (!mappedStatus) {
        return { found: true as const, purchase, status: purchase.status as PurchaseStatus };
      }
    }
  }

  if (!mappedStatus) {
    return { found: true as const, purchase, status: purchase.status as PurchaseStatus };
  }

  if (mappedStatus !== purchase.status) {
    await admin
      .from("purchases")
      .update({ status: mappedStatus })
      .eq("id", purchase.id);
  }

  return {
    found: true as const,
    purchase,
    status: mappedStatus,
    audioId: purchase.audio_id,
  };
}

export async function recordWebhookEvent(
  eventId: string,
  eventName: string,
  transactionId: string | null,
) {
  const admin = createAdminClient();
  const { error } = await admin.from("payment_webhook_events").insert({
    event_id: eventId,
    event_name: eventName,
    fedapay_transaction_id: transactionId,
  });

  if (error?.code === "23505") {
    return { duplicate: true as const };
  }

  if (error) {
    throw new Error(error.message);
  }

  return { duplicate: false as const };
}
