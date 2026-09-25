"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const VALID_STATUS = ["not_started", "in_progress", "completed", "stuck"] as const;

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

  return { supabase };
}

export async function createActionStep(formData: FormData) {
  const documentId = String(formData.get("document_id") ?? "");
  const relatedWeaknessThreat = String(formData.get("related_weakness_threat") ?? "").trim();
  const solutionPlan = String(formData.get("solution_plan") ?? "").trim();
  const implementationSteps = String(formData.get("implementation_steps") ?? "").trim();
  const owner = String(formData.get("owner") ?? "").trim();
  const deadline = String(formData.get("deadline") ?? "");
  const goalId = String(formData.get("goal_id") ?? "").trim();

  if (!documentId) throw new Error("无效的提交内容");

  const { supabase } = await assertDocumentOwner(documentId);

  const { error } = await supabase.from("action_steps").insert({
    document_id: documentId,
    related_weakness_threat: relatedWeaknessThreat || null,
    solution_plan: solutionPlan || null,
    implementation_steps: implementationSteps || null,
    owner: owner || null,
    deadline: deadline || null,
    goal_id: goalId || null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/my-sandbox");
}

export async function updateActionStepStatus(formData: FormData) {
  const stepId = String(formData.get("step_id") ?? "");
  const documentId = String(formData.get("document_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!stepId || !documentId || !(VALID_STATUS as readonly string[]).includes(status)) {
    throw new Error("无效的提交内容");
  }

  const { supabase } = await assertDocumentOwner(documentId);

  const { error } = await supabase.from("action_steps").update({ status }).eq("id", stepId);
  if (error) throw new Error(error.message);

  revalidatePath("/my-sandbox");
}

export async function updateActionStepProgress(formData: FormData) {
  const stepId = String(formData.get("step_id") ?? "");
  const documentId = String(formData.get("document_id") ?? "");
  const progressNote = String(formData.get("progress_note") ?? "").trim();
  const helpNeeded = String(formData.get("help_needed") ?? "").trim();
  if (!stepId || !documentId) throw new Error("无效的提交内容");

  const { supabase } = await assertDocumentOwner(documentId);

  const { error } = await supabase
    .from("action_steps")
    .update({ progress_note: progressNote || null, help_needed: helpNeeded || null })
    .eq("id", stepId);
  if (error) throw new Error(error.message);

  revalidatePath("/my-sandbox");
}
