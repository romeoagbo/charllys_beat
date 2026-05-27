import { STORAGE_BUCKETS } from "@/lib/constants";
import type { SupabaseClient } from "@supabase/supabase-js";

type AudioPaths = {
  file_path: string;
  preview_path: string | null;
  cover_path: string | null;
};

export async function deleteAudioStorage(
  admin: SupabaseClient,
  audio: AudioPaths,
) {
  const removals: { bucket: string; paths: string[] }[] = [];

  if (audio.file_path) {
    removals.push({
      bucket: STORAGE_BUCKETS.files,
      paths: [audio.file_path],
    });
  }
  if (audio.preview_path) {
    removals.push({
      bucket: STORAGE_BUCKETS.previews,
      paths: [audio.preview_path],
    });
  }
  if (audio.cover_path) {
    removals.push({
      bucket: STORAGE_BUCKETS.covers,
      paths: [audio.cover_path],
    });
  }

  for (const { bucket, paths } of removals) {
    const { error } = await admin.storage.from(bucket).remove(paths);
    if (error) {
      throw new Error(error.message);
    }
  }
}

export async function deleteUserAudiosStorage(
  admin: SupabaseClient,
  userId: string,
) {
  const { data: audios, error } = await admin
    .from("audios")
    .select("file_path, preview_path, cover_path")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  for (const audio of audios ?? []) {
    await deleteAudioStorage(admin, audio);
  }
}
