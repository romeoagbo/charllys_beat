"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/Button";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === "register") {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else {
        setMessage("Compte créé. Vérifiez votre email pour confirmer l'inscription.");
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    }

    setLoading(false);
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="text-center text-3xl font-bold">
        {mode === "login" ? "Connexion" : "Inscription"}
      </h1>
      <p className="mt-2 text-center text-sm text-muted">
        {mode === "login" ? (
          <>
            Pas encore de compte ?{" "}
            <Link href="/register" className="text-gold hover:underline">
              S&apos;inscrire
            </Link>
          </>
        ) : (
          <>
            Déjà inscrit ?{" "}
            <Link href="/login" className="text-gold hover:underline">
              Se connecter
            </Link>
          </>
        )}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm text-muted">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground outline-none transition-colors focus:border-gold"
            placeholder="vous@exemple.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm text-muted">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground outline-none transition-colors focus:border-gold"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-gold py-3 font-semibold text-black transition-colors hover:bg-gold-light disabled:opacity-50"
        >
          {loading
            ? "Chargement..."
            : mode === "login"
              ? "Se connecter"
              : "Créer mon compte"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Button href="/" variant="ghost">
          Retour à l&apos;accueil
        </Button>
      </div>
    </div>
  );
}
