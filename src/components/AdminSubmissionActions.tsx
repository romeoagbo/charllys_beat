"use client";

import { useState, useTransition } from "react";
import { submitSubmissionReview } from "@/app/dashboard/admin/actions";
import { Spinner } from "@/components/Spinner";

type AdminSubmissionActionsProps = {
  submissionId: string;
  status: string;
  existingFeedback?: string | null;
};

export function AdminSubmissionActions({
  submissionId,
  status,
  existingFeedback,
}: AdminSubmissionActionsProps) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState(existingFeedback ?? "");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(status !== "reviewed");

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result = await submitSubmissionReview(submissionId, feedback);
      if (result.error) {
        setError(result.error);
      } else {
        setEditing(false);
      }
    });
  };

  if (status === "reviewed" && !editing && existingFeedback) {
    return (
      <div className="w-full space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-gold">
          Avis publié
        </p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">
          {existingFeedback}
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs text-gold hover:underline"
        >
          Modifier l&apos;avis
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wide text-gold">
          Votre avis sur la maquette
        </span>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={4}
          placeholder="Points forts, axes d'amélioration, conseils mixage, etc."
          className="mt-2 w-full resize-y rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/30"
        />
      </label>
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={handleSubmit}
          className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-medium text-gold transition-colors hover:bg-gold/20 disabled:opacity-50"
        >
          {pending && <Spinner />}
          {pending
            ? "Publication..."
            : status === "reviewed"
              ? "Mettre à jour l'avis"
              : "Publier l'avis"}
        </button>
        {status === "reviewed" && (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setFeedback(existingFeedback ?? "");
              setEditing(false);
              setError(null);
            }}
            className="rounded-full px-4 py-1.5 text-xs text-muted transition-colors hover:text-foreground disabled:opacity-50"
          >
            Annuler
          </button>
        )}
      </div>
    </div>
  );
}
