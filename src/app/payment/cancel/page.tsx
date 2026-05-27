import { Header } from "@/components/Header";
import { Button } from "@/components/Button";

type PaymentCancelPageProps = {
  searchParams: Promise<{ audio?: string; status?: string }>;
};

export default async function PaymentCancelPage({
  searchParams,
}: PaymentCancelPageProps) {
  const { status } = await searchParams;
  const isFailed = status === "failed";

  return (
    <>
      <Header />
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="text-5xl">×</p>
        <h1 className="mt-4 text-3xl font-bold">
          {isFailed ? "Paiement refusé" : "Paiement annulé"}
        </h1>
        <p className="mt-3 text-muted">
          {isFailed
            ? "Le paiement n'a pas pu être accepté. Vérifiez votre solde Mobile Money et réessayez."
            : "Le paiement n'a pas été finalisé. Vous pouvez réessayer quand vous voulez."}
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button href="/audios">Retour au catalogue</Button>
          <Button href="/dashboard" variant="secondary">
            Mon dashboard
          </Button>
        </div>
      </main>
    </>
  );
}
