export type UserRole = "admin" | "user" | "expert";

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
};
