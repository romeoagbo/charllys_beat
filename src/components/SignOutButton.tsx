"use client";

import { useState } from "react";
import { Spinner } from "@/components/Spinner";

type SignOutButtonProps = {
  className?: string;
};

export function SignOutButton({
  className = "rounded-full px-4 py-2 text-sm text-muted transition-colors hover:text-foreground disabled:opacity-50",
}: SignOutButtonProps) {
  const [loading, setLoading] = useState(false);

  return (
    <form action="/auth/signout" method="post" onSubmit={() => setLoading(true)}>
      <button
        type="submit"
        disabled={loading}
        className={`inline-flex items-center gap-2 ${className}`}
      >
        {loading && <Spinner />}
        {loading ? "Déconnexion..." : "Déconnexion"}
      </button>
    </form>
  );
}
