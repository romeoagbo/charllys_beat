"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";

type AudioPlayerProps = {
  url: string;
  height?: number;
  /** Affiche le libellé « extrait » (fichier déjà coupé côté serveur). */
  isPreview?: boolean;
};

export function AudioPlayer({ url, height = 64, isPreview = false }: AudioPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    setReady(false);
    setPlaying(false);

    const ws = WaveSurfer.create({
      container: containerRef.current,
      url,
      height,
      waveColor: "#525252",
      progressColor: "#d4af37",
      cursorColor: "#f0d060",
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      normalize: true,
    });

    wavesurferRef.current = ws;

    ws.on("ready", () => setReady(true));
    ws.on("play", () => setPlaying(true));
    ws.on("pause", () => setPlaying(false));
    ws.on("finish", () => setPlaying(false));

    return () => {
      ws.destroy();
      wavesurferRef.current = null;
    };
  }, [url, height]);

  function togglePlay() {
    wavesurferRef.current?.playPause();
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          disabled={!ready}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold text-black transition-colors hover:bg-gold-light disabled:opacity-40"
          aria-label={playing ? "Pause" : "Lecture"}
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <div ref={containerRef} className="min-w-0 flex-1" />
      </div>
      {isPreview && (
        <p className="text-xs text-muted">
          Extrait · Achetez pour écouter le morceau en entier.
        </p>
      )}
    </div>
  );
}
