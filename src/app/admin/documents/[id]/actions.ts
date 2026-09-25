"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const VALID_STATUS = ["submitted", "in_review", "needs_revision", "approved"] as const;

export async function addReview(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("未登录");

  const documentId = String(formData.get("document_id") ?? "");
  const status = String(formData.get("status") ?? "");
  const comments = String(formData.get("comments") ?? "").trim();

  if (!documentId || !(VALID_STATUS as readonly string[]).includes(status)) {
    throw new Error("无效的提交内容");
  }

  const { error: reviewError } = await supabase.from("reviews").insert({
    document_id: documentId,
    reviewer_id: user.id,
    status,
    comments: comments || null,
  });
  if (reviewError) throw new Error(reviewError.message);

  const { error: docError } = await supabase
    .from("sandbox_documents")
    .update({ status })
    .eq("id", documentId);
  if (docError) throw new Error(docError.message);

  revalidatePath(`/admin/documents/${documentId}`);
  revalidatePath("/admin/overview");
  revalidatePath("/my-sandbox");
  revalidatePath(`/review/${documentId}`);
  revalidatePath("/review");
}
