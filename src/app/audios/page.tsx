import { Header } from "@/components/Header";
import { AudioCard } from "@/components/AudioCard";
import { createClient } from "@/lib/supabase/server";
import { getApprovedAudioIds } from "@/lib/purchases";
import type { Audio } from "@/types/audio";

type AudiosPageProps = {
  searchParams: Promise<{ category?: string }>;
};

export default async function AudiosPage({ searchParams }: AudiosPageProps) {
  const { category } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("audios")
    .select("*, profiles!audios_profile_fkey(display_name)")
    .eq("kind", "catalog")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const [{ data: audios, error }, purchasedIds] = await Promise.all([
    query,
    user ? getApprovedAudioIds(user.id) : Promise.resolve(new Set<string>()),
  ]);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-24">
        <h1 className="text-3xl font-bold">
          {category ? (
            <>
              Catégorie : <span className="gold-gradient">{category}</span>
            </>
          ) : (
            <>
              Explorer les <span className="gold-gradient">audios</span>
            </>
          )}
        </h1>
        <p className="mt-2 text-muted">
          Écoutez les extraits et achetez vos sons préférés.
        </p>

        {error && (
          <p className="mt-8 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            Impossible de charger les audios. Vérifiez que le schéma Supabase est
            configuré (<code className="text-red-300">npm run setup:supabase</code>
            ).
          </p>
        )}

        {!error && (!audios || audios.length === 0) && (
          <div className="mt-12 rounded-2xl border border-border bg-surface p-12 text-center">
            <p className="text-4xl">🎧</p>
            <p className="mt-4 text-lg font-medium">Aucun audio pour le moment</p>
            <p className="mt-2 text-muted">
              Soyez le premier à publier sur la plateforme.
            </p>
          </div>
        )}

        <div className="mt-8 space-y-4">
          {(audios as Audio[] | null)?.map((audio) => (
            <AudioCard
              key={audio.id}
              audio={audio}
              showPurchase
              purchased={purchasedIds.has(audio.id)}
              isLoggedIn={Boolean(user)}
            />
          ))}
        </div>
      </main>
    </>
  );
}
