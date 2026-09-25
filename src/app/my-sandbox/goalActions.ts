"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const VALID_GOAL_TYPES = ["annual_business", "annual_team", "annual_personal", "annual_work"] as const;
const VALID_STATUS = ["not_started", "in_progress", "at_risk", "completed"] as const;

async function assertDocumentOwner(documentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("未登录");

  const { data: doc } = await supabase
    .from("sandbox_documents")
    .select("id, owner_id")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc || doc.owner_id !== user.id) throw new Error("无权限：只能编辑自己的沙盘");

  return { supabase, userId: user.id };
}

export async function createGoal(formData: FormData) {
  const documentId = String(formData.get("document_id") ?? "");
  const goalType = String(formData.get("goal_type") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const targetValue = String(formData.get("target_value") ?? "").trim();
  const goalPlanning = String(formData.get("goal_planning") ?? "").trim();
  const implementationStep = String(formData.get("implementation_step") ?? "").trim();
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "");
  const parentGoalId = String(formData.get("parent_goal_id") ?? "").trim();

  if (!documentId || !(VALID_GOAL_TYPES as readonly string[]).includes(goalType) || !title) {
    throw new Error("无效的提交内容");
  }

  const { supabase } = await assertDocumentOwner(documentId);

  const { error } = await supabase.from("goals").insert({
    document_id: documentId,
    goal_type: goalType,
    title,
    description: description || null,
    target_value: targetValue || null,
    goal_planning: goalPlanning || null,
    implementation_step: implementationStep || null,
    start_date: startDate || null,
    end_date: endDate || null,
    parent_goal_id: parentGoalId || null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/my-sandbox");
}

export async function updateGoalStatus(formData: FormData) {
  const goalId = String(formData.get("goal_id") ?? "");
  const documentId = String(formData.get("document_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!goalId || !documentId || !(VALID_STATUS as readonly string[]).includes(status)) {
    throw new Error("无效的提交内容");
  }

  const { supabase } = await assertDocumentOwner(documentId);

  const { error } = await supabase.from("goals").update({ status }).eq("id", goalId);
  if (error) throw new Error(error.message);

  revalidatePath("/my-sandbox");
}

export async function addGoalProgress(formData: FormData) {
  const goalId = String(formData.get("goal_id") ?? "");
  const documentId = String(formData.get("document_id") ?? "");
  const periodLabel = String(formData.get("period_label") ?? "").trim();
  const completionPct = Number(formData.get("completion_pct") ?? NaN);
  const notes = String(formData.get("notes") ?? "").trim();

  if (!goalId || !documentId || !periodLabel || Number.isNaN(completionPct)) {
    throw new Error("无效的提交内容");
  }
  if (completionPct < 0 || completionPct > 100) {
    throw new Error("完成度必须在 0-100 之间");
  }

  const { supabase, userId } = await assertDocumentOwner(documentId);

  const { error } = await supabase.from("goal_progress_updates").insert({
    goal_id: goalId,
    period_label: periodLabel,
    completion_pct: completionPct,
    notes: notes || null,
    updated_by: userId,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/my-sandbox");
}
