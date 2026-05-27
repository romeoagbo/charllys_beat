"use client";

import dynamic from "next/dynamic";

const AudioPlayer = dynamic(
  () => import("@/components/AudioPlayer").then((m) => m.AudioPlayer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-10 items-center gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-surface-elevated" />
        <div className="h-10 flex-1 animate-pulse rounded bg-surface-elevated" />
      </div>
    ),
  },
);

type AudioPlayerLazyProps = {
  url: string;
  maxPreviewRatio?: number;
};

export function AudioPlayerLazy({ url, maxPreviewRatio }: AudioPlayerLazyProps) {
  return <AudioPlayer url={url} maxPreviewRatio={maxPreviewRatio} />;
}
