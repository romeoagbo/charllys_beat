import { AudioPlayerLazy } from "@/components/AudioPlayerLazy";
import type { Audio } from "@/types/audio";
import { createClient } from "@/lib/supabase/server";
import { STORAGE_BUCKETS } from "@/lib/constants";

type AudioCardProps = {
  audio: Audio;
  showActions?: boolean;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export async function AudioCard({ audio, showActions = false }: AudioCardProps) {
  const supabase = await createClient();
  const previewPath = audio.preview_path ?? audio.file_path;
  const bucket = audio.preview_path
    ? STORAGE_BUCKETS.previews
    : STORAGE_BUCKETS.files;

  const { data: previewUrl } = supabase.storage
    .from(bucket)
    .getPublicUrl(previewPath);

  let coverUrl: string | null = null;
  if (audio.cover_path) {
    const { data } = supabase.storage
      .from(STORAGE_BUCKETS.covers)
      .getPublicUrl(audio.cover_path);
    coverUrl = data.publicUrl;
  }

  return (
    <article className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-gold/30">
      <div className="flex gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-elevated text-2xl">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            "🎵"
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold">{audio.title}</h3>
              <p className="text-sm text-muted">
                {audio.profiles?.display_name ?? "Artiste"} · {audio.category} ·{" "}
                {formatDuration(audio.duration_seconds)}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-gold/10 px-3 py-1 text-sm font-medium text-gold">
              {formatPrice(audio.price_fcfa)}
            </span>
          </div>

          {audio.description && (
            <p className="mt-2 line-clamp-2 text-sm text-muted">
              {audio.description}
            </p>
          )}

          <div className="mt-4">
            <AudioPlayerLazy url={previewUrl.publicUrl} />
          </div>

          {showActions && (
            <p className="mt-3 text-xs text-muted">
              {audio.download_count} téléchargement
              {audio.download_count !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
