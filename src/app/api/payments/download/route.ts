import { NextResponse } from "next/server";
import { STORAGE_BUCKETS } from "@/lib/constants";
import { hasApprovedPurchase } from "@/lib/purchases";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function downloadFilename(title: string, mimeType: string | null) {
  const base =
    title
      .replace(/[^\w\s.-]/g, "")
      .trim()
      .replace(/\s+/g, " ") || "audio";
  if (mimeType?.includes("wav")) return `${base}.wav`;
  if (mimeType?.includes("ogg")) return `${base}.ogg`;
  if (mimeType?.includes("webm")) return `${base}.webm`;
  return `${base}.mp3`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const audioId = searchParams.get("audioId");

  if (!audioId) {
    return NextResponse.json({ error: "Audio manquant." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  if (!(await hasApprovedPurchase(user.id, audioId))) {
    return NextResponse.json(
      { error: "Achat non confirmé pour cet audio." },
      { status: 403 },
    );
  }

  const admin = createAdminClient();
  const { data: audio, error: audioError } = await admin
    .from("audios")
    .select("file_path, title, mime_type")
    .eq("id", audioId)
    .eq("kind", "catalog")
    .single();

  if (audioError || !audio?.file_path) {
    return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  const { data: file, error: downloadError } = await admin.storage
    .from(STORAGE_BUCKETS.files)
    .download(audio.file_path);

  if (downloadError || !file) {
    return NextResponse.json(
      { error: downloadError?.message ?? "Téléchargement indisponible." },
      { status: 500 },
    );
  }

  const { data: current } = await admin
    .from("audios")
    .select("download_count")
    .eq("id", audioId)
    .single();

  await admin
    .from("audios")
    .update({ download_count: (current?.download_count ?? 0) + 1 })
    .eq("id", audioId);

  const filename = downloadFilename(audio.title, audio.mime_type);
  const buffer = await file.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": audio.mime_type ?? "audio/mpeg",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
