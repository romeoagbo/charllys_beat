import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";
import { CATALOG_PREVIEW_RATIO } from "@/lib/constants";

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

ffmpeg.setFfprobePath(ffprobeStatic.path);

function probeDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      const duration = metadata.format.duration;
      if (!duration || !Number.isFinite(duration)) {
        reject(new Error("Durée audio introuvable."));
        return;
      }
      resolve(duration);
    });
  });
}

function cutToMp3(
  inputPath: string,
  outputPath: string,
  durationSec: number,
): Promise<void> {
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

export async function generatePreviewClip(
  inputBuffer: Buffer,
  inputExt: string,
  ratio: number = CATALOG_PREVIEW_RATIO,
): Promise<{ buffer: Buffer; clipDurationSeconds: number; fullDurationSeconds: number }> {
  const workDir = await mkdtemp(join(tmpdir(), "audio-preview-"));
  const inputPath = join(workDir, `input.${inputExt}`);
  const outputPath = join(workDir, "preview.mp3");

  try {
    await writeFile(inputPath, inputBuffer);
    const fullDuration = await probeDuration(inputPath);
    const clipDuration = Math.max(1, fullDuration * ratio);
    await cutToMp3(inputPath, outputPath, clipDuration);
    const buffer = await readFile(outputPath);
    return {
      buffer,
      clipDurationSeconds: clipDuration,
      fullDurationSeconds: fullDuration,
    };
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
