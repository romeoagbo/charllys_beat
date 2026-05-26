export const AUDIO_CATEGORIES = [
  "Afrobeats",
  "Hip-Hop",
  "R&B",
  "Gospel",
  "Instrumental",
  "Voix & Acapella",
] as const;

export const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50 Mo
export const MAX_COVER_SIZE = 5 * 1024 * 1024; // 5 Mo

export const ACCEPTED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/x-wav",
  "audio/webm",
];

export const ACCEPTED_COVER_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const STORAGE_BUCKETS = {
  files: "audio-files",
  previews: "audio-previews",
  covers: "audio-covers",
} as const;
