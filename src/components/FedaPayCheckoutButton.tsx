"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFedaPayScriptReady } from "@/components/FedaPayScript";
import type { FedaPayCompleteResponse } from "@/types/fedapay-checkout";

export type FedaPayCheckoutConfig = {
  publicKey: string;
  environment: "sandbox" | "live";
  transaction: {
    id: number;
    amount: number;
    description: string;
  };
  currency: { iso: string };
  customer?: {
    firstname: string;
    lastname: string;
    email: string;
    phone_number?: { number: string; country: string };
  };
  callbackUrl: string;
};

type FedaPayCheckoutButtonProps = {
  config: FedaPayCheckoutConfig;
  audioId: string;
  purchaseId: string;
  buttonText: string;
  autoOpen?: boolean;
  onDismiss?: () => void;
  onError?: (message: string) => void;
};

const buttonClassName =
  "rounded-full bg-gold px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-gold-light disabled:opacity-50";

export function FedaPayCheckoutButton({
  config,
  audioId,
  purchaseId,
  buttonText,
  autoOpen = false,
  onDismiss,
  onError,
}: FedaPayCheckoutButtonProps) {
  const router = useRouter();
  const scriptReady = useFedaPayScriptReady();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!scriptReady || initialized) return;

    const button = buttonRef.current;
    if (!button || typeof FedaPay === "undefined") return;

    FedaPay.init(button, {
      public_key: config.publicKey,
      environment: config.environment,
      transaction: {
        id: config.transaction.id,
        amount: config.transaction.amount,
        description: config.transaction.description,
        custom_metadata: { purchase_id: purchaseId },
      },
      currency: config.currency,
      customer: config.customer,
      callback_url: config.callbackUrl,
      locale: "fr",
      button: {
        text: buttonText,
        class: buttonClassName,
      },
      onComplete: (resp: FedaPayCompleteResponse) => {
        void handleComplete(resp);
      },
    });

    setInitialized(true);
  }, [scriptReady, initialized, config, purchaseId, buttonText]);

  useEffect(() => {
    if (!autoOpen || !initialized || !buttonRef.current) return;
    buttonRef.current.click();
  }, [autoOpen, initialized]);

  async function handleComplete(resp: FedaPayCompleteResponse) {
    if (resp.reason === FedaPay.DIALOG_DISMISSED) {
      onDismiss?.();
      return;
    }

    const transactionId = resp.transaction?.id;
    if (!transactionId) {
      onError?.("Paiement incomplet.");
      return;
    }

    try {
      const response = await fetch("/api/payments/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseId,
          transactionId: String(transactionId),
        }),
      });

      const data = (await response.json()) as {
        status?: string;
        error?: string;
      };

      if (!response.ok) {
        onError?.(data.error ?? "Impossible de finaliser le paiement.");
        return;
      }

      if (data.status === "approved") {
        router.push(`/payment/success?audio=${encodeURIComponent(audioId)}`);
        router.refresh();
        return;
      }

      if (data.status === "pending") {
        router.push(
          `/payment/pending?audio=${encodeURIComponent(audioId)}&transaction=${transactionId}`,
        );
        return;
      }

      router.push(
        `/payment/cancel?audio=${encodeURIComponent(audioId)}&status=${data.status ?? "failed"}`,
      );
    } catch {
      onError?.("Erreur réseau. Réessayez.");
    }
  }

  return (
    <button type="button" ref={buttonRef} className={buttonClassName}>
      {buttonText}
    </button>
  );
}
