import { AudioPlayerLazy } from "@/components/AudioPlayerLazy";
import { BuyAudioButton } from "@/components/BuyAudioButton";
import type { Audio, AudioStatus } from "@/types/audio";
import { createClient } from "@/lib/supabase/server";
import { STORAGE_BUCKETS } from "@/lib/constants";

type AudioCardProps = {
  audio: Audio;
  showActions?: boolean;
  adminControls?: React.ReactNode;
  purchased?: boolean;
  isLoggedIn?: boolean;
  showPurchase?: boolean;
  isAdmin?: boolean;
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

function formatReviewDate(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

const submissionStatusLabels: Record<AudioStatus, string> = {
  pending: "En attente d'avis",
  reviewed: "Avis reçu",
  draft: "Brouillon",
  published: "Publié",
  archived: "Archivé",
};

export async function AudioCard({
  audio,
  showActions = false,
  adminControls,
  purchased = false,
  isLoggedIn = false,
  showPurchase = false,
  isAdmin = false,
}: AudioCardProps) {
  const isSubmission = audio.kind === "submission";
  const showStatusInHeader = isSubmission && !adminControls;
  const supabase = await createClient();

  const canPlayFull = purchased || isAdmin;
  const isCatalogPurchase = showPurchase && !isSubmission;

  let playbackUrl: string | null = null;
  if (!isSubmission && audio.preview_path) {
    if (canPlayFull) {
      playbackUrl = `/api/audios/play?audioId=${audio.id}`;
    } else {
      const { data } = supabase.storage
        .from(STORAGE_BUCKETS.previews)
        .getPublicUrl(audio.preview_path);
      playbackUrl = data.publicUrl;
    }
  }

  const showPreviewLabel = isCatalogPurchase && !canPlayFull;

  let submissionUrl: string | null = null;
  if (isSubmission && adminControls && audio.file_path) {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.files)
      .createSignedUrl(audio.file_path, 3600);
    if (!error && data?.signedUrl) {
      submissionUrl = data.signedUrl;
    }
  }

  let coverUrl: string | null = null;
  if (audio.cover_path) {
    const { data } = supabase.storage
      .from(STORAGE_BUCKETS.covers)
      .getPublicUrl(audio.cover_path);
    coverUrl = data.publicUrl;
  }

  const isCatalogPurchaseLayout = isCatalogPurchase;

  return (
    <article className="w-full rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-gold/30 sm:p-6">
      {isCatalogPurchaseLayout ? (
        <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch lg:gap-8">
          <div className="flex min-w-0 flex-1 gap-5">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-surface-elevated text-4xl sm:h-32 sm:w-32 lg:h-40 lg:w-40">
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
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold">{audio.title}</h3>
                  <p className="text-sm text-muted">
                    {audio.profiles?.display_name ?? "Artiste"} · {audio.category}{" "}
                    · {formatDuration(audio.duration_seconds)}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-gold/10 px-3 py-1 text-sm font-medium text-gold lg:hidden">
                  {formatPrice(audio.price_fcfa)}
                </span>
              </div>

              {audio.description && (
                <p className="mt-2 line-clamp-2 text-sm text-muted antialiased">
                  {audio.description}
                </p>
              )}

              {playbackUrl && (
                <div className="mt-4 w-full">
                  <AudioPlayerLazy url={playbackUrl} isPreview={showPreviewLabel} />
                </div>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col justify-center border-t border-border pt-4 lg:w-72 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <p className="hidden text-sm font-medium text-gold lg:block">
              {formatPrice(audio.price_fcfa)}
            </p>
            <div className="lg:mt-3">
              <BuyAudioButton
                audioId={audio.id}
                priceFcfa={audio.price_fcfa}
                purchased={purchased}
                isLoggedIn={isLoggedIn}
              />
            </div>
          </div>
        </div>
      ) : (
      <div className="flex gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-surface-elevated text-3xl sm:h-24 sm:w-24">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            isSubmission ? "🎙️" : "🎵"
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
            {showStatusInHeader ? (
              <span className="shrink-0 rounded-full bg-gold/10 px-3 py-1 text-xs font-medium text-gold antialiased">
                {submissionStatusLabels[audio.status]}
              </span>
            ) : !isSubmission ? (
              <span className="shrink-0 rounded-full bg-gold/10 px-3 py-1 text-sm font-medium text-gold">
                {formatPrice(audio.price_fcfa)}
              </span>
            ) : null}
          </div>

          {audio.description && (
            <p className="mt-2 line-clamp-2 text-sm text-muted antialiased">
              {audio.description}
            </p>
          )}

          {playbackUrl ? (
            <div className="mt-4">
              <AudioPlayerLazy url={playbackUrl} isPreview={showPreviewLabel} />
            </div>
          ) : submissionUrl ? (
            <div className="mt-4">
              <AudioPlayerLazy url={submissionUrl} />
            </div>
          ) : isSubmission ? (
            <p className="mt-4 text-sm text-muted antialiased">
              Fichier privé — accessible aux experts musicaux uniquement.
            </p>
          ) : null}

          {isSubmission &&
            audio.status === "reviewed" &&
            audio.review_feedback &&
            !adminControls && (
              <div className="mt-4 rounded-xl border border-gold/20 bg-gold/5 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gold">
                  Avis de l&apos;expert
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                  {audio.review_feedback}
                </p>
                {audio.reviewed_at && (
                  <p className="mt-2 text-xs text-muted">
                    Reçu le {formatReviewDate(audio.reviewed_at)}
                  </p>
                )}
              </div>
            )}

          {isSubmission && adminControls && (
            <div className="mt-4 space-y-4 border-t border-border pt-4">
              <span className="inline-block rounded-full bg-gold/10 px-3 py-1 text-xs font-medium text-gold antialiased">
                {submissionStatusLabels[audio.status]}
              </span>
              {adminControls}
            </div>
          )}

          {showPurchase && !isSubmission && (
            <div className="mt-4 border-t border-border pt-4">
              <BuyAudioButton
                audioId={audio.id}
                priceFcfa={audio.price_fcfa}
                purchased={purchased}
                isLoggedIn={isLoggedIn}
              />
            </div>
          )}

          {showActions && !isSubmission && (
            <p className="mt-3 text-xs text-muted">
              {audio.download_count} téléchargement
              {audio.download_count !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>
      )}
    </article>
  );
}
