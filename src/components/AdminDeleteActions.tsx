"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteAudioAsAdmin,
  deleteUserAsAdmin,
  updateUserRoleAsAdmin,
} from "@/app/dashboard/admin/actions";
import { Spinner } from "@/components/Spinner";
import type { UserRole } from "@/types/profile";

export function AdminDeleteAudioButton({
  audioId,
  title,
}: {
  audioId: string;
  title: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (
      !confirm(
        `Supprimer « ${title} » ? Le fichier et toutes les données associées seront effacés.`,
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    const result = await deleteAudioAsAdmin(audioId);
    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={loading}
        onClick={handleDelete}
        className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Spinner />
            Suppression...
          </>
        ) : (
          "Supprimer"
        )}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function AdminDeleteUserButton({
  userId,
  label,
  disabled = false,
}: {
  userId: string;
  label: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (
      !confirm(
        `Supprimer le compte « ${label} » ? Tous ses fichiers seront effacés. Action irréversible.`,
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    const result = await deleteUserAsAdmin(userId);
    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={loading || disabled}
        onClick={handleDelete}
        className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
      >
        {loading ? (
          <span className="inline-flex items-center gap-1.5">
            <Spinner />
            Suppression...
          </span>
        ) : disabled ? (
          "—"
        ) : (
          "Supprimer"
        )}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "user", label: "Artiste" },
  { value: "expert", label: "Expert" },
  { value: "admin", label: "Admin" },
];

export function AdminUserRoleSelect({
  userId,
  currentRole,
  disabled = false,
}: {
  userId: string;
  currentRole: UserRole;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(nextRole: UserRole) {
    if (nextRole === currentRole || disabled) return;

    setLoading(true);
    setError(null);

    const result = await updateUserRoleAsAdmin(userId, nextRole);
    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <div className="space-y-1">
      <div className="relative inline-flex items-center gap-2">
        <select
          value={currentRole}
          disabled={disabled || loading}
          onChange={(e) => void handleChange(e.target.value as UserRole)}
          className="rounded-lg border border-border bg-surface-elevated px-2 py-1.5 text-xs outline-none focus:border-gold disabled:opacity-50"
        >
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {loading && <Spinner />}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
