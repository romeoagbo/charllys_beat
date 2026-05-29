export type AudioKind = "catalog" | "submission";

export type AudioStatus =
  | "draft"
  | "published"
  | "archived"
  | "pending"
  | "reviewed";

export type Audio = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  price_fcfa: number;
  duration_seconds: number | null;
  file_path: string;
  preview_path: string | null;
  cover_path: string | null;
  file_size: number | null;
  mime_type: string | null;
  kind: AudioKind;
  status: AudioStatus;
  download_count: number;
  review_feedback: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    display_name: string | null;
  } | null;
};

export type AudioInsert = Pick<
  Audio,
  | "id"
  | "user_id"
  | "title"
  | "description"
  | "category"
  | "price_fcfa"
  | "file_path"
  | "preview_path"
  | "cover_path"
  | "file_size"
  | "mime_type"
  | "duration_seconds"
  | "kind"
  | "status"
>;
