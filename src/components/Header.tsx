import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profile";
import { HeaderNav, type HeaderUser } from "@/components/HeaderNav";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let headerUser: HeaderUser | null = null;

  if (user) {
    const profile = await getProfile(user.id);
    headerUser = {
      email: user.email,
      displayName: profile?.display_name ?? null,
      role: profile?.role ?? "user",
    };
  }

  return <HeaderNav user={headerUser} />;
}
