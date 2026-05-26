import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { AudioCard } from "@/components/AudioCard";
import { createClient } from "@/lib/supabase/server";
import { fedapayConfig } from "@/lib/config";
import type { Audio } from "@/types/audio";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: audios } = await supabase
    .from("audios")
    .select("*, profiles(display_name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const totalDownloads = (audios ?? []).reduce(
    (sum, a) => sum + (a.download_count ?? 0),
    0,
  );

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-24">
        <h1 className="text-3xl font-bold">
          Bienvenue, <span className="gold-gradient">{user.email}</span>
        </h1>
        <p className="mt-3 text-muted">Gérez vos contenus et suivez vos stats.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <p className="text-sm text-muted">Mes audios</p>
            <p className="mt-1 text-2xl font-bold text-gold">{audios?.length ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6">
            <p className="text-sm text-muted">Téléchargements</p>
            <p className="mt-1 text-2xl font-bold text-gold">{totalDownloads}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6">
            <p className="text-sm text-muted">Fedapay</p>
            <p className="mt-1 text-sm font-semibold text-gold">
              {fedapayConfig.isConfigured ? "Sandbox actif" : "Non configuré"}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <Button href="/dashboard/upload">Publier un audio</Button>
          <Button href="/audios" variant="secondary">
            Voir le catalogue
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
          <h2 className="text-xl font-semibold">Mes publications</h2>
          {!audios || audios.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-border bg-surface p-8 text-center">
              <p className="text-muted">Vous n&apos;avez pas encore publié d&apos;audio.</p>
              <div className="mt-4">
                <Button href="/dashboard/upload" variant="secondary">
                  Publier mon premier audio
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {(audios as Audio[]).map((audio) => (
                <AudioCard key={audio.id} audio={audio} showActions />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
