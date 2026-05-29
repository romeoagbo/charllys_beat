import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile, isAdmin } from "@/lib/profile";

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getProfile(user.id);

  if (!profile || !isAdmin(profile.role)) {
    redirect("/dashboard");
  }

  return { user, profile };
}
