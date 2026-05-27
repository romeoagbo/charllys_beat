import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types/profile";

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return data as Profile | null;
}

export function isAdmin(role: UserRole) {
  return role === "admin";
}

export function isExpert(role: UserRole) {
  return role === "expert";
}

export function isRegularUser(role: UserRole) {
  return role === "user";
}
