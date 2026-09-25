import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/locale";
import { getDict } from "@/lib/i18n/dictionary";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AppHeader } from "@/components/AppHeader";
import {
  DIMENSION_ORDER,
  getDimensionGlyph,
  getDimensionSubtitle,
  getFieldLabel,
  getRoleLabel,
  isAdminTierRole,
  type Dimension,
  type Requirement,
} from "@/lib/sandbox/dimensions";
import { ACTION_STEP_FIELD_KEYS, FIELD_HINTS, GOAL_RECORD_FIELD_KEYS, GOAL_TYPE_BY_FIELD_KEY } from "@/lib/sandbox/fieldSchemas";
import { SectionFieldEditor } from "./SectionFieldEditor";
import { GoalsPanel, type GoalWithProgress } from "./GoalsPanel";
import { ActionStepsPanel, type ActionStepFilter, type ActionStepWithGoal } from "./ActionStepsPanel";
import { submitDocument } from "./documentActions";

type ProfileRow = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  manager_id: string | null;
  organization_id: string | null;
  disabled_at: string | null;
};

type RoleRule = {
  id: string;
  dimension: Dimension;
  field_key: string;
  field_label: string;
  requirement: Requirement;
  data_type: string;
  sort_order: number;
};

async function findAncestorDocument(
  supabase: Awaited<ReturnType<typeof createClient>>,
  managerId: string | null,
  cycleId: string
): Promise<{ documentId: string; ownerName: string } | null> {
  let currentId = managerId;
  for (let hop = 0; hop < 5 && currentId; hop++) {
    const { data: mgr } = await supabase
      .from("profiles")
      .select("id, full_name, role, manager_id")
      .eq("id", currentId)
      .maybeSingle();
    if (!mgr) return null;
    if (mgr.role === "subsidiary_head" || mgr.role === "super_admin" || mgr.role === "group_md") {
      const { data: doc } = await supabase
        .from("sandbox_documents")
        .select("id")
        .eq("owner_id", mgr.id)
        .eq("cycle_id", cycleId)
        .maybeSingle();
      return doc ? { documentId: doc.id, ownerName: mgr.full_name } : null;
    }
    currentId = mgr.manager_id;
  }
  return null;
}

// Parent-goal options for the "link to my manager's goal" dropdown: every goal belonging to
// anyone in the viewer's management chain, for the same cycle — mirrors findAncestorDocument's
// walk but doesn't stop at subsidiary_head/super_admin/group_md, since any manager along the
// chain (not just the top of it) can have a goal worth linking to.
async function findAncestorGoals(
  supabase: Awaited<ReturnType<typeof createClient>>,
  managerId: string | null,
  cycleId: string
): Promise<{ id: string; label: string }[]> {
  const options: { id: string; label: string }[] = [];
  let currentId: string | null = managerId;
  for (let hop = 0; hop < 5 && currentId; hop++) {
    const { data: mgr }: { data: { id: string; full_name: string; manager_id: string | null } | null } =
      await supabase.from("profiles").select("id, full_name, manager_id").eq("id", currentId).maybeSingle();
    if (!mgr) break;
    const { data: mgrDoc } = await supabase
      .from("sandbox_documents")
      .select("id")
      .eq("owner_id", mgr.id)
      .eq("cycle_id", cycleId)
      .maybeSingle();
    if (mgrDoc) {
      const { data: mgrGoals } = await supabase.from("goals").select("id, title").eq("document_id", mgrDoc.id);
      for (const g of mgrGoals ?? []) {
        options.push({ id: g.id, label: `${mgr.full_name} · ${g.title}` });
      }
    }
    currentId = mgr.manager_id;
  }
  return options;
}

function isFilled(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export default async function MySandboxPage({
  searchParams,
}: {
  searchParams: Promise<{ dim?: string; stepFilter?: string }>;
}) {
  const { dim: requestedDim, stepFilter } = await searchParams;
  const activeStepFilter: ActionStepFilter =
    stepFilter === "attention" || stepFilter === "open" ? stepFilter : "all";
  const locale = await getLocale();
  const t = getDict(locale);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // ensure_profile() creates the profile row on first visit (applying a pending
  // invitation's role/manager/org if one matches this account's email), entirely
  // inside a SECURITY DEFINER function so an invited super_admin role can be granted
  // without any client-side insert ever being allowed to set its own role.
  const { data: profile, error: profileError } = (await supabase
    .rpc("ensure_profile", {
      p_full_name: (user.user_metadata?.full_name as string) || user.email || "未命名",
    })
    .single()) as { data: ProfileRow | null; error: { message: string } | null };

  if (profileError) {
    console.error("ensure_profile failed", profileError.message);
  }

  if (!profile) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-sm text-rose">无法加载或创建个人档案，请联系 HR。</p>
      </main>
    );
  }

  if (profile.disabled_at) {
    return (
      <main className="mx-auto max-w-sm px-6 py-10">
        <p className="mb-4 text-sm text-rose">
          {locale === "en"
            ? "This account has been deactivated. Contact HR if this is unexpected."
            : "此账号已被停用，如有疑问请联系 HR。"}
        </p>
        <form action="/auth/sign-out" method="post">
          <SignOutButton label={t.common.signOut} />
        </form>
      </main>
    );
  }

  const { data: cycle } = await supabase
    .from("sandbox_cycles")
    .select("id, name, update_cadence")
    .eq("status", "active")
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  let document: { id: string; status: string } | null = null;
  if (cycle) {
    const { data: existingDoc } = await supabase
      .from("sandbox_documents")
      .select("id, status")
      .eq("cycle_id", cycle.id)
      .eq("owner_id", profile.id)
      .maybeSingle();

    document = existingDoc ?? null;

    if (!document) {
      const { data: createdDoc } = await supabase
        .from("sandbox_documents")
        .insert({
          cycle_id: cycle.id,
          owner_id: profile.id,
          role_snapshot: profile.role,
        })
        .select("id, status")
        .single();
      document = createdDoc ?? null;
    }
  }

  // Every role — including super_admin — has its own real rows in role_template_rules
  // (editable at /admin/settings), rather than standing in on subsidiary_head's template
  // with hardcoded field exclusions in application code.
  const { data: rulesData } = await supabase
    .from("role_template_rules")
    .select("id, dimension, field_key, field_label, requirement, data_type, sort_order")
    .eq("role", profile.role)
    .order("sort_order", { ascending: true });

  const rules = rulesData ?? [];

  const rulesByDimension = new Map<Dimension, RoleRule[]>();
  for (const rule of (rules ?? []) as RoleRule[]) {
    const list = rulesByDimension.get(rule.dimension) ?? [];
    list.push(rule);
    rulesByDimension.set(rule.dimension, list);
  }
  const requiredCount = (rules ?? []).filter((r) => r.requirement === "required").length;

  // --- data needed to actually render the editors (only once we have a document) ---
  const sectionValues = new Map<string, unknown>();
  const attachmentsByField = new Map<string, { id: string; fileName: string; url: string | null }[]>();
  let inheritedDao: { documentId: string; ownerName: string } | null = null;
  let inheritedFa: { documentId: string; ownerName: string } | null = null;
  const inheritedDaoValues = new Map<string, unknown>();
  const inheritedFaValues = new Map<string, unknown>();
  const goalsByType = new Map<string, GoalWithProgress[]>();
  let parentGoalOptions: { id: string; label: string }[] = [];
  let actionSteps: ActionStepWithGoal[] = [];
  let ownGoalOptions: { id: string; label: string }[] = [];

  if (document && cycle) {
    const { data: sections } = await supabase
      .from("sandbox_sections")
      .select("field_key, field_value")
      .eq("document_id", document.id);
    for (const s of sections ?? []) sectionValues.set(s.field_key, s.field_value);

    const { data: attachmentRows } = await supabase
      .from("attachments")
      .select("id, section_field_key, storage_path, file_name")
      .eq("document_id", document.id);
    if (attachmentRows && attachmentRows.length > 0) {
      const paths = attachmentRows.map((a) => a.storage_path);
      const { data: signed } = await supabase.storage
        .from("sandbox-attachments")
        .createSignedUrls(paths, 3600);
      const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
      for (const a of attachmentRows) {
        const list = attachmentsByField.get(a.section_field_key ?? "") ?? [];
        list.push({ id: a.id, fileName: a.file_name, url: urlByPath.get(a.storage_path) ?? null });
        attachmentsByField.set(a.section_field_key ?? "", list);
      }
    }

    const hasViewOnlyDao = (rulesByDimension.get("dao") ?? []).some((r) => r.requirement === "view_only");
    const hasViewOnlyFa = (rulesByDimension.get("fa") ?? []).some((r) => r.requirement === "view_only");
    if (hasViewOnlyDao || hasViewOnlyFa) {
      const ancestor = await findAncestorDocument(supabase, profile.manager_id, cycle.id);
      if (ancestor) {
        const { data: ancestorSections } = await supabase
          .from("sandbox_sections")
          .select("field_key, field_value")
          .eq("document_id", ancestor.documentId);
        if (hasViewOnlyDao) {
          inheritedDao = ancestor;
          for (const s of ancestorSections ?? []) inheritedDaoValues.set(s.field_key, s.field_value);
        }
        if (hasViewOnlyFa) {
          inheritedFa = ancestor;
          for (const s of ancestorSections ?? []) inheritedFaValues.set(s.field_key, s.field_value);
        }
      }
    }

    const goalFieldKeys = (rulesByDimension.get("shu") ?? [])
      .map((r) => r.field_key)
      .filter((k): k is keyof typeof GOAL_TYPE_BY_FIELD_KEY => k in GOAL_TYPE_BY_FIELD_KEY);
    if (goalFieldKeys.length > 0) {
      const goalTypes = goalFieldKeys.map((k) => GOAL_TYPE_BY_FIELD_KEY[k]);
      const [{ data: goalRows }, ancestorGoals] = await Promise.all([
        supabase
          .from("goals")
          .select(
            "id, goal_type, title, description, target_value, goal_planning, implementation_step, start_date, end_date, status, parent_goal_id"
          )
          .eq("document_id", document.id)
          .in("goal_type", goalTypes)
          .order("created_at", { ascending: true }),
        findAncestorGoals(supabase, profile.manager_id, cycle.id),
      ]);
      parentGoalOptions = ancestorGoals;
      const parentLabelById = new Map(parentGoalOptions.map((o) => [o.id, o.label]));
      const goalIds = (goalRows ?? []).map((g) => g.id);
      const { data: progressRows } = goalIds.length
        ? await supabase
            .from("goal_progress_updates")
            .select("id, goal_id, period_label, completion_pct, notes")
            .in("goal_id", goalIds)
            .order("created_at", { ascending: false })
        : { data: [] as { id: string; goal_id: string; period_label: string; completion_pct: number; notes: string | null }[] };

      for (const g of goalRows ?? []) {
        const list = goalsByType.get(g.goal_type) ?? [];
        list.push({
          ...g,
          parentTitle: g.parent_goal_id ? parentLabelById.get(g.parent_goal_id) ?? null : null,
          progress: (progressRows ?? []).filter((p) => p.goal_id === g.id),
        });
        goalsByType.set(g.goal_type, list);
      }
    }

    const hasActionStepField = (rulesByDimension.get("shu") ?? []).some((r) =>
      ACTION_STEP_FIELD_KEYS.includes(r.field_key as (typeof ACTION_STEP_FIELD_KEYS)[number])
    );
    if (hasActionStepField) {
      const { data: stepRows } = await supabase
        .from("action_steps")
        .select(
          "id, related_weakness_threat, solution_plan, implementation_steps, owner, deadline, status, progress_note, help_needed, goal_id"
        )
        .eq("document_id", document.id)
        .order("created_at", { ascending: true });
      const allOwnGoals = [...goalsByType.values()].flat();
      const goalTitleById = new Map(allOwnGoals.map((g) => [g.id, g.title]));
      actionSteps = (stepRows ?? []).map((s) => ({
        ...s,
        goalTitle: s.goal_id ? goalTitleById.get(s.goal_id) ?? null : null,
      }));
      ownGoalOptions = allOwnGoals.map((g) => ({ id: g.id, label: g.title }));
    }
  }

  const statusStyle: Record<string, string> = {
    draft: "border border-line bg-field text-ink-soft",
    submitted: "bg-dim-jiang-wash text-dim-jiang",
    in_review: "bg-ochre-wash text-ochre",
    needs_revision: "bg-rose-wash text-rose",
    approved: "bg-jade-wash text-jade",
  };
  const statusLabel: Record<string, string> = {
    draft: t.admin.overview.statusDraft,
    submitted: t.admin.overview.statusSubmitted,
    in_review: t.admin.overview.statusInReview,
    needs_revision: t.admin.overview.statusNeedsRevision,
    approved: t.admin.overview.statusApproved,
  };

  // dimensions that actually have something to show for this role, in fixed
  // 道法将势器术天地 order, each flagged done once every required item in it is filled
  const dims = DIMENSION_ORDER.map((dimension) => {
    const fields = rulesByDimension.get(dimension) ?? [];
    const renderableFields = fields.filter(
      (f) =>
        !GOAL_RECORD_FIELD_KEYS.includes(f.field_key as (typeof GOAL_RECORD_FIELD_KEYS)[number]) &&
        !ACTION_STEP_FIELD_KEYS.includes(f.field_key as (typeof ACTION_STEP_FIELD_KEYS)[number])
    );
    const goalFields = fields.filter((f) => f.field_key in GOAL_TYPE_BY_FIELD_KEY);
    const actionStepFields = fields.filter((f) =>
      ACTION_STEP_FIELD_KEYS.includes(f.field_key as (typeof ACTION_STEP_FIELD_KEYS)[number])
    );
    const requiredSectionFields = renderableFields.filter((f) => f.requirement === "required");
    const requiredGoalFields = goalFields.filter((f) => f.requirement === "required");
    const requiredActionStepFields = actionStepFields.filter((f) => f.requirement === "required");
    // satisfied: every required item in this dimension is filled — true vacuously when
    // there's nothing required here, so a dimension with no required fields never blocks
    // submission. done (below) additionally requires something required to exist, so the
    // rail dot only lights up for dimensions that actually had something to check off.
    const satisfied =
      requiredSectionFields.every(
        (f) =>
          isFilled(sectionValues.get(f.field_key)) ||
          (attachmentsByField.get(f.field_key)?.length ?? 0) > 0
      ) &&
      requiredGoalFields.every((f) => (goalsByType.get(GOAL_TYPE_BY_FIELD_KEY[f.field_key]) ?? []).length > 0) &&
      (requiredActionStepFields.length === 0 || actionSteps.length > 0);
    const done =
      requiredSectionFields.length + requiredGoalFields.length + requiredActionStepFields.length > 0 && satisfied;
    return { dimension, renderableFields, goalFields, actionStepFields, done, satisfied };
  }).filter((d) => d.renderableFields.length > 0 || d.goalFields.length > 0 || d.actionStepFields.length > 0);

  const allDone = dims.length > 0 && dims.every((d) => d.satisfied);
  const canSubmit = document ? document.status === "draft" || document.status === "needs_revision" : false;
  // fields lock once submitted for review, matching the reference demo — but goals and
  // action steps stay editable throughout (see ActionStepsPanel/GoalsPanel), since those are
  // meant to keep tracking progress across the year regardless of the sandbox's own review state.
  const fieldsLocked = document
    ? document.status === "submitted" || document.status === "in_review" || document.status === "approved"
    : false;

  const activeDim = dims.find((d) => d.dimension === requestedDim) ?? dims[0];
  const activeIndex = activeDim ? dims.indexOf(activeDim) : -1;
  const nextDim = activeIndex >= 0 ? dims[activeIndex + 1] : undefined;

  const inheritedValues =
    activeDim?.dimension === "dao" ? inheritedDaoValues : activeDim?.dimension === "fa" ? inheritedFaValues : null;
  const inheritedOwner =
    activeDim?.dimension === "dao" ? inheritedDao?.ownerName : activeDim?.dimension === "fa" ? inheritedFa?.ownerName : undefined;

  return (
    <>
      <AppHeader
        locale={locale}
        right={
          <>
            <span className="hidden text-sm text-ink-soft sm:inline">
              {profile.full_name} · {getRoleLabel(locale, profile.role)}
            </span>
            <LanguageSwitcher locale={locale} />
            {profile.role !== "employee" && (
              <a href="/review" className="text-xs text-ink-soft underline decoration-line underline-offset-4 hover:text-ink">
                {t.review.navLabel}
              </a>
            )}
            {isAdminTierRole(profile.role) && (
              <a href="/admin/users" className="text-xs text-ink-soft underline decoration-line underline-offset-4 hover:text-ink">
                {t.mySandbox.adminLink}
              </a>
            )}
            <form action="/auth/sign-out" method="post">
              <SignOutButton label={t.common.signOut} />
            </form>
          </>
        }
      />
      <main className="mx-auto w-full max-w-4xl px-6 py-8">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h1 className="font-serif-cn text-[26px] font-black leading-tight text-ink">{t.mySandbox.title}</h1>
            <p className="text-sm text-ink-soft">
              {getRoleLabel(locale, profile.role)}
              {cycle ? ` · ${cycle.name}` : ""}
            </p>
          </div>
          {cycle && document && (
            <div className="flex flex-wrap items-center gap-2.5 text-sm text-ink-soft">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusStyle[document.status] ?? statusStyle.draft}`}>
                {statusLabel[document.status] ?? document.status}
              </span>
              <span>
                {t.mySandbox.cadenceLabel}：
                {cycle.update_cadence === "quarterly" ? t.mySandbox.quarterly : t.mySandbox.monthly}
              </span>
              <span>{t.mySandbox.requiredCountLabel.replace("{count}", String(requiredCount))}</span>
            </div>
          )}
        </div>

        {cycle && document && canSubmit && (
          <div className="mb-5">
            {allDone ? (
              <form action={submitDocument}>
                <input type="hidden" name="document_id" value={document.id} />
                <button
                  type="submit"
                  className="rounded-md bg-seal px-4 py-2 text-sm font-bold text-paper-raised hover:bg-seal-strong"
                >
                  {t.mySandbox.submitButton}
                </button>
              </form>
            ) : (
              <p className="text-xs text-ink-faint">{t.mySandbox.submitIncompleteHint}</p>
            )}
          </div>
        )}
        {cycle && document && document.status === "submitted" && (
          <p className="mb-5 text-xs text-ink-faint">{t.mySandbox.submittedNotice}</p>
        )}

        {!cycle && (
          <p className="rounded-md border border-ochre/30 bg-ochre-wash px-4 py-3 text-sm text-ochre">
            {t.mySandbox.noActiveCycle}
          </p>
        )}

        {document && activeDim && (
          <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-[84px_1fr]">
            <div className="flex flex-row gap-1 overflow-x-auto sm:sticky sm:top-[68px] sm:flex-col sm:overflow-visible">
              {dims.map(({ dimension, done }) => {
                const isActive = dimension === activeDim.dimension;
                return (
                  <a
                    key={dimension}
                    href={`/my-sandbox?dim=${dimension}`}
                    className={`relative flex shrink-0 items-center justify-center rounded-lg px-2 py-2.5 font-serif-cn text-2xl font-black transition-colors ${
                      isActive ? "bg-ink text-paper-raised" : "text-ink-soft hover:bg-field"
                    }`}
                  >
                    {getDimensionGlyph(dimension)}
                    {done && (
                      <span className="absolute right-1.5 top-1.5 h-[7px] w-[7px] rounded-full bg-jade" />
                    )}
                  </a>
                );
              })}
            </div>

            <div className="rounded-xl border border-line bg-paper-raised p-5">
              <div className="mb-4 flex items-baseline gap-3">
                <span className="font-serif-cn text-4xl font-black leading-none text-ink">
                  {getDimensionGlyph(activeDim.dimension)}
                </span>
                <span className="text-sm text-ink-soft">{getDimensionSubtitle(locale, activeDim.dimension)}</span>
              </div>

              {activeDim.renderableFields.map((field) => (
                <SectionFieldEditor
                  key={field.id}
                  documentId={document!.id}
                  dimension={activeDim.dimension}
                  fieldKey={field.field_key}
                  fieldLabel={getFieldLabel(locale, field.field_key, field.field_label)}
                  requirement={field.requirement}
                  locale={locale}
                  value={sectionValues.get(field.field_key)}
                  inherited={
                    field.requirement === "view_only"
                      ? { value: inheritedValues?.get(field.field_key), ownerName: inheritedOwner ?? "" }
                      : undefined
                  }
                  attachments={attachmentsByField.get(field.field_key)}
                  locked={fieldsLocked}
                />
              ))}
              {activeDim.goalFields.map((field) => {
                const goalType = GOAL_TYPE_BY_FIELD_KEY[field.field_key];
                return (
                  <GoalsPanel
                    key={field.id}
                    documentId={document!.id}
                    goalType={goalType}
                    goals={goalsByType.get(goalType) ?? []}
                    parentGoalOptions={parentGoalOptions}
                    locale={locale}
                  />
                );
              })}
              {activeDim.actionStepFields.map((field) => (
                <ActionStepsPanel
                  key={field.id}
                  documentId={document!.id}
                  fieldLabel={getFieldLabel(locale, field.field_key, field.field_label)}
                  hint={FIELD_HINTS[field.field_key]?.[locale]}
                  requirement={field.requirement}
                  steps={actionSteps}
                  goalOptions={ownGoalOptions}
                  activeFilter={activeStepFilter}
                  filterBaseHref={`/my-sandbox?dim=${activeDim.dimension}`}
                  todayStr={new Date().toISOString().slice(0, 10)}
                  locale={locale}
                />
              ))}

              {nextDim && (
                <div className="flex justify-end border-t border-line pt-4">
                  <a
                    href={`/my-sandbox?dim=${nextDim.dimension}`}
                    className="rounded-md border border-line px-3.5 py-1.5 text-sm text-ink-soft hover:bg-field"
                  >
                    {locale === "en" ? "Next: " : "下一项："}
                    {getDimensionGlyph(nextDim.dimension)}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        <p className="mt-8 text-xs text-ink-faint">{t.mySandbox.footerNote}</p>
      </main>
    </>
  );
}

function SignOutButton({ label }: { label: string }) {
  return (
    <button
      type="submit"
      className="rounded-md border border-line px-3 py-1.5 text-xs text-ink-soft hover:bg-paper hover:text-ink"
    >
      {label}
    </button>
  );
}
