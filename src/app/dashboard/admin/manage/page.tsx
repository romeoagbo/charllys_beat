import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import {
  AdminDeleteAudioButton,
  AdminDeleteUserButton,
  AdminUserRoleSelect,
} from "@/components/AdminDeleteActions";
import { requireAdmin } from "@/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/types/profile";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} Ko`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function kindLabel(kind: string) {
  return kind === "submission" ? "Envoi expert" : "Catalogue";
}

function getOwnerName(
  profiles: { display_name: string | null } | { display_name: string | null }[] | null,
) {
  if (!profiles) return "—";
  if (Array.isArray(profiles)) {
    return profiles[0]?.display_name ?? "—";
  }
  return profiles.display_name ?? "—";
}

export default async function AdminManagePage() {
  const { user: currentUser, profile } = await requireAdmin();
  const admin = createAdminClient();

  const [{ data: profiles }, { data: authData }, { data: audios }] =
    await Promise.all([
      admin.from("profiles").select("*").order("created_at", { ascending: false }),
      admin.auth.admin.listUsers({ perPage: 1000 }),
      admin
        .from("audios")
        .select(
          "id, title, kind, status, file_size, mime_type, created_at, user_id, profiles!audios_profile_fkey(display_name)",
        )
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

  const emailById = new Map(
    (authData?.users ?? []).map((authUser) => [authUser.id, authUser.email ?? ""]),
  );

  const audioCountByUser = new Map<string, number>();
  for (const audio of audios ?? []) {
    audioCountByUser.set(
      audio.user_id,
      (audioCountByUser.get(audio.user_id) ?? 0) + 1,
    );
  }

  const users = (profiles ?? []).map((entry) => ({
    id: entry.id,
    email: emailById.get(entry.id) ?? "—",
    displayName: entry.display_name,
    phone: entry.phone,
    role: entry.role as UserRole,
    createdAt: entry.created_at,
    audioCount: audioCountByUser.get(entry.id) ?? 0,
  }));

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-24">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-gold">
              Administration
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              Utilisateurs & <span className="gold-gradient">fichiers</span>
            </h1>
            <p className="mt-2 text-muted">
              {profile.display_name} — gérez les comptes, les rôles et les
              fichiers uploadés.
            </p>
          </div>
          <Button href="/dashboard/admin" variant="secondary">
            ← Panel admin
          </Button>
        </div>

        <section className="mt-12">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Utilisateurs</h2>
            <span className="text-sm text-muted">{users.length} compte(s)</span>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Nom</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Téléphone</th>
                  <th className="px-4 py-3 font-medium">Rôle</th>
                  <th className="px-4 py-3 font-medium">Fichiers</th>
                  <th className="px-4 py-3 font-medium">Inscription</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((entry) => {
                  const isSelf = entry.id === currentUser.id;
                  const isOtherAdmin = entry.role === "admin" && !isSelf;

                  return (
                    <tr
                      key={entry.id}
                      className="border-b border-border/60 last:border-0"
                    >
                      <td className="px-4 py-3">
                        {entry.displayName ?? "—"}
                        {isSelf && (
                          <span className="ml-2 text-xs text-gold">(vous)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted">{entry.email}</td>
                      <td className="px-4 py-3 text-muted">
                        {entry.phone ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <AdminUserRoleSelect
                          userId={entry.id}
                          currentRole={entry.role}
                          disabled={isSelf}
                        />
                      </td>
                      <td className="px-4 py-3">{entry.audioCount}</td>
                      <td className="px-4 py-3 text-muted">
                        {formatDate(entry.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <AdminDeleteUserButton
                          userId={entry.id}
                          label={entry.displayName ?? entry.email}
                          disabled={isSelf || isOtherAdmin}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-12">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Fichiers uploadés</h2>
            <span className="text-sm text-muted">
              {audios?.length ?? 0} fichier(s)
            </span>
          </div>

          {!audios || audios.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-border bg-surface p-8 text-center text-muted">
              Aucun fichier uploadé.
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-border text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Titre</th>
                    <th className="px-4 py-3 font-medium">Artiste</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Statut</th>
                    <th className="px-4 py-3 font-medium">Taille</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {audios.map((audio) => (
                    <tr
                      key={audio.id}
                      className="border-b border-border/60 last:border-0"
                    >
                      <td className="px-4 py-3 font-medium">{audio.title}</td>
                      <td className="px-4 py-3 text-muted">
                        {getOwnerName(audio.profiles)}
                      </td>
                      <td className="px-4 py-3">{kindLabel(audio.kind)}</td>
                      <td className="px-4 py-3 capitalize">{audio.status}</td>
                      <td className="px-4 py-3 text-muted">
                        {formatFileSize(audio.file_size)}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {formatDate(audio.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <AdminDeleteAudioButton
                          audioId={audio.id}
                          title={audio.title}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="mt-10">
          <Link
            href="/dashboard/admin"
            className="text-sm text-muted transition-colors hover:text-gold"
          >
            ← Retour au panel admin
          </Link>
        </div>
      </main>
    </>
  );
}
