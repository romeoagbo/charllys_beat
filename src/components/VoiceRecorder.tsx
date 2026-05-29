"use client";

import { useEffect, useRef, useState } from "react";
import { Spinner } from "@/components/Spinner";

type VoiceRecorderProps = {
  onRecorded: (file: File) => void;
  onClear?: () => void;
  disabled?: boolean;
};

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VoiceRecorder({ onRecorded, onClear, disabled }: VoiceRecorderProps) {
  const [status, setStatus] = useState<"idle" | "requesting" | "recording" | "preview">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  async function startRecording() {
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Votre navigateur ne supporte pas l'enregistrement vocal.");
      return;
    }

    try {
      setStatus("requesting");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        stopStream();
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }

        const blob = new Blob(chunksRef.current, { type: mimeType.split(";")[0] });
        if (blob.size === 0) {
          setStatus("idle");
          setElapsed(0);
          return;
        }

        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setStatus("preview");

        const file = new File(
          [blob],
          `enregistrement-vocal-${Date.now()}.webm`,
          { type: blob.type },
        );
        onRecorded(file);
      };

      recorder.start();
      setStatus("recording");
      setElapsed(0);
      timerRef.current = window.setInterval(() => {
        setElapsed((value) => value + 1);
      }, 1000);
    } catch {
      stopStream();
      setStatus("idle");
      setError("Accès au micro refusé. Autorisez le micro dans votre navigateur.");
    }
  }

  function stopRecording() {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  }

  function discardRecording() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setStatus("idle");
    setElapsed(0);
    setError(null);
    onClear?.();
  }

  if (status === "requesting") {
    return (
      <div className="mt-6 inline-flex items-center gap-2 text-sm text-muted">
        <Spinner />
        Accès au micro...
      </div>
    );
  }

  if (status === "recording") {
    return (
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-center gap-2 text-sm text-red-400">
          <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
          Enregistrement · {formatElapsed(elapsed)}
        </div>
        <button
          type="button"
          onClick={stopRecording}
          className="rounded-full border border-red-500/40 px-5 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
        >
          Arrêter l&apos;enregistrement
        </button>
      </div>
    );
  }

  if (status === "preview" && previewUrl) {
    return (
      <div className="mt-6 space-y-3">
        <p className="text-sm text-gold">Enregistrement vocal prêt</p>
        <audio controls src={previewUrl} className="w-full" />
        <button
          type="button"
          onClick={discardRecording}
          disabled={disabled}
          className="text-sm text-muted transition-colors hover:text-foreground disabled:opacity-50"
        >
          Supprimer et réenregistrer
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-2">
      <p className="text-sm text-muted">ou</p>
      <button
        type="button"
        disabled={disabled}
        onClick={startRecording}
        className="rounded-full border border-gold/40 px-5 py-2 text-sm font-medium text-gold transition-colors hover:bg-gold/10 disabled:opacity-50"
      >
        Enregistrer une voix
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
