import Link from "next/link";
import { Header } from "@/components/Header";
import { UploadForm } from "@/components/UploadForm";
import { requireAdmin } from "@/lib/require-admin";

export default async function UploadPage() {
  const { user } = await requireAdmin();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-6 py-24">
        <Link
          href="/dashboard/admin"
          className="text-sm text-muted transition-colors hover:text-gold"
        >
          ← Retour au panel admin
        </Link>
        <h1 className="mt-4 text-3xl font-bold">
          Publier un <span className="gold-gradient">audio</span>
        </h1>
        <p className="mt-2 text-muted">
          Publication réservée aux administrateurs. L&apos;audio sera visible sur
          le catalogue public.
        </p>
        <div className="mt-8">
          <UploadForm userId={user.id} />
        </div>
      </main>
    </>
  );
}
