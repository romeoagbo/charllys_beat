import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { ExpertCard, ExpertFilters } from "@/components/ExpertCard";
import { createClient } from "@/lib/supabase/server";
import { getProfile, isAdmin } from "@/lib/profile";
import type { Expert, ExpertService } from "@/types/expert";

type ExpertsPageProps = {
  searchParams: Promise<{ specialty?: string }>;
};

function parseServices(raw: unknown): ExpertService[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (s): s is ExpertService =>
      typeof s === "object" &&
      s !== null &&
      "name" in s &&
      typeof (s as ExpertService).name === "string",
  );
}

export default async function ExpertsPage({ searchParams }: ExpertsPageProps) {
  const { specialty } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getProfile(user.id) : null;
  const admin = profile ? isAdmin(profile.role) : false;

  let query = supabase
    .from("experts")
    .select("*")
    .eq("is_active", true)
    .order("rating", { ascending: false });

  if (specialty) {
    query = query.eq("specialty", specialty);
  }

  const { data: experts, error } = await query;

  const { data: allExperts } = await supabase
    .from("experts")
    .select("specialty")
    .eq("is_active", true);

  const specialties = [
    ...new Set((allExperts ?? []).map((e) => e.specialty as string)),
  ].sort();

  const expertList: Expert[] = (experts ?? []).map((e) => ({
    ...e,
    services: parseServices(e.services),
    rating: Number(e.rating),
  }));

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-24">
        <h1 className="text-3xl font-bold">
          Nos <span className="gold-gradient">experts musicaux</span>
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Mixage, mastering, production vocale — collaborez avec des
          professionnels pour faire progresser vos créations.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          {admin ? (
            <>
              <Button href="/dashboard/admin">Panel admin</Button>
              <Button href="/dashboard/upload" variant="secondary">
                Publier un audio
              </Button>
            </>
          ) : user ? (
            <Button href="/dashboard/submit">Envoyer ma maquette</Button>
          ) : (
            <>
              <Button href="/register">Créer un compte</Button>
              <Button href="/login" variant="secondary">
                Se connecter
              </Button>
            </>
          )}
        </div>

        {error && (
          <p className="mt-8 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            Impossible de charger les experts. Exécutez{" "}
            <code className="text-red-300">npm run db:migrate</code> pour
            appliquer la migration <code className="text-red-300">003_experts</code>.
          </p>
        )}

        {!error && specialties.length > 0 && (
          <div className="mt-10">
            <ExpertFilters specialties={specialties} active={specialty} />
          </div>
        )}

        {!error && expertList.length === 0 && (
          <div className="mt-12 rounded-2xl border border-border bg-surface p-12 text-center">
            <p className="text-4xl">🎤</p>
            <p className="mt-4 text-lg font-medium">
              {specialty
                ? `Aucun expert en « ${specialty} »`
                : "Aucun expert disponible"}
            </p>
            {specialty && (
              <Link
                href="/experts"
                className="mt-4 inline-block text-sm text-gold hover:underline"
              >
                Voir tous les experts
              </Link>
            )}
          </div>
        )}

        <div className="mt-8 space-y-6">
          {expertList.map((expert) => (
            <ExpertCard key={expert.id} expert={expert} showCta={!admin} />
          ))}
        </div>

        <section className="mt-16 rounded-2xl border border-gold/20 bg-gold/5 p-8 text-center">
          <h2 className="text-xl font-semibold">Comment ça marche ?</h2>
          <ol className="mx-auto mt-6 grid max-w-2xl gap-4 text-left text-sm text-muted sm:grid-cols-3">
            <li className="rounded-xl bg-surface p-4">
              <span className="font-bold text-gold">1.</span> Créez votre compte
              artiste
            </li>
            <li className="rounded-xl bg-surface p-4">
              <span className="font-bold text-gold">2.</span> Uploadez votre
              maquette audio
            </li>
            <li className="rounded-xl bg-surface p-4">
              <span className="font-bold text-gold">3.</span> Recevez l&apos;avis
              d&apos;un expert
            </li>
          </ol>
        </section>
      </main>
    </>
  );
}
