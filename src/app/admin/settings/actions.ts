"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const VALID_ROLES = ["employee", "supervisor", "subsidiary_head", "super_admin", "group_md"] as const;
const VALID_REQUIREMENTS = ["required", "optional", "view_only"] as const;

// One row in the settings table covers a single field across every role at once: a
// "hidden" selection deletes that role's role_template_rules row (mirroring how the rest
// of the app treats a field as absent), anything else upserts it.
export async function updateFieldRow(formData: FormData) {
  const fieldKey = String(formData.get("field_key") ?? "");
  const dimension = String(formData.get("dimension") ?? "");
  const fieldLabel = String(formData.get("field_label") ?? "");
  const dataType = String(formData.get("data_type") ?? "");
  const sortOrder = Number(formData.get("sort_order") ?? 0);

  if (!fieldKey || !dimension || !fieldLabel || !dataType || Number.isNaN(sortOrder)) {
    throw new Error("无效的提交内容");
  }

  const supabase = await createClient();

  const rolesToDelete: string[] = [];
  const rowsToUpsert: {
    role: string;
    dimension: string;
    field_key: string;
    field_label: string;
    data_type: string;
    sort_order: number;
    requirement: string;
  }[] = [];

  for (const role of VALID_ROLES) {
    const requirement = String(formData.get(`requirement_${role}`) ?? "hidden");
    if (requirement === "hidden") {
      rolesToDelete.push(role);
    } else if ((VALID_REQUIREMENTS as readonly string[]).includes(requirement)) {
      rowsToUpsert.push({
        role,
        dimension,
        field_key: fieldKey,
        field_label: fieldLabel,
        data_type: dataType,
        sort_order: sortOrder,
        requirement,
      });
    } else {
      throw new Error("无效的提交内容");
    }
  }

  if (rolesToDelete.length > 0) {
    const { error } = await supabase
      .from("role_template_rules")
      .delete()
      .eq("field_key", fieldKey)
      .in("role", rolesToDelete);
    if (error) throw new Error(error.message);
  }

  if (rowsToUpsert.length > 0) {
    const { error } = await supabase
      .from("role_template_rules")
      .upsert(rowsToUpsert, { onConflict: "role,field_key" });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/settings");
  revalidatePath("/my-sandbox");
}
