import { Header } from "@/components/Header";
import { AuthForm } from "@/components/AuthForm";

export default function RegisterPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 items-center justify-center px-6 py-24">
        <AuthForm mode="register" />
      </main>
    </>
  );
}
