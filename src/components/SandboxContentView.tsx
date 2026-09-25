import { createClient } from "@/lib/supabase/server";
import { getDict, type Locale } from "@/lib/i18n/dictionary";
import {
  DIMENSION_ORDER,
  getDimensionGlyph,
  getDimensionSubtitle,
  getFieldLabel,
  getRequirementLabel,
  type Dimension,
  type Requirement,
} from "@/lib/sandbox/dimensions";
import { ACTION_STEP_FIELD_KEYS, FIELD_SCHEMAS, GOAL_RECORD_FIELD_KEYS, GOAL_TYPE_BY_FIELD_KEY } from "@/lib/sandbox/fieldSchemas";

type RoleRule = {
  id: string;
  dimension: Dimension;
  field_key: string;
  field_label: string;
  requirement: Requirement;
};

type GoalRow = {
  id: string;
  goal_type: string;
  title: string;
  description: string | null;
  target_value: string | null;
  start_date: string | null;
  end_date: string | null;
  status: "not_started" | "in_progress" | "at_risk" | "completed";
  parent_goal_id: string | null;
  parentTitle?: string | null;
  latestCompletionPct?: number | null;
};

const REQUIREMENT_STYLE: Record<Requirement, string> = {
  required: "bg-rose-wash text-rose",
  optional: "bg-ochre-wash text-ochre",
  view_only: "border border-line bg-field text-ink-soft",
  not_applicable: "border border-line bg-field text-ink-faint",
};

const GOAL_STATUS_STYLE: Record<GoalRow["status"], string> = {
  not_started: "border border-line bg-field text-ink-soft",
  in_progress: "bg-ochre-wash text-ochre",
  at_risk: "bg-rose-wash text-rose",
  completed: "bg-jade-wash text-jade",
};

type ActionStepRow = {
  id: string;
  related_weakness_threat: string | null;
  solution_plan: string | null;
  implementation_steps: string | null;
  owner: string | null;
  deadline: string | null;
  status: "not_started" | "in_progress" | "completed" | "stuck";
  progress_note: string | null;
  help_needed: string | null;
  goal_id: string | null;
  goalTitle?: string | null;
};

const ACTION_STEP_STATUS_STYLE: Record<ActionStepRow["status"], string> = {
  not_started: "border border-line bg-field text-ink-soft",
  in_progress: "bg-ochre-wash text-ochre",
  completed: "bg-jade-wash text-jade",
  stuck: "bg-rose-wash text-rose",
};

// Read-only rendering of a full sandbox document's content, for a manager reviewing a
// direct report's submission — self-contained (fetches its own data) so both /admin
// (super_admin oversight) and /review (a direct manager) can drop it in unchanged; access
// control for who may load the underlying rows is RLS's job (is_in_management_chain /
// has_group_oversight), not this component's.
export async function SandboxContentView({
  documentId,
  ownerRole,
  locale,
}: {
  documentId: string;
  ownerRole: string;
  locale: Locale;
}) {
  const t = getDict(locale);
  const supabase = await createClient();

  const [{ data: rulesData }, { data: sectionsData }, { data: attachmentsData }, { data: goalsData }, { data: stepsData }] =
    await Promise.all([
      supabase
        .from("role_template_rules")
        .select("id, dimension, field_key, field_label, requirement")
        .eq("role", ownerRole)
        .order("sort_order", { ascending: true }),
      supabase.from("sandbox_sections").select("field_key, field_value").eq("document_id", documentId),
      supabase
        .from("attachments")
        .select("id, section_field_key, file_name")
        .eq("document_id", documentId),
      supabase
        .from("goals")
        .select("id, goal_type, title, description, target_value, start_date, end_date, status, parent_goal_id")
        .eq("document_id", documentId)
        .order("created_at", { ascending: true }),
      supabase
        .from("action_steps")
        .select(
          "id, related_weakness_threat, solution_plan, implementation_steps, owner, deadline, status, progress_note, help_needed, goal_id"
        )
        .eq("document_id", documentId)
        .order("created_at", { ascending: true }),
    ]);

  const rules = (rulesData ?? []) as RoleRule[];
  const sectionValues = new Map((sectionsData ?? []).map((s) => [s.field_key, s.field_value]));
  const attachmentsByField = new Map<string, { id: string; fileName: string }[]>();
  for (const a of attachmentsData ?? []) {
    const list = attachmentsByField.get(a.section_field_key ?? "") ?? [];
    list.push({ id: a.id, fileName: a.file_name });
    attachmentsByField.set(a.section_field_key ?? "", list);
  }

  const goals = (goalsData ?? []) as GoalRow[];
  const goalIds = goals.map((g) => g.id);
  const parentIds = [...new Set(goals.map((g) => g.parent_goal_id).filter((id): id is string => !!id))];
  const [{ data: progressData }, { data: parentGoalsData }] = await Promise.all([
    goalIds.length
      ? supabase
          .from("goal_progress_updates")
          .select("goal_id, completion_pct")
          .in("goal_id", goalIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as { goal_id: string; completion_pct: number }[] }),
    parentIds.length
      ? supabase.from("goals").select("id, title").in("id", parentIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);
  const latestPctByGoalId = new Map<string, number>();
  for (const p of progressData ?? []) {
    if (!latestPctByGoalId.has(p.goal_id)) latestPctByGoalId.set(p.goal_id, p.completion_pct);
  }
  const parentTitleById = new Map((parentGoalsData ?? []).map((g) => [g.id, g.title]));

  const goalsByType = new Map<string, GoalRow[]>();
  for (const g of goals) {
    const list = goalsByType.get(g.goal_type) ?? [];
    list.push({
      ...g,
      parentTitle: g.parent_goal_id ? parentTitleById.get(g.parent_goal_id) ?? null : null,
      latestCompletionPct: latestPctByGoalId.get(g.id) ?? null,
    });
    goalsByType.set(g.goal_type, list);
  }

  const goalTitleForStepsById = new Map(goals.map((g) => [g.id, g.title]));
  const actionSteps: ActionStepRow[] = (stepsData ?? []).map((s) => ({
    ...s,
    goalTitle: s.goal_id ? goalTitleForStepsById.get(s.goal_id) ?? null : null,
  }));

  const rulesByDimension = new Map<Dimension, RoleRule[]>();
  for (const r of rules) {
    const list = rulesByDimension.get(r.dimension) ?? [];
    list.push(r);
    rulesByDimension.set(r.dimension, list);
  }

  const dims = DIMENSION_ORDER.filter((d) => (rulesByDimension.get(d) ?? []).length > 0);

  return (
    <div className="flex flex-col gap-6">
      {dims.map((dimension) => {
        const dimRules = rulesByDimension.get(dimension) ?? [];
        const sectionFields = dimRules.filter(
          (r) =>
            !GOAL_RECORD_FIELD_KEYS.includes(r.field_key as (typeof GOAL_RECORD_FIELD_KEYS)[number]) &&
            !ACTION_STEP_FIELD_KEYS.includes(r.field_key as (typeof ACTION_STEP_FIELD_KEYS)[number])
        );
        const goalFields = dimRules.filter((r) => r.field_key in GOAL_TYPE_BY_FIELD_KEY);
        const actionStepFields = dimRules.filter((r) =>
          ACTION_STEP_FIELD_KEYS.includes(r.field_key as (typeof ACTION_STEP_FIELD_KEYS)[number])
        );
        return (
          <div key={dimension}>
            <div className="mb-2 flex items-baseline gap-2">
              <span className="font-serif-cn text-xl font-black text-ink">{getDimensionGlyph(dimension)}</span>
              <span className="text-xs text-ink-soft">{getDimensionSubtitle(locale, dimension)}</span>
            </div>
            <div className="flex flex-col gap-3">
              {sectionFields.map((field) => (
                <FieldValue
                  key={field.id}
                  fieldKey={field.field_key}
                  fieldLabel={getFieldLabel(locale, field.field_key, field.field_label)}
                  requirement={field.requirement}
                  locale={locale}
                  value={sectionValues.get(field.field_key)}
                  attachments={attachmentsByField.get(field.field_key)}
                  t={t}
                />
              ))}
              {goalFields.map((field) => {
                const goalType = GOAL_TYPE_BY_FIELD_KEY[field.field_key];
                const goals = goalsByType.get(goalType) ?? [];
                return (
                  <div key={field.id} className="rounded-md border border-line bg-field p-3">
                    <p className="mb-2 text-sm font-bold text-ink">{t.sandboxForm.goalGroupTitle[goalType]}</p>
                    {goals.length === 0 ? (
                      <p className="text-xs text-ink-faint">{t.sandboxForm.noGoalsYet}</p>
                    ) : (
                      <ul className="flex flex-col gap-2">
                        {goals.map((g) => (
                          <li key={g.id} className="rounded-md border border-line bg-paper-raised p-2.5 text-sm">
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <span className="font-medium text-ink">{g.title}</span>
                              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${GOAL_STATUS_STYLE[g.status]}`}>
                                {t.sandboxForm.goalStatus[g.status]}
                              </span>
                            </div>
                            {g.description && <p className="text-xs text-ink-soft">{g.description}</p>}
                            {g.target_value && <p className="text-xs text-ink-soft">{g.target_value}</p>}
                            {(g.start_date || g.end_date) && (
                              <p className="text-xs text-ink-faint">
                                {g.start_date ?? "—"} → {g.end_date ?? "—"}
                              </p>
                            )}
                            {g.parentTitle && (
                              <p className="mt-1 text-xs text-ink-faint">
                                ↳ {t.sandboxForm.linkedToLabel}：{g.parentTitle}
                              </p>
                            )}
                            {g.latestCompletionPct != null && (
                              <div className="mt-1 flex items-center gap-2">
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-field">
                                  <div
                                    className="h-full rounded-full bg-jade"
                                    style={{ width: `${Math.max(0, Math.min(100, g.latestCompletionPct))}%` }}
                                  />
                                </div>
                                <span className="text-xs text-ink-soft">{g.latestCompletionPct}%</span>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
              {actionStepFields.map((field) => (
                <div key={field.id} className="rounded-md border border-line bg-field p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-ink">
                      {getFieldLabel(locale, field.field_key, field.field_label)}
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${REQUIREMENT_STYLE[field.requirement]}`}>
                      {getRequirementLabel(locale, field.requirement)}
                    </span>
                  </div>
                  {actionSteps.length === 0 ? (
                    <p className="text-xs text-ink-faint">{t.sandboxForm.noActionStepsYet}</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {actionSteps.map((s) => (
                        <li key={s.id} className="rounded-md border border-line bg-paper-raised p-2.5 text-sm">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="font-medium text-ink">{s.related_weakness_threat || "—"}</span>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${ACTION_STEP_STATUS_STYLE[s.status]}`}
                            >
                              {t.sandboxForm.actionStepStatus[s.status]}
                            </span>
                          </div>
                          {s.solution_plan && <p className="text-xs text-ink-soft">{s.solution_plan}</p>}
                          {s.implementation_steps && (
                            <p className="whitespace-pre-wrap text-xs text-ink-soft">{s.implementation_steps}</p>
                          )}
                          <p className="mt-1 text-xs text-ink-faint">
                            {[s.owner, s.deadline].filter(Boolean).join(" · ")}
                            {s.goalTitle ? ` · ↳ ${s.goalTitle}` : ""}
                          </p>
                          {s.progress_note && (
                            <p className="mt-1 text-xs text-ink-soft">
                              <span className="font-medium text-ink">{t.sandboxForm.progressNoteLabel}：</span>
                              {s.progress_note}
                            </p>
                          )}
                          {s.help_needed && (
                            <p className="mt-1 text-xs text-rose">
                              <span className="font-medium">{t.sandboxForm.helpNeededLabel}：</span>
                              {s.help_needed}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FieldValue({
  fieldKey,
  fieldLabel,
  requirement,
  locale,
  value,
  attachments,
  t,
}: {
  fieldKey: string;
  fieldLabel: string;
  requirement: Requirement;
  locale: Locale;
  value: unknown;
  attachments?: { id: string; fileName: string }[];
  t: ReturnType<typeof getDict>;
}) {
  const schema = FIELD_SCHEMAS[fieldKey];
  const isEmpty =
    (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) &&
    (!attachments || attachments.length === 0);

  return (
    <div className="rounded-md border border-line bg-field p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-ink">{fieldLabel}</span>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${REQUIREMENT_STYLE[requirement]}`}>
          {getRequirementLabel(locale, requirement)}
        </span>
      </div>
      {isEmpty ? (
        <p className="text-xs text-ink-faint">{t.sandboxForm.notFilled}</p>
      ) : (
        <>
          {(schema?.widget === "richtext" || schema?.widget === "richtext_attachment") && typeof value === "string" && (
            <p className="whitespace-pre-wrap text-sm text-ink-soft">{value}</p>
          )}
          {schema?.widget === "list_string" && Array.isArray(value) && (
            <ul className="list-disc pl-4 text-sm text-ink-soft">
              {(value as string[]).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}
          {(schema?.widget === "list_object" || schema?.widget === "table" || schema?.widget === "attachment_list") &&
            Array.isArray(value) &&
            schema.objectFields && (
              <ul className="flex flex-col gap-1">
                {(value as Record<string, string>[]).map((row, i) => (
                  <li key={i} className="rounded bg-paper-raised px-2 py-1 text-sm text-ink-soft">
                    {schema
                      .objectFields!.map((f) => row[f.key])
                      .filter(Boolean)
                      .join(" · ")}
                  </li>
                ))}
              </ul>
            )}
          {attachments && attachments.length > 0 && (
            <ul className="mt-1 flex flex-col gap-0.5">
              {attachments.map((a) => (
                <li key={a.id} className="text-xs text-ink-soft">
                  {a.fileName}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
