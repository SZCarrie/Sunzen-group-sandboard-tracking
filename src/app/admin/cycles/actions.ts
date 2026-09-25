"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdminTierRole } from "@/lib/sandbox/dimensions";

const VALID_CADENCE = ["quarterly", "monthly"] as const;
const VALID_STATUS = ["draft", "active", "closed"] as const;

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

function readCycleFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "");
  const cadence = String(formData.get("update_cadence") ?? "");
  const status = String(formData.get("status") ?? "draft");

  if (
    !name ||
    !startDate ||
    !endDate ||
    !(VALID_CADENCE as readonly string[]).includes(cadence) ||
    !(VALID_STATUS as readonly string[]).includes(status)
  ) {
    throw new Error("无效的提交内容");
  }

  return { name, startDate, endDate, cadence, status };
}

export async function createCycle(formData: FormData) {
  const supabase = await assertHrAdmin();
  const { name, startDate, endDate, cadence, status } = readCycleFields(formData);

  const { error } = await supabase.from("sandbox_cycles").insert({
    name,
    start_date: startDate,
    end_date: endDate,
    update_cadence: cadence,
    status,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/cycles");
  revalidatePath("/my-sandbox");
  revalidatePath("/admin/overview");
}

export async function updateCycle(formData: FormData) {
  const supabase = await assertHrAdmin();
  const id = String(formData.get("id") ?? "");
  const { name, startDate, endDate, cadence, status } = readCycleFields(formData);
  if (!id) throw new Error("无效的提交内容");

  const { error } = await supabase
    .from("sandbox_cycles")
    .update({
      name,
      start_date: startDate,
      end_date: endDate,
      update_cadence: cadence,
      status,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/cycles");
  revalidatePath("/my-sandbox");
  revalidatePath("/admin/overview");
}
