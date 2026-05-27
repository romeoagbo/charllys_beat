"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";

type PaymentPendingTrackerProps = {
  transactionId: string;
  audioId: string;
};

export function PaymentPendingTracker({
  transactionId,
  audioId,
}: PaymentPendingTrackerProps) {
  const router = useRouter();
  const [message, setMessage] = useState("Vérification du paiement...");
  const [checking, setChecking] = useState(false);

  async function checkStatus() {
    setChecking(true);
    setMessage("Vérification du paiement...");

    try {
      const response = await fetch(
        `/api/payments/status?transactionId=${encodeURIComponent(transactionId)}`,
      );
      const data = (await response.json()) as {
        status?: string;
        error?: string;
      };

      if (!response.ok) {
        setMessage(data.error ?? "Impossible de vérifier le paiement.");
        return;
      }

      if (data.status === "approved") {
        router.replace(`/payment/success?audio=${encodeURIComponent(audioId)}`);
        router.refresh();
        return;
      }

      if (data.status === "canceled" || data.status === "failed") {
        router.replace(
          `/payment/cancel?audio=${encodeURIComponent(audioId)}&status=${data.status}`,
        );
        return;
      }

      setMessage(
        "Paiement en attente. Finalisez le paiement sur Fedapay (Mobile Money), puis cliquez sur « Vérifier à nouveau ».",
      );
    } catch {
      setMessage("Erreur réseau. Réessayez dans quelques instants.");
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    void checkStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{message}</p>
      <button
        type="button"
        disabled={checking}
        onClick={checkStatus}
        className="rounded-full border border-gold/40 px-5 py-2 text-sm font-medium text-gold transition-colors hover:bg-gold/10 disabled:opacity-50"
      >
        {checking ? "Vérification..." : "Vérifier à nouveau"}
      </button>
      <div>
        <Button href="/audios" variant="secondary">
          Retour au catalogue
        </Button>
      </div>
    </div>
  );
}
