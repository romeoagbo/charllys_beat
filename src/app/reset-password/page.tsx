import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { createClient } from "@/lib/supabase/server";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/forgot-password");
  }

  return (
    <>
      <Header />
      <main className="flex flex-1 items-center justify-center px-6 py-24">
        <ResetPasswordForm />
      </main>
    </>
  );
}
