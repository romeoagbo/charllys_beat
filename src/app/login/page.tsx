import { Header } from "@/components/Header";
import { AuthForm } from "@/components/AuthForm";

type LoginPageProps = {
  searchParams: Promise<{ reset?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { reset, error } = await searchParams;

  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
        {reset === "success" && (
          <p className="mb-6 w-full max-w-md rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-center text-sm text-gold">
            Mot de passe mis à jour. Vous pouvez vous connecter.
          </p>
        )}
        {error === "auth" && (
          <p className="mb-6 w-full max-w-md rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400">
            Lien invalide ou expiré. Demandez un nouveau lien de réinitialisation.
          </p>
        )}
        <AuthForm mode="login" />
      </main>
    </>
  );
}
