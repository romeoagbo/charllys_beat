"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile, isAdmin } from "@/lib/profile";

const MIN_FEEDBACK_LENGTH = 10;
const MAX_FEEDBACK_LENGTH = 5000;

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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifié." };
  }

  const profile = await getProfile(user.id);
  if (!profile || !isAdmin(profile.role)) {
    return { error: "Accès refusé." };
  }

  const { error } = await supabase
    .from("audios")
    .update({
      status: "reviewed",
      review_feedback: trimmed,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", submissionId)
    .eq("kind", "submission");

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard");
  return { success: true };
}
