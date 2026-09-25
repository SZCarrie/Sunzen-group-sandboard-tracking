"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { FIELD_SCHEMAS } from "@/lib/sandbox/fieldSchemas";

const LOCKED_STATUSES = ["submitted", "in_review", "approved"] as const;

async function assertOwner(documentId: string) {
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
  if (!doc || doc.owner_id !== user.id) throw new Error("无权限：只能编辑自己的沙盘");
  // mirrors the client-side lock in SectionFieldEditor: once submitted, section fields
  // can't be edited until a manager sends it back for revision — enforced here too so
  // hiding the form isn't the only thing standing between a reviewer and a moved target.
  if ((LOCKED_STATUSES as readonly string[]).includes(doc.status)) {
    throw new Error("已提交，暂时无法修改，请等待审核或申请退回修改");
  }

  return { supabase, userId: user.id };
}

export async function saveSectionField(formData: FormData) {
  const documentId = String(formData.get("document_id") ?? "");
  const dimension = String(formData.get("dimension") ?? "");
  const fieldKey = String(formData.get("field_key") ?? "");
  const schema = FIELD_SCHEMAS[fieldKey];
  if (!documentId || !dimension || !fieldKey || !schema) {
    throw new Error("无效的提交内容");
  }

  const { supabase } = await assertOwner(documentId);

  let value: unknown;
  if (schema.widget === "richtext" || schema.widget === "richtext_attachment") {
    value = String(formData.get("value") ?? "").trim();
  } else if (schema.widget === "list_string") {
    value = formData
      .getAll("item")
      .map((v) => String(v).trim())
      .filter(Boolean);
  } else if (schema.widget === "list_object" || schema.widget === "table" || schema.widget === "attachment_list") {
    const rowCount = Number(formData.get("row_count") ?? 0);
    const fields = schema.objectFields ?? [];
    const rows: Record<string, string>[] = [];
    for (let i = 0; i < rowCount; i++) {
      const row: Record<string, string> = {};
      let hasContent = false;
      for (const f of fields) {
        const raw = String(formData.get(`row_${i}_${f.key}`) ?? "").trim();
        if (raw) hasContent = true;
        row[f.key] = raw;
      }
      if (hasContent) rows.push(row);
    }
    value = rows;
  } else {
    value = null;
  }

  const { error } = await supabase.from("sandbox_sections").upsert(
    {
      document_id: documentId,
      dimension,
      field_key: fieldKey,
      field_value: value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "document_id,field_key" }
  );
  if (error) throw new Error(error.message);

  revalidatePath("/my-sandbox");
}

export async function uploadFieldAttachment(formData: FormData) {
  const documentId = String(formData.get("document_id") ?? "");
  const fieldKey = String(formData.get("field_key") ?? "");
  const file = formData.get("file") as File | null;
  if (!documentId || !fieldKey || !file || file.size === 0) {
    throw new Error("请选择要上传的文件");
  }

  const { supabase, userId } = await assertOwner(documentId);

  const safeName = file.name.replace(/[^\w.\-一-龥]/g, "_");
  const path = `${documentId}/${fieldKey}/${Date.now()}_${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("sandbox-attachments")
    .upload(path, file);
  if (uploadError) throw new Error(uploadError.message);

  const { error: insertError } = await supabase.from("attachments").insert({
    document_id: documentId,
    section_field_key: fieldKey,
    storage_path: path,
    file_name: file.name,
    uploaded_by: userId,
  });
  if (insertError) throw new Error(insertError.message);

  revalidatePath("/my-sandbox");
}

export async function deleteFieldAttachment(formData: FormData) {
  const documentId = String(formData.get("document_id") ?? "");
  const attachmentId = String(formData.get("attachment_id") ?? "");
  if (!documentId || !attachmentId) {
    throw new Error("无效的提交内容");
  }

  const { supabase } = await assertOwner(documentId);

  const { data: attachment } = await supabase
    .from("attachments")
    .select("id, storage_path")
    .eq("id", attachmentId)
    .eq("document_id", documentId)
    .maybeSingle();
  if (!attachment) throw new Error("找不到该附件");

  const { error: storageError } = await supabase.storage
    .from("sandbox-attachments")
    .remove([attachment.storage_path]);
  if (storageError) throw new Error(storageError.message);

  const { error: deleteError } = await supabase.from("attachments").delete().eq("id", attachmentId);
  if (deleteError) throw new Error(deleteError.message);

  revalidatePath("/my-sandbox");
}
