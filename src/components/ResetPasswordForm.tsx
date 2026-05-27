"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/Button";

export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    router.push("/login?reset=success");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="text-center text-3xl font-bold">
        Nouveau <span className="gold-gradient">mot de passe</span>
      </h1>
      <p className="mt-2 text-center text-sm text-muted">
        Choisissez un nouveau mot de passe pour votre compte.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm text-muted">
            Nouveau mot de passe
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground outline-none transition-colors focus:border-gold"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1.5 block text-sm text-muted"
          >
            Confirmer le mot de passe
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground outline-none transition-colors focus:border-gold"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-gold py-3 font-semibold text-black transition-colors hover:bg-gold-light disabled:opacity-50"
        >
          {loading ? "Enregistrement..." : "Enregistrer le mot de passe"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Button href="/login" variant="ghost">
          Retour à la connexion
        </Button>
      </div>
    </div>
  );
}
