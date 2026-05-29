"use server";

import { revalidatePath } from "next/cache";
import { deleteAudioStorage, deleteUserAudiosStorage } from "@/lib/admin-storage";
import { getProfile, isAdmin } from "@/lib/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/profile";

const VALID_ROLES: UserRole[] = ["admin", "user", "expert"];

const MIN_FEEDBACK_LENGTH = 10;
const MAX_FEEDBACK_LENGTH = 5000;

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifié." as const };
  }

  const profile = await getProfile(user.id);
  if (!profile || !isAdmin(profile.role)) {
    return { error: "Accès refusé." as const };
  }

  return { user, profile };
}

function revalidateAdminPaths() {
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/manage");
  revalidatePath("/dashboard");
  revalidatePath("/audios");
}

export async function submitSubmissionReview(
  submissionId: string,
  feedback: string,
) {
  const trimmed = feedback.trim();

  if (trimmed.length < MIN_FEEDBACK_LENGTH) {
    return {
      error: `L'avis doit contenir au moins ${MIN_FEEDBACK_LENGTH} caractères.`,
    };
  }

  if (trimmed.length > MAX_FEEDBACK_LENGTH) {
    return { error: "L'avis est trop long (5000 caractères max)." };
  }

  const auth = await assertAdmin();
  if ("error" in auth) {
    return { error: auth.error };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("audios")
    .update({
      status: "reviewed",
      review_feedback: trimmed,
      reviewed_at: new Date().toISOString(),
      reviewed_by: auth.user.id,
    })
    .eq("id", submissionId)
    .eq("kind", "submission");

  if (error) {
    return { error: error.message };
  }

  revalidateAdminPaths();
  return { success: true };
}

export async function deleteAudioAsAdmin(audioId: string) {
  const auth = await assertAdmin();
  if ("error" in auth) {
    return { error: auth.error };
  }

  const admin = createAdminClient();
  const { data: audio, error: fetchError } = await admin
    .from("audios")
    .select("id, title, file_path, preview_path, cover_path")
    .eq("id", audioId)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!audio) {
    return { error: "Fichier introuvable." };
  }

  try {
    await deleteAudioStorage(admin, audio);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Suppression du fichier impossible.";
    return { error: message };
  }

  const { error: deleteError } = await admin
    .from("audios")
    .delete()
    .eq("id", audioId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  revalidateAdminPaths();
  return { success: true };
}

export async function deleteUserAsAdmin(userId: string) {
  const auth = await assertAdmin();
  if ("error" in auth) {
    return { error: auth.error };
  }

  if (auth.user.id === userId) {
    return { error: "Vous ne pouvez pas supprimer votre propre compte." };
  }

  const admin = createAdminClient();
  const { data: targetProfile, error: profileError } = await admin
    .from("profiles")
    .select("id, role, display_name")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    return { error: profileError.message };
  }

  if (!targetProfile) {
    return { error: "Utilisateur introuvable." };
  }

  if (targetProfile.role === "admin") {
    return { error: "Impossible de supprimer un autre administrateur." };
  }

  try {
    await deleteUserAudiosStorage(admin, userId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Suppression des fichiers impossible.";
    return { error: message };
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    return { error: deleteError.message };
  }

  revalidateAdminPaths();
  return { success: true };
}

export async function updateUserRoleAsAdmin(userId: string, role: UserRole) {
  const auth = await assertAdmin();
  if ("error" in auth) {
    return { error: auth.error };
  }

  if (auth.user.id === userId) {
    return { error: "Vous ne pouvez pas modifier votre propre rôle." };
  }

  if (!VALID_ROLES.includes(role)) {
    return { error: "Rôle invalide." };
  }

  const admin = createAdminClient();
  const { data: targetProfile, error: profileError } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    return { error: profileError.message };
  }

  if (!targetProfile) {
    return { error: "Utilisateur introuvable." };
  }

  if (targetProfile.role === role) {
    return { success: true };
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidateAdminPaths();
  return { success: true };
}
