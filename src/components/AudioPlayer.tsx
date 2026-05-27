"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";

type AudioPlayerProps = {
  url: string;
  height?: number;
  /** Limite la lecture à une fraction de la durée (ex. 0.2 = 20 %). */
  maxPreviewRatio?: number;
};

export function AudioPlayer({
  url,
  height = 64,
  maxPreviewRatio,
}: AudioPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const maxPreviewRatioRef = useRef(maxPreviewRatio);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [previewLimitReached, setPreviewLimitReached] = useState(false);

  maxPreviewRatioRef.current = maxPreviewRatio;

  useEffect(() => {
    if (!containerRef.current) return;

    setPreviewLimitReached(false);
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

    function getMaxPreviewTime() {
      const ratio = maxPreviewRatioRef.current;
      if (!ratio) return null;
      const duration = ws.getDuration();
      if (!duration || !Number.isFinite(duration)) return null;
      return duration * ratio;
    }

    function clampToPreviewLimit() {
      const maxTime = getMaxPreviewTime();
      if (maxTime === null) return;

      const current = ws.getCurrentTime();
      if (current > maxTime) {
        ws.setTime(maxTime);
      }
      if (current >= maxTime - 0.05) {
        ws.pause();
        setPreviewLimitReached(true);
        setPlaying(false);
      }
    }

    ws.on("ready", () => setReady(true));
    ws.on("play", () => {
      setPlaying(true);
      const maxTime = getMaxPreviewTime();
      if (maxTime !== null && ws.getCurrentTime() >= maxTime - 0.05) {
        ws.setTime(0);
        setPreviewLimitReached(false);
      }
    });
    ws.on("pause", () => setPlaying(false));
    ws.on("finish", () => setPlaying(false));
    ws.on("timeupdate", clampToPreviewLimit);
    ws.on("interaction", () => {
      requestAnimationFrame(clampToPreviewLimit);
    });

    return () => {
      ws.destroy();
      wavesurferRef.current = null;
    };
  }, [url, height, maxPreviewRatio]);

  function togglePlay() {
    const ws = wavesurferRef.current;
    if (!ws) return;

    const maxTime =
      maxPreviewRatio !== undefined
        ? ws.getDuration() * maxPreviewRatio
        : null;

    if (
      maxTime !== null &&
      !ws.isPlaying() &&
      ws.getCurrentTime() >= maxTime - 0.05
    ) {
      ws.setTime(0);
      setPreviewLimitReached(false);
    }

    ws.playPause();
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
      {maxPreviewRatio !== undefined && (
        <p className="text-xs text-muted">
          {previewLimitReached
            ? "Extrait terminé · Achetez pour écouter le morceau en entier."
            : `Extrait · ${Math.round(maxPreviewRatio * 100)} % du morceau`}
        </p>
      )}
    </div>
  );
}
