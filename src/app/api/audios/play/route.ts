import { NextResponse } from "next/server";
import { STORAGE_BUCKETS } from "@/lib/constants";
import { hasApprovedPurchase } from "@/lib/purchases";
import { getProfile, isAdmin } from "@/lib/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function parseRange(
  rangeHeader: string | null,
  total: number,
): { start: number; end: number } | null {
  if (!rangeHeader || !rangeHeader.startsWith("bytes=")) return null;

  const [startStr, endStr] = rangeHeader.replace("bytes=", "").split("-");
  const start = Number(startStr);
  const end = endStr ? Number(endStr) : total - 1;

  if (!Number.isFinite(start) || start < 0 || start >= total) return null;
  if (!Number.isFinite(end) || end < start) return null;

  return { start, end: Math.min(end, total - 1) };
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

  const admin = createAdminClient();
  const { data: audio, error: audioError } = await admin
    .from("audios")
    .select("file_path, mime_type, user_id, kind")
    .eq("id", audioId)
    .eq("kind", "catalog")
    .single();

  if (audioError || !audio?.file_path) {
    return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  const profile = await getProfile(user.id);
  const canPlayFull =
    Boolean(profile && isAdmin(profile.role)) ||
    audio.user_id === user.id ||
    (await hasApprovedPurchase(user.id, audioId));

  if (!canPlayFull) {
    return NextResponse.json(
      { error: "Achat requis pour écouter le morceau complet." },
      { status: 403 },
    );
  }

  const { data: file, error: downloadError } = await admin.storage
    .from(STORAGE_BUCKETS.files)
    .download(audio.file_path);

  if (downloadError || !file) {
    return NextResponse.json(
      { error: downloadError?.message ?? "Lecture indisponible." },
      { status: 500 },
    );
  }

  const buffer = new Uint8Array(await file.arrayBuffer());
  const total = buffer.byteLength;
  const range = parseRange(request.headers.get("range"), total);
  const contentType = audio.mime_type ?? "audio/mpeg";

  if (range) {
    const chunk = buffer.subarray(range.start, range.end + 1);
    return new NextResponse(chunk, {
      status: 206,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(chunk.byteLength),
        "Content-Range": `bytes ${range.start}-${range.end}/${total}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, no-store",
      },
    });
  }

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(total),
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, no-store",
    },
  });
}
