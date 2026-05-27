"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ACCEPTED_AUDIO_TYPES,
  ACCEPTED_COVER_TYPES,
  AUDIO_CATEGORIES,
  MAX_AUDIO_SIZE,
  MAX_COVER_SIZE,
  STORAGE_BUCKETS,
} from "@/lib/constants";
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

export function UploadForm({ userId }: { userId: string }) {
  const router = useRouter();
  const supabase = createClient();

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
      const audioId = crypto.randomUUID();
      const ext = getExtension(audioFile);
      const filePath = `${userId}/${audioId}/original.${ext}`;
      const previewPath = `${userId}/${audioId}/preview.${ext}`;

      setProgress("Upload du fichier audio...");
      const { error: fileError } = await supabase.storage
        .from(STORAGE_BUCKETS.files)
        .upload(filePath, audioFile, { upsert: false, contentType: audioFile.type });

      if (fileError) throw new Error(fileError.message);

      setProgress("Upload de l'extrait...");
      const { error: previewError } = await supabase.storage
        .from(STORAGE_BUCKETS.previews)
        .upload(previewPath, audioFile, { upsert: false, contentType: audioFile.type });

      if (previewError) throw new Error(previewError.message);

      let coverPath: string | null = null;
      if (coverFile) {
        if (!ACCEPTED_COVER_TYPES.includes(coverFile.type)) {
          throw new Error("Cover : JPG, PNG ou WebP uniquement.");
        }
        if (coverFile.size > MAX_COVER_SIZE) {
          throw new Error("Cover trop volumineuse (max 5 Mo).");
        }
        coverPath = `${userId}/${audioId}/cover.${coverFile.name.split(".").pop()?.toLowerCase() ?? "jpg"}`;
        setProgress("Upload de la cover...");
        const { error: coverError } = await supabase.storage
          .from(STORAGE_BUCKETS.covers)
          .upload(coverPath, coverFile, { upsert: false, contentType: coverFile.type });
        if (coverError) throw new Error(coverError.message);
      }

      const duration = await getAudioDuration(audioFile);

      setProgress("Enregistrement en base...");
      const row: AudioInsert = {
        id: audioId,
        user_id: userId,
        title: title.trim(),
        description: description.trim() || null,
        category,
        price_fcfa: price,
        file_path: filePath,
        preview_path: previewPath,
        cover_path: coverPath,
        file_size: audioFile.size,
        mime_type: audioFile.type,
        duration_seconds: duration,
        kind: "catalog",
        status: "published",
      };

      const { error: insertError } = await supabase.from("audios").insert(row);
      if (insertError) throw new Error(insertError.message);

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

      <button
        type="submit"
        disabled={loading || !audioFile}
        className="w-full rounded-full bg-gold py-3 font-semibold text-black transition-colors hover:bg-gold-light disabled:opacity-50"
      >
        {loading ? "Publication..." : "Publier l'audio"}
      </button>
    </form>
  );
}
