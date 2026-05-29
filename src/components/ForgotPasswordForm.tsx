"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/Button";
import { SubmitButton } from "@/components/SubmitButton";

export function ForgotPasswordForm() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo },
    );

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="mx-auto w-full max-w-md text-center">
        <p className="text-5xl">✉️</p>
        <h1 className="mt-4 text-3xl font-bold">
          Email <span className="gold-gradient">envoyé</span>
        </h1>
        <p className="mt-4 rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
          Si un compte existe pour{" "}
          <span className="font-medium text-foreground">{email}</span>, vous
          recevrez un lien pour réinitialiser votre mot de passe.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Button href="/login">Retour à la connexion</Button>
          <Button href="/" variant="ghost">
            Accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="text-center text-3xl font-bold">Mot de passe oublié</h1>
      <p className="mt-2 text-center text-sm text-muted">
        Entrez votre email pour recevoir un lien de réinitialisation.
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
            autoComplete="email"
            disabled={loading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground outline-none transition-colors focus:border-gold disabled:opacity-50"
            placeholder="vous@exemple.com"
          />
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        )}

        <SubmitButton loading={loading} loadingLabel="Envoi...">
          Envoyer le lien
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/login" className="text-gold hover:underline">
          ← Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
