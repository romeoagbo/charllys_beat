"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { normalizePhone } from "@/lib/phone";
import { Button } from "@/components/Button";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === "register") {
      const normalizedPhone = normalizePhone(phone);

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { phone: normalizedPhone },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else {
        if (data.user) {
          await supabase
            .from("profiles")
            .update({ phone: normalizedPhone })
            .eq("id", data.user.id);
        }
        setMessage("Compte créé. Vérifiez votre email pour confirmer l'inscription.");
        setRegistered(true);
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

  if (mode === "register" && registered) {
    return (
      <div className="mx-auto w-full max-w-md text-center">
        <p className="text-5xl">✓</p>
        <h1 className="mt-4 text-3xl font-bold">
          Compte <span className="gold-gradient">créé</span>
        </h1>
        <p className="mt-4 rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
          {message}
        </p>
        <p className="mt-3 text-sm text-muted">
          Un email de confirmation vous a été envoyé à{" "}
          <span className="text-foreground">{email}</span>.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Button href="/login">Se connecter</Button>
          <Button href="/" variant="ghost">
            Retour à l&apos;accueil
          </Button>
        </div>
      </div>
    );
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

        {mode === "register" && (
          <div>
            <label htmlFor="phone" className="mb-1.5 block text-sm text-muted">
              Numéro de téléphone
            </label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground outline-none transition-colors focus:border-gold"
              placeholder="+228 90 00 00 00"
            />
          </div>
        )}

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

        {mode === "login" && (
          <p className="text-center text-sm text-muted">
            <Link href="/forgot-password" className="text-gold hover:underline">
              Mot de passe oublié ?
            </Link>
          </p>
        )}
      </form>

      <div className="mt-6 text-center">
        <Button href="/" variant="ghost">
          Retour à l&apos;accueil
        </Button>
      </div>
    </div>
  );
}
