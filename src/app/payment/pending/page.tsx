import { Header } from "@/components/Header";
import { PaymentPendingTracker } from "@/components/PaymentPendingTracker";

type PaymentPendingPageProps = {
  searchParams: Promise<{ audio?: string; transaction?: string }>;
};

export default async function PaymentPendingPage({
  searchParams,
}: PaymentPendingPageProps) {
  const { audio, transaction } = await searchParams;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="text-5xl">⏳</p>
        <h1 className="mt-4 text-3xl font-bold">Paiement en cours</h1>
        <p className="mt-3 text-muted">
          Votre paiement Mobile Money est en cours de traitement chez Fedapay.
        </p>

        {fedapaySandboxHint}

        {audio && transaction ? (
          <div className="mt-8">
            <PaymentPendingTracker transactionId={transaction} audioId={audio} />
          </div>
        ) : (
          <p className="mt-8 text-sm text-muted">
            Retournez au catalogue pour réessayer votre achat.
          </p>
        )}
      </main>
    </>
  );
}

const fedapaySandboxHint = (
  <div className="mx-auto mt-6 max-w-md rounded-xl border border-gold/20 bg-gold/5 p-4 text-left text-sm text-muted">
    <p className="font-medium text-gold">Mode sandbox Fedapay</p>
    <p className="mt-2">
      Sur la page Fedapay, utilisez un numéro Mobile Money de test et suivez
      les instructions jusqu&apos;à la confirmation. Ne fermez pas la page
      avant la fin du paiement.
    </p>
  </div>
);
