"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ACCEPTED_AUDIO_TYPES,
  AUDIO_CATEGORIES,
  isAcceptedAudioType,
  MAX_AUDIO_SIZE,
  STORAGE_BUCKETS,
} from "@/lib/constants";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { SubmitButton } from "@/components/SubmitButton";
import type { AudioInsert } from "@/types/audio";

function getExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName) return fromName;
  if (file.type === "audio/mpeg") return "mp3";
  if (file.type.includes("wav")) return "wav";
  if (file.type === "audio/ogg") return "ogg";
  return "audio";
}

function getAudioDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.addEventListener("loadedmetadata", () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(audio.duration) ? audio.duration : null);
    });
    audio.addEventListener("error", () => {
      URL.revokeObjectURL(url);
      resolve(null);
    });
  });
}

export function SubmitToExpertForm({ userId }: { userId: string }) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(AUDIO_CATEGORIES[0]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioSource, setAudioSource] = useState<"file" | "recording" | null>(
    null,
  );
  const [recorderKey, setRecorderKey] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  const validateAudio = useCallback((file: File) => {
    if (!isAcceptedAudioType(file.type)) {
      return "Format non supporté. Utilisez MP3, WAV, OGG ou enregistrez une voix.";
    }
    if (file.size > MAX_AUDIO_SIZE) {
      return "Fichier trop volumineux (max 50 Mo).";
    }
    return null;
  }, []);

  const handleAudioSelect = useCallback(
    (file: File, source: "file" | "recording" = "file") => {
      const err = validateAudio(file);
      if (err) {
        setError(err);
        return;
      }
      setError(null);
      setAudioFile(file);
      setAudioSource(source);
      if (source === "file") {
        setRecorderKey((key) => key + 1);
      }
    },
    [validateAudio],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!audioFile) {
      setError("Sélectionnez un fichier audio.");
      return;
    }

    setLoading(true);
    setError(null);
    setProgress("Envoi en cours...");

    try {
      const audioId = crypto.randomUUID();
      const ext = getExtension(audioFile);
      const filePath = `${userId}/${audioId}/submission.${ext}`;

      const { error: fileError } = await supabase.storage
        .from(STORAGE_BUCKETS.files)
        .upload(filePath, audioFile, { upsert: false, contentType: audioFile.type });

      if (fileError) throw new Error(fileError.message);

      const duration = await getAudioDuration(audioFile);

      const row: AudioInsert = {
        id: audioId,
        user_id: userId,
        title: title.trim(),
        description: description.trim() || null,
        category,
        price_fcfa: 0,
        file_path: filePath,
        preview_path: null,
        cover_path: null,
        file_size: audioFile.size,
        mime_type: audioFile.type,
        duration_seconds: duration,
        kind: "submission",
        status: "pending",
      };

      const { error: insertError } = await supabase.from("audios").insert(row);
      if (insertError) throw new Error(insertError.message);

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi.");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleAudioSelect(file);
        }}
        className={`rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
          dragging ? "border-gold bg-gold/5" : "border-border bg-surface"
        }`}
      >
        <p className="text-4xl">🎙️</p>
        <p className="mt-3 font-medium">
          Glissez votre maquette ici ou{" "}
          <label className="cursor-pointer text-gold hover:underline">
            parcourez
            <input
              type="file"
              accept=".mp3,.wav,.ogg,audio/mpeg,audio/wav,audio/ogg"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAudioSelect(file);
              }}
            />
          </label>
        </p>
        <p className="mt-2 text-sm text-muted">
          Uploadez un fichier ou enregistrez directement votre voix depuis le
          navigateur.
        </p>
        <VoiceRecorder
          key={recorderKey}
          disabled={loading}
          onRecorded={(file) => handleAudioSelect(file, "recording")}
          onClear={() => {
            setAudioFile(null);
            setAudioSource(null);
          }}
        />
        {audioFile && (
          <p className="mt-4 rounded-lg bg-surface-elevated px-4 py-2 text-sm text-gold">
            {audioSource === "recording" ? "Enregistrement vocal" : audioFile.name}{" "}
            ({(audioFile.size / (1024 * 1024)).toFixed(1)} Mo)
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="mb-1.5 block text-sm text-muted">
            Titre de la maquette *
          </label>
          <input
            id="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-gold"
            placeholder="Ma maquette Afrobeats"
          />
        </div>

        <div>
          <label htmlFor="category" className="mb-1.5 block text-sm text-muted">
            Style musical *
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-gold"
          >
            {AUDIO_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className="mb-1.5 block text-sm text-muted">
            Message pour l&apos;expert
          </label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-gold"
            placeholder="Décrivez ce que vous attendez : avis, mixage, mastering..."
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}
      {progress && <p className="text-sm text-gold">{progress}</p>}

      <SubmitButton
        loading={loading}
        loadingLabel="Envoi..."
        disabled={!audioFile}
      >
        Envoyer aux experts
      </SubmitButton>
    </form>
  );
}
