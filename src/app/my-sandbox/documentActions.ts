"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const SUBMITTABLE_STATUSES = ["draft", "needs_revision"] as const;

export async function submitDocument(formData: FormData) {
  const documentId = String(formData.get("document_id") ?? "");
  if (!documentId) throw new Error("无效的提交内容");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("未登录");

  const { data: doc } = await supabase
    .from("sandbox_documents")
    .select("id, owner_id, status")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc || doc.owner_id !== user.id) throw new Error("无权限：只能提交自己的沙盘");
  if (!(SUBMITTABLE_STATUSES as readonly string[]).includes(doc.status)) {
    throw new Error("当前状态无法提交");
  }

  const { error } = await supabase.from("sandbox_documents").update({ status: "submitted" }).eq("id", documentId);
  if (error) throw new Error(error.message);

  revalidatePath("/my-sandbox");
  revalidatePath("/admin/overview");
}
