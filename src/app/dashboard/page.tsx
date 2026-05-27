import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { AudioCard } from "@/components/AudioCard";
import { createClient } from "@/lib/supabase/server";
import { getProfile, isAdmin } from "@/lib/profile";
import type { Audio } from "@/types/audio";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getProfile(user.id);

  if (profile && isAdmin(profile.role)) {
    redirect("/dashboard/admin");
  }

  const [{ data: audios }, { data: purchases }] = await Promise.all([
    supabase
      .from("audios")
      .select("*, profiles!audios_profile_fkey(display_name)")
      .eq("user_id", user.id)
      .eq("kind", "submission")
      .order("created_at", { ascending: false }),
    supabase
      .from("purchases")
      .select("*, audios(*, profiles!audios_profile_fkey(display_name))")
      .eq("user_id", user.id)
      .eq("status", "approved")
      .order("created_at", { ascending: false }),
  ]);

  const submissions = audios ?? [];
  const purchasedAudios = (purchases ?? [])
    .map((purchase) => purchase.audios)
    .filter(Boolean) as Audio[];
  const pendingCount = submissions.filter((s) => s.status === "pending").length;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-24">
        <h1 className="text-3xl font-bold">
          Bienvenue,{" "}
          <span className="gold-gradient">
            {profile?.display_name ?? user.email}
          </span>
        </h1>
        <p className="mt-3 text-muted">
          Envoyez vos maquettes aux experts musicaux.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <p className="text-sm text-muted">Envois aux experts</p>
            <p className="mt-1 text-2xl font-bold text-gold">
              {submissions.length}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6">
            <p className="text-sm text-muted">En attente d&apos;avis</p>
            <p className="mt-1 text-2xl font-bold text-gold">{pendingCount}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6">
            <p className="text-sm text-muted">Audios achetés</p>
            <p className="mt-1 text-2xl font-bold text-gold">
              {purchasedAudios.length}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <Button href="/dashboard/submit">Envoyer aux experts</Button>
          <Button href="/experts" variant="secondary">
            Voir les experts
          </Button>
          <Button href="/audios" variant="ghost">
            Explorer le catalogue
          </Button>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="rounded-full px-6 py-3 text-sm text-muted transition-colors hover:text-foreground"
            >
              Déconnexion
            </button>
          </form>
        </div>

        <section className="mt-12">
          <h2 className="text-xl font-semibold">Mes achats</h2>
          {purchasedAudios.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-border bg-surface p-8 text-center">
              <p className="text-muted">
                Vous n&apos;avez pas encore acheté d&apos;audio.
              </p>
              <div className="mt-4">
                <Button href="/audios" variant="secondary">
                  Explorer le catalogue
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {purchasedAudios.map((audio) => (
                <AudioCard
                  key={audio.id}
                  audio={audio}
                  purchased
                  isLoggedIn
                  showPurchase
                />
              ))}
            </div>
          )}
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold">Mes envois aux experts</h2>
          {submissions.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-border bg-surface p-8 text-center">
              <p className="text-muted">
                Vous n&apos;avez pas encore envoyé de maquette aux experts.
              </p>
              <div className="mt-4">
                <Button href="/dashboard/submit" variant="secondary">
                  Envoyer ma première maquette
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {(submissions as Audio[]).map((audio) => (
                <AudioCard key={audio.id} audio={audio} showActions />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
