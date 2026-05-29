"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ACCEPTED_AUDIO_TYPES,
  AUDIO_CATEGORIES,
  MAX_AUDIO_SIZE,
} from "@/lib/constants";
import { SubmitButton } from "@/components/SubmitButton";

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

export function UploadForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(AUDIO_CATEGORIES[0]);
  const [price, setPrice] = useState(1000);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  const validateAudio = useCallback((file: File) => {
    if (!ACCEPTED_AUDIO_TYPES.includes(file.type)) {
      return "Format non supporté. Utilisez MP3, WAV ou OGG.";
    }
    if (file.size > MAX_AUDIO_SIZE) {
      return "Fichier trop volumineux (max 50 Mo).";
    }
    return null;
  }, []);

  const handleAudioSelect = useCallback(
    (file: File) => {
      const err = validateAudio(file);
      if (err) {
        setError(err);
        return;
      }
      setError(null);
      setAudioFile(file);
    },
    [validateAudio],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleAudioSelect(file);
    },
    [handleAudioSelect],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!audioFile) {
      setError("Sélectionnez un fichier audio.");
      return;
    }

    setLoading(true);
    setError(null);
    setProgress("Préparation...");

    try {
      const duration = await getAudioDuration(audioFile);

      const formData = new FormData();
      formData.append("audio", audioFile);
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("category", category);
      formData.append("price", String(price));
      if (duration !== null) {
        formData.append("durationSeconds", String(duration));
      }
      if (coverFile) {
        formData.append("cover", coverFile);
      }

      setProgress("Upload et génération de l'extrait (20 %)...");
      const response = await fetch("/api/audios/upload", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Erreur lors de l'upload.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload.");
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
        onDrop={onDrop}
        className={`rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
          dragging ? "border-gold bg-gold/5" : "border-border bg-surface"
        }`}
      >
        <p className="text-4xl">🎵</p>
        <p className="mt-3 font-medium">
          Glissez votre audio ici ou{" "}
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
        <p className="mt-2 text-sm text-muted">MP3, WAV, OGG — max 50 Mo</p>
        {audioFile && (
          <p className="mt-4 rounded-lg bg-surface-elevated px-4 py-2 text-sm text-gold">
            {audioFile.name} ({(audioFile.size / (1024 * 1024)).toFixed(1)} Mo)
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="title" className="mb-1.5 block text-sm text-muted">
            Titre *
          </label>
          <input
            id="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-gold"
            placeholder="Mon beat Afrobeats"
          />
        </div>

        <div>
          <label htmlFor="category" className="mb-1.5 block text-sm text-muted">
            Catégorie *
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
          <label htmlFor="price" className="mb-1.5 block text-sm text-muted">
            Prix (FCFA) *
          </label>
          <input
            id="price"
            type="number"
            required
            min={0}
            step={100}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-gold"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="description" className="mb-1.5 block text-sm text-muted">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-gold"
            placeholder="Décrivez votre création..."
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="cover" className="mb-1.5 block text-sm text-muted">
            Cover (optionnel)
          </label>
          <input
            id="cover"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-gold file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}
      {progress && (
        <p className="text-sm text-gold">{progress}</p>
      )}

      <SubmitButton
        loading={loading}
        loadingLabel="Publication..."
        disabled={!audioFile}
      >
        Publier l&apos;audio
      </SubmitButton>
    </form>
  );
}
