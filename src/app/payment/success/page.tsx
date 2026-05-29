import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { DownloadAudioButton } from "@/components/BuyAudioButton";

type PaymentSuccessPageProps = {
  searchParams: Promise<{ audio?: string }>;
};

export default async function PaymentSuccessPage({
  searchParams,
}: PaymentSuccessPageProps) {
  const { audio } = await searchParams;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="text-5xl">✓</p>
        <h1 className="mt-4 text-3xl font-bold">
          Paiement <span className="gold-gradient">confirmé</span>
        </h1>
        <p className="mt-3 text-muted">
          Votre achat est validé. Vous pouvez maintenant télécharger l&apos;audio.
        </p>

        {audio && (
          <div className="mt-8 flex justify-center">
            <DownloadAudioButton audioId={audio} />
          </div>
        )}

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
