export type PurchaseStatus = "pending" | "approved" | "canceled" | "failed";

export type Purchase = {
  id: string;
  user_id: string;
  audio_id: string;
  amount_fcfa: number;
  fedapay_transaction_id: string | null;
  status: PurchaseStatus;
  created_at: string;
  updated_at: string;
};
