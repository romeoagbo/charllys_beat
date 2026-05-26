import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { UploadForm } from "@/components/UploadForm";
import { createClient } from "@/lib/supabase/server";

export default async function UploadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-6 py-24">
        <Link
          href="/dashboard"
          className="text-sm text-muted transition-colors hover:text-gold"
        >
          ← Retour au dashboard
        </Link>
        <h1 className="mt-4 text-3xl font-bold">
          Publier un <span className="gold-gradient">audio</span>
        </h1>
        <p className="mt-2 text-muted">
          Uploadez votre beat, instrumental ou voix. L&apos;extrait sera
          disponible immédiatement sur le catalogue.
        </p>
        <div className="mt-8">
          <UploadForm userId={user.id} />
        </div>
      </main>
    </>
  );
}
