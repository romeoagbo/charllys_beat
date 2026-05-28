import { NextResponse } from "next/server";
import {
  ACCEPTED_COVER_TYPES,
  AUDIO_CATEGORIES,
  isAcceptedAudioType,
  MAX_AUDIO_SIZE,
  MAX_COVER_SIZE,
  STORAGE_BUCKETS,
} from "@/lib/constants";
import { generatePreviewClip } from "@/lib/audio-preview";
import { getProfile, isAdmin } from "@/lib/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { AudioInsert } from "@/types/audio";

export const runtime = "nodejs";
export const maxDuration = 120;

function getExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName) return fromName;
  if (file.type === "audio/mpeg") return "mp3";
  if (file.type.includes("wav")) return "wav";
  if (file.type === "audio/ogg") return "ogg";
  return "audio";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const profile = await getProfile(user.id);
  if (!profile || !isAdmin(profile.role)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const audioFile = formData.get("audio");
  if (!(audioFile instanceof File)) {
    return NextResponse.json(
      { error: "Fichier audio manquant." },
      { status: 400 },
    );
  }

  if (!isAcceptedAudioType(audioFile.type)) {
    return NextResponse.json(
      { error: "Format non supporté. Utilisez MP3, WAV ou OGG." },
      { status: 400 },
    );
  }

  if (audioFile.size > MAX_AUDIO_SIZE) {
    return NextResponse.json(
      { error: "Fichier trop volumineux (max 50 Mo)." },
      { status: 400 },
    );
  }

  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "Titre requis." }, { status: 400 });
  }

  const category = String(formData.get("category") ?? "");
  if (!AUDIO_CATEGORIES.includes(category as (typeof AUDIO_CATEGORIES)[number])) {
    return NextResponse.json({ error: "Catégorie invalide." }, { status: 400 });
  }

  const priceRaw = Number(formData.get("price"));
  if (!Number.isFinite(priceRaw) || priceRaw < 0) {
    return NextResponse.json({ error: "Prix invalide." }, { status: 400 });
  }

  const description = String(formData.get("description") ?? "").trim();
  const durationRaw = formData.get("durationSeconds");
  const durationSeconds =
    durationRaw !== null && durationRaw !== ""
      ? Number(durationRaw)
      : null;

  const coverField = formData.get("cover");
  const coverFile = coverField instanceof File && coverField.size > 0 ? coverField : null;

  if (coverFile) {
    if (!ACCEPTED_COVER_TYPES.includes(coverFile.type)) {
      return NextResponse.json(
        { error: "Cover : JPG, PNG ou WebP uniquement." },
        { status: 400 },
      );
    }
    if (coverFile.size > MAX_COVER_SIZE) {
      return NextResponse.json(
        { error: "Cover trop volumineuse (max 5 Mo)." },
        { status: 400 },
      );
    }
  }

  const admin = createAdminClient();
  const audioId = crypto.randomUUID();
  const ext = getExtension(audioFile);
  const filePath = `${user.id}/${audioId}/original.${ext}`;
  const previewPath = `${user.id}/${audioId}/preview.mp3`;

  const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

  const { error: fileError } = await admin.storage
    .from(STORAGE_BUCKETS.files)
    .upload(filePath, audioBuffer, {
      upsert: false,
      contentType: audioFile.type,
    });

  if (fileError) {
    return NextResponse.json({ error: fileError.message }, { status: 500 });
  }

  let fullDuration: number;
  try {
    const preview = await generatePreviewClip(audioBuffer, ext);
    fullDuration = preview.fullDurationSeconds;

    const { error: previewError } = await admin.storage
      .from(STORAGE_BUCKETS.previews)
      .upload(previewPath, preview.buffer, {
        upsert: false,
        contentType: "audio/mpeg",
      });

    if (previewError) {
      await admin.storage.from(STORAGE_BUCKETS.files).remove([filePath]);
      return NextResponse.json({ error: previewError.message }, { status: 500 });
    }
  } catch (err) {
    await admin.storage.from(STORAGE_BUCKETS.files).remove([filePath]);
    const message =
      err instanceof Error ? err.message : "Génération de l'extrait impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  let coverPath: string | null = null;
  if (coverFile) {
    coverPath = `${user.id}/${audioId}/cover.${coverFile.name.split(".").pop()?.toLowerCase() ?? "jpg"}`;
    const { error: coverError } = await admin.storage
      .from(STORAGE_BUCKETS.covers)
      .upload(coverPath, coverFile, {
        upsert: false,
        contentType: coverFile.type,
      });

    if (coverError) {
      await admin.storage.from(STORAGE_BUCKETS.files).remove([filePath]);
      await admin.storage.from(STORAGE_BUCKETS.previews).remove([previewPath]);
      return NextResponse.json({ error: coverError.message }, { status: 500 });
    }
  }

  const row: AudioInsert = {
    id: audioId,
    user_id: user.id,
    title,
    description: description || null,
    category,
    price_fcfa: priceRaw,
    file_path: filePath,
    preview_path: previewPath,
    cover_path: coverPath,
    file_size: audioFile.size,
    mime_type: audioFile.type,
    duration_seconds:
      durationSeconds !== null && Number.isFinite(durationSeconds)
        ? durationSeconds
        : fullDuration,
    kind: "catalog",
    status: "published",
  };

  const { error: insertError } = await admin.from("audios").insert(row);
  if (insertError) {
    await admin.storage.from(STORAGE_BUCKETS.files).remove([filePath]);
    await admin.storage.from(STORAGE_BUCKETS.previews).remove([previewPath]);
    if (coverPath) {
      await admin.storage.from(STORAGE_BUCKETS.covers).remove([coverPath]);
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ id: audioId });
}
