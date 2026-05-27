"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FedaPayCheckoutButton,
  type FedaPayCheckoutConfig,
} from "@/components/FedaPayCheckoutButton";

type BuyAudioButtonProps = {
  audioId: string;
  priceFcfa: number;
  purchased: boolean;
  isLoggedIn: boolean;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
}

export function BuyAudioButton({
  audioId,
  priceFcfa,
  purchased,
  isLoggedIn,
}: BuyAudioButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<{
    config: FedaPayCheckoutConfig;
    purchaseId: string;
  } | null>(null);

  if (purchased) {
    return <DownloadAudioButton audioId={audioId} />;
  }

  async function handleBuy() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setError(null);
    setCheckout(null);

    try {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioId }),
      });

      const data = (await response.json()) as {
        checkout?: FedaPayCheckoutConfig;
        purchaseId?: string;
        alreadyOwned?: boolean;
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Paiement impossible.");
        return;
      }

      if (data.alreadyOwned) {
        router.refresh();
        return;
      }

      if (data.checkout && data.purchaseId) {
        setCheckout({ config: data.checkout, purchaseId: data.purchaseId });
        return;
      }

      setError("Configuration de paiement indisponible.");
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  const buttonLabel = `Acheter · ${formatPrice(priceFcfa)}`;

  return (
    <div className="space-y-2">
      {checkout ? (
        <FedaPayCheckoutButton
          config={checkout.config}
          purchaseId={checkout.purchaseId}
          audioId={audioId}
          buttonText={buttonLabel}
          autoOpen
          onDismiss={() => setCheckout(null)}
          onError={(message) => {
            setError(message);
            setCheckout(null);
          }}
        />
      ) : (
        <button
          type="button"
          disabled={loading}
          onClick={handleBuy}
          className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-gold-light disabled:opacity-50"
        >
          {loading ? "Préparation..." : buttonLabel}
        </button>
      )}
      <p className="text-xs text-muted">
        Paiement sécurisé via Fedapay (Mobile Money)
      </p>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function DownloadAudioButton({ audioId }: { audioId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/payments/download?audioId=${encodeURIComponent(audioId)}`,
      );

      if (!response.ok) {
        let message = "Téléchargement indisponible.";
        try {
          const data = (await response.json()) as { error?: string };
          message = data.error ?? message;
        } catch {
          // réponse binaire ou vide
        }
        setError(message);
        return;
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? "audio.mp3";
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={loading}
        onClick={handleDownload}
        className="rounded-full border border-gold/40 px-5 py-2 text-sm font-medium text-gold transition-colors hover:bg-gold/10 disabled:opacity-50"
      >
        {loading ? "..." : "Télécharger"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
