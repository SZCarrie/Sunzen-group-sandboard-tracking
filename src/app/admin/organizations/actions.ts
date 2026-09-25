"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdminTierRole } from "@/lib/sandbox/dimensions";

const VALID_TYPES = ["group", "subsidiary", "department"] as const;

async function assertHrAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("未登录");

  const { data: viewer } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!viewer || !isAdminTierRole(viewer.role)) throw new Error("无权限：仅管理员可操作");

  return supabase;
}

export async function createOrganization(formData: FormData) {
  const supabase = await assertHrAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const parentIdRaw = String(formData.get("parent_id") ?? "");

  if (!name || !(VALID_TYPES as readonly string[]).includes(type)) {
    throw new Error("无效的提交内容");
  }

  const { error } = await supabase.from("organizations").insert({
    name,
    type,
    parent_id: parentIdRaw ? parentIdRaw : null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/organizations");
  revalidatePath("/admin/users");
}

export async function updateOrganization(formData: FormData) {
  const supabase = await assertHrAdmin();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const parentIdRaw = String(formData.get("parent_id") ?? "");

  if (!id || !name || !(VALID_TYPES as readonly string[]).includes(type)) {
    throw new Error("无效的提交内容");
  }
  if (parentIdRaw === id) {
    throw new Error("不能把自己设为自己的上级组织");
  }

  const { error } = await supabase
    .from("organizations")
    .update({ name, type, parent_id: parentIdRaw ? parentIdRaw : null })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/organizations");
  revalidatePath("/admin/users");
}
