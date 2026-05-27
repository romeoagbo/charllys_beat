import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { AudioCard } from "@/components/AudioCard";
import { AdminSubmissionActions } from "@/components/AdminSubmissionActions";
import { requireAdmin } from "@/lib/require-admin";
import { createClient } from "@/lib/supabase/server";
import type { Audio } from "@/types/audio";

export default async function AdminPage() {
  const { profile } = await requireAdmin();
  const supabase = await createClient();

  const [
    { data: submissions },
    { data: catalog },
    { count: usersCount },
    { count: pendingCount },
  ] = await Promise.all([
    supabase
      .from("audios")
      .select("*, profiles!audios_profile_fkey(display_name)")
      .eq("kind", "submission")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("audios")
      .select("*, profiles!audios_profile_fkey(display_name)")
      .eq("kind", "catalog")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("audios")
      .select("*", { count: "exact", head: true })
      .eq("kind", "submission")
      .eq("status", "pending"),
  ]);

  const totalDownloads =
    catalog?.reduce((sum, a) => sum + (a.download_count ?? 0), 0) ?? 0;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-24">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-gold">
              Administration
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              Panel <span className="gold-gradient">Admin</span>
            </h1>
            <p className="mt-2 text-muted">
              Bonjour {profile.display_name} — gérez le catalogue et les envois
              des artistes.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href="/dashboard/admin/manage" variant="secondary">
              Utilisateurs & fichiers
            </Button>
            <Button href="/experts" variant="secondary">
              Voir les experts
            </Button>
            <Button href="/dashboard/upload">Publier un audio</Button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Utilisateurs" value={usersCount ?? 0} />
          <StatCard label="Catalogue public" value={catalog?.length ?? 0} />
          <StatCard label="Envois en attente" value={pendingCount ?? 0} />
          <StatCard label="Téléchargements" value={totalDownloads} />
        </div>

        <section className="mt-12">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">
              Envois des artistes aux experts
            </h2>
            <span className="text-sm text-muted">
              {submissions?.length ?? 0} au total
            </span>
          </div>

          {!submissions || submissions.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-border bg-surface p-8 text-center text-muted">
              Aucun envoi pour le moment.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {(submissions as Audio[]).map((audio) => (
                <AudioCard
                  key={audio.id}
                  audio={audio}
                  adminControls={
                    <AdminSubmissionActions
                      submissionId={audio.id}
                      status={audio.status}
                      existingFeedback={audio.review_feedback}
                    />
                  }
                />
              ))}
            </div>
          )}
        </section>

        <section className="mt-12">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Catalogue public</h2>
            <Link
              href="/audios"
              className="text-sm text-gold hover:underline"
            >
              Voir tout →
            </Link>
          </div>

          {!catalog || catalog.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-border bg-surface p-8 text-center">
              <p className="text-muted">Le catalogue est vide.</p>
              <div className="mt-4">
                <Button href="/dashboard/upload" variant="secondary">
                  Publier le premier audio
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {(catalog as Audio[]).map((audio) => (
                <AudioCard key={audio.id} audio={audio} showActions />
              ))}
            </div>
          )}
        </section>

        <div className="mt-10">
          <Link
            href="/dashboard"
            className="text-sm text-muted transition-colors hover:text-gold"
          >
            ← Retour au dashboard
          </Link>
        </div>
      </main>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gold">{value}</p>
    </div>
  );
}
