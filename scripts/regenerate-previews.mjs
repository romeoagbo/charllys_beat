import { readFileSync, mkdtempSync, writeFileSync, readFileSync as readSync, rmSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import { tmpdir } from "os";
import { createClient } from "@supabase/supabase-js";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";

const PREVIEW_RATIO = 0.2;
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  const envPath = resolve(root, ".env");
  const env = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
  return env;
}

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}
ffmpeg.setFfprobePath(ffprobeStatic.path);

function probeDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      const duration = metadata.format.duration;
      if (!duration || !Number.isFinite(duration)) {
        reject(new Error("Durée introuvable"));
        return;
      }
      resolve(duration);
    });
  });
}

function cutToMp3(inputPath, outputPath, durationSec) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(0)
      .setDuration(durationSec)
      .audioCodec("libmp3lame")
      .audioBitrate("128k")
      .format("mp3")
      .on("end", () => resolve())
      .on("error", reject)
      .save(outputPath);
  });
}

async function generatePreviewClip(inputBuffer, inputExt) {
  const workDir = mkdtempSync(join(tmpdir(), "regen-preview-"));
  const inputPath = join(workDir, `input.${inputExt}`);
  const outputPath = join(workDir, "preview.mp3");

  try {
    writeFileSync(inputPath, inputBuffer);
    const fullDuration = await probeDuration(inputPath);
    const clipDuration = Math.max(1, fullDuration * PREVIEW_RATIO);
    await cutToMp3(inputPath, outputPath, clipDuration);
    return readSync(outputPath);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

function extFromPath(path) {
  return path.split(".").pop()?.toLowerCase() ?? "mp3";
}

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: audios, error } = await supabase
    .from("audios")
    .select("id, title, file_path, preview_path")
    .eq("kind", "catalog")
    .not("file_path", "is", null);

  if (error) {
    console.error("Erreur DB:", error.message);
    process.exit(1);
  }

  if (!audios?.length) {
    console.log("Aucun audio catalogue à traiter.");
    return;
  }

  console.log(`${audios.length} audio(s) à régénérer...\n`);

  for (const audio of audios) {
    process.stdout.write(`→ ${audio.title} (${audio.id})... `);

    const { data: file, error: downloadError } = await supabase.storage
      .from("audio-files")
      .download(audio.file_path);

    if (downloadError || !file) {
      console.log(`ÉCHEC téléchargement: ${downloadError?.message ?? "inconnu"}`);
      continue;
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = extFromPath(audio.file_path);
    const newPreviewPath = audio.file_path.replace(/original\.[^.]+$/, "preview.mp3");

    try {
      const previewBuffer = await generatePreviewClip(buffer, ext);

      if (audio.preview_path && audio.preview_path !== newPreviewPath) {
        await supabase.storage.from("audio-previews").remove([audio.preview_path]);
      }

      const { error: uploadError } = await supabase.storage
        .from("audio-previews")
        .upload(newPreviewPath, previewBuffer, {
          upsert: true,
          contentType: "audio/mpeg",
        });

      if (uploadError) {
        console.log(`ÉCHEC upload: ${uploadError.message}`);
        continue;
      }

      if (audio.preview_path !== newPreviewPath) {
        await supabase
          .from("audios")
          .update({ preview_path: newPreviewPath })
          .eq("id", audio.id);
      }

      console.log("OK");
    } catch (err) {
      console.log(`ÉCHEC ffmpeg: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log("\nTerminé.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
