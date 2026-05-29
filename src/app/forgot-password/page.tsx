import { Header } from "@/components/Header";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 items-center justify-center px-6 py-24">
        <ForgotPasswordForm />
      </main>
    </>
  );
}
