import { createClient } from "@/lib/supabase/server";
import type { PurchaseStatus } from "@/types/purchase";

export async function getApprovedPurchase(userId: string, audioId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchases")
    .select("*")
    .eq("user_id", userId)
    .eq("audio_id", audioId)
    .eq("status", "approved")
    .maybeSingle();

  return data;
}

export async function getApprovedAudioIds(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchases")
    .select("audio_id")
    .eq("user_id", userId)
    .eq("status", "approved");

  return new Set((data ?? []).map((purchase) => purchase.audio_id as string));
}

export async function hasApprovedPurchase(userId: string, audioId: string) {
  const purchase = await getApprovedPurchase(userId, audioId);
  return Boolean(purchase);
}

export function isPurchaseStatus(value: string): value is PurchaseStatus {
  return ["pending", "approved", "canceled", "failed"].includes(value);
}
