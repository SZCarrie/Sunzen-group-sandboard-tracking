"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdminTierRole } from "@/lib/sandbox/dimensions";

const VALID_ROLES = ["employee", "supervisor", "subsidiary_head", "super_admin", "group_md"] as const;

async function getViewer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("未登录");

  const { data: viewer } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();
  if (!viewer || !isAdminTierRole(viewer.role)) {
    throw new Error("无权限：仅管理员可操作");
  }
  return { supabase, viewer };
}

export async function updateProfileAssignment(formData: FormData) {
  const { supabase, viewer } = await getViewer();

  const profileId = String(formData.get("profile_id") ?? "");
  const role = String(formData.get("role") ?? "");
  const managerIdRaw = String(formData.get("manager_id") ?? "");
  const organizationIdRaw = String(formData.get("organization_id") ?? "");

  if (!profileId || !(VALID_ROLES as readonly string[]).includes(role)) {
    throw new Error("无效的提交内容");
  }
  if (managerIdRaw === profileId) {
    throw new Error("不能把自己设为自己的主管");
  }
  if (profileId === viewer.id && role !== viewer.role) {
    throw new Error("不能在这里修改自己的角色，避免误操作把自己锁在管理页外");
  }

  const { data: target } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", profileId)
    .maybeSingle();
  if (!target) throw new Error("找不到该用户");

  const viewerIsSuperAdmin = viewer.role === "super_admin";
  if (!viewerIsSuperAdmin && (isAdminTierRole(target.role) || isAdminTierRole(role))) {
    throw new Error("无权限：管理员账号（HR 管理员/超级管理员）只能由超级管理员管理");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      role,
      manager_id: managerIdRaw ? managerIdRaw : null,
      organization_id: organizationIdRaw ? organizationIdRaw : null,
    })
    .eq("id", profileId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/overview");
}

export async function setProfileDisabled(formData: FormData) {
  const { supabase, viewer } = await getViewer();

  const profileId = String(formData.get("profile_id") ?? "");
  const disabled = formData.get("disabled") === "true";
  if (!profileId) throw new Error("无效的提交内容");
  if (profileId === viewer.id) throw new Error("不能停用自己的账号");

  const { data: target } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", profileId)
    .maybeSingle();
  if (!target) throw new Error("找不到该用户");

  if (viewer.role !== "super_admin" && isAdminTierRole(target.role)) {
    throw new Error("无权限：管理员账号只能由超级管理员停用/启用");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ disabled_at: disabled ? new Date().toISOString() : null })
    .eq("id", profileId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/users");
  revalidatePath("/admin/overview");
}

export async function inviteUser(formData: FormData) {
  const { supabase, viewer } = await getViewer();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "");
  const managerIdRaw = String(formData.get("manager_id") ?? "");
  const organizationIdRaw = String(formData.get("organization_id") ?? "");

  if (!email || !fullName || !(VALID_ROLES as readonly string[]).includes(role)) {
    throw new Error("无效的提交内容");
  }
  if (viewer.role !== "super_admin" && isAdminTierRole(role)) {
    throw new Error("无权限：只有超级管理员可以邀请管理员账号");
  }

  const { error } = await supabase.from("invitations").insert({
    email,
    full_name: fullName,
    role,
    manager_id: managerIdRaw ? managerIdRaw : null,
    organization_id: organizationIdRaw ? organizationIdRaw : null,
    invited_by: viewer.id,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/users");
}

export async function revokeInvitation(formData: FormData) {
  const { supabase } = await getViewer();
  const invitationId = String(formData.get("invitation_id") ?? "");
  if (!invitationId) throw new Error("无效的提交内容");

  const { error } = await supabase.from("invitations").delete().eq("id", invitationId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/users");
}
