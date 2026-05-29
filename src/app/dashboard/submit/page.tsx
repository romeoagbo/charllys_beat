import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { SubmitToExpertForm } from "@/components/SubmitToExpertForm";
import { createClient } from "@/lib/supabase/server";
import { getProfile, isAdmin, isExpert } from "@/lib/profile";

export default async function SubmitPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getProfile(user.id);

  if (!profile || isAdmin(profile.role) || isExpert(profile.role)) {
    redirect("/dashboard");
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
          Envoyer aux <span className="gold-gradient">experts</span>
        </h1>
        <p className="mt-2 text-muted">
          Partagez votre maquette avec nos experts musicaux pour obtenir un avis,
          un mixage ou un mastering.
        </p>
        <div className="mt-8">
          <SubmitToExpertForm userId={user.id} />
        </div>
      </main>
    </>
  );
}
