import { getDict, type Locale } from "@/lib/i18n/dictionary";
import { getRequirementLabel, type Requirement } from "@/lib/sandbox/dimensions";
import { createActionStep, updateActionStepProgress, updateActionStepStatus } from "./actionStepActions";

type ActionStepStatus = "not_started" | "in_progress" | "completed" | "stuck";
export type ActionStepFilter = "all" | "attention" | "open";

export type ActionStepWithGoal = {
  id: string;
  related_weakness_threat: string | null;
  solution_plan: string | null;
  implementation_steps: string | null;
  owner: string | null;
  deadline: string | null;
  status: ActionStepStatus;
  progress_note: string | null;
  help_needed: string | null;
  goal_id: string | null;
  goalTitle?: string | null;
};

const REQUIREMENT_STYLE: Record<Requirement, string> = {
  required: "bg-rose-wash text-rose",
  optional: "bg-ochre-wash text-ochre",
  view_only: "border border-line bg-field text-ink-soft",
  not_applicable: "border border-line bg-field text-ink-faint",
};

const STATUS_STYLE: Record<ActionStepStatus, string> = {
  not_started: "border border-line bg-field text-ink-soft",
  in_progress: "bg-ochre-wash text-ochre",
  completed: "bg-jade-wash text-jade",
  stuck: "bg-rose-wash text-rose",
};

const inputClass =
  "rounded-md border border-line bg-paper-raised px-2 py-1 text-xs text-ink focus:border-seal focus:outline-none focus:ring-2 focus:ring-seal/20";

export function isActionStepOverdue(step: { status: ActionStepStatus; deadline: string | null }, todayStr: string): boolean {
  return step.status !== "completed" && !!step.deadline && step.deadline < todayStr;
}

export function ActionStepsPanel({
  documentId,
  fieldLabel,
  hint,
  requirement,
  steps,
  goalOptions,
  activeFilter,
  filterBaseHref,
  todayStr,
  locale,
}: {
  documentId: string;
  fieldLabel: string;
  hint?: string;
  requirement: Requirement;
  steps: ActionStepWithGoal[];
  goalOptions: { id: string; label: string }[];
  activeFilter: ActionStepFilter;
  filterBaseHref: string;
  todayStr: string;
  locale: Locale;
}) {
  const t = getDict(locale).sandboxForm;
  const statusOptions: ActionStepStatus[] = ["not_started", "in_progress", "completed", "stuck"];

  const filters: { key: ActionStepFilter; label: string }[] = [
    { key: "all", label: t.actionStepFilterAll },
    { key: "attention", label: t.actionStepFilterAttention },
    { key: "open", label: t.actionStepFilterOpen },
  ];
  const visibleSteps = steps.filter((s) => {
    if (activeFilter === "attention") return s.status === "stuck" || isActionStepOverdue(s, todayStr);
    if (activeFilter === "open") return s.status !== "completed";
    return true;
  });

  return (
    <div className="mb-5">
      <div className="mb-0.5 flex items-center justify-between gap-3">
        <span className="text-[15px] font-bold text-ink">{fieldLabel}</span>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${REQUIREMENT_STYLE[requirement]}`}>
          {getRequirementLabel(locale, requirement)}
        </span>
      </div>
      {hint && <p className="mb-1.5 text-[13px] text-ink-soft">{hint}</p>}

      <div className="mb-3 flex flex-wrap gap-1.5">
        {filters.map((f) => (
          <a
            key={f.key}
            href={f.key === "all" ? filterBaseHref : `${filterBaseHref}&stepFilter=${f.key}`}
            className={`rounded-full px-3 py-1 text-xs ${
              activeFilter === f.key ? "bg-ink text-paper-raised" : "border border-line text-ink-soft hover:bg-field"
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {visibleSteps.map((step) => {
          const overdue = isActionStepOverdue(step, todayStr);
          return (
            <div key={step.id} className="rounded-md border border-line bg-field p-3">
              {step.related_weakness_threat && (
                <p className="text-sm font-medium text-ink">{step.related_weakness_threat}</p>
              )}
              {step.solution_plan && <p className="mt-1 text-sm text-ink-soft">{step.solution_plan}</p>}
              {step.implementation_steps && (
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink-soft">{step.implementation_steps}</p>
              )}
              <p className="mt-1 text-xs text-ink-faint">
                {[step.owner, step.deadline].filter(Boolean).join(" · ")}
                {step.goalTitle ? ` · ↳ ${step.goalTitle}` : ""}
              </p>

              <div className="mt-2 flex items-center gap-2">
                <form action={updateActionStepStatus} className="flex items-center gap-2">
                  <input type="hidden" name="step_id" value={step.id} />
                  <input type="hidden" name="document_id" value={documentId} />
                  <select name="status" defaultValue={step.status} className={`${inputClass} ${STATUS_STYLE[step.status]}`}>
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {t.actionStepStatus[s]}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="rounded-md border border-line px-2 py-1 text-xs text-ink-soft hover:bg-paper-raised">
                    {t.save}
                  </button>
                </form>
                {overdue && (
                  <span className="rounded-full bg-rose-wash px-2 py-0.5 text-xs font-bold text-rose">{t.overdueBadge}</span>
                )}
              </div>

              {(step.progress_note || step.help_needed) && (
                <div className="mt-2 rounded-md bg-paper-raised p-2 text-xs text-ink-soft">
                  {step.progress_note && (
                    <p>
                      <span className="font-medium text-ink">{t.progressNoteLabel}：</span>
                      {step.progress_note}
                    </p>
                  )}
                  {step.help_needed && (
                    <p className="mt-1 text-rose">
                      <span className="font-medium">{t.helpNeededLabel}：</span>
                      {step.help_needed}
                    </p>
                  )}
                </div>
              )}

              <form action={updateActionStepProgress} className="mt-2 flex flex-wrap items-center gap-2">
                <input type="hidden" name="step_id" value={step.id} />
                <input type="hidden" name="document_id" value={documentId} />
                <input
                  type="text"
                  name="progress_note"
                  defaultValue={step.progress_note ?? ""}
                  placeholder={t.progressNotePlaceholder}
                  className={`w-40 ${inputClass}`}
                />
                <input
                  type="text"
                  name="help_needed"
                  defaultValue={step.help_needed ?? ""}
                  placeholder={t.helpNeededPlaceholder}
                  className={`w-40 ${inputClass}`}
                />
                <button type="submit" className="rounded-md border border-line px-2 py-1 text-xs text-ink-soft hover:bg-paper-raised">
                  {t.saveProgressButton}
                </button>
              </form>
            </div>
          );
        })}
        {visibleSteps.length === 0 && <p className="text-sm text-ink-faint">{t.noActionStepsYet}</p>}
      </div>

      <form action={createActionStep} className="mt-3 flex flex-wrap items-center gap-2">
        <input type="hidden" name="document_id" value={documentId} />
        <input
          type="text"
          name="related_weakness_threat"
          placeholder={t.relatedWeaknessPlaceholder}
          className={`w-40 text-sm ${inputClass}`}
        />
        <input type="text" name="solution_plan" placeholder={t.solutionPlanPlaceholder} className={`w-40 text-sm ${inputClass}`} />
        <input
          type="text"
          name="implementation_steps"
          placeholder={t.implementationStepsPlaceholder}
          className={`w-48 text-sm ${inputClass}`}
        />
        <input type="text" name="owner" placeholder={t.ownerPlaceholder} className={`w-28 text-sm ${inputClass}`} />
        <input type="date" name="deadline" className={`text-sm ${inputClass}`} />
        {goalOptions.length > 0 && (
          <select name="goal_id" defaultValue="" className={`text-sm ${inputClass}`} aria-label={t.linkedGoalLabel}>
            <option value="">{t.noLinkedGoal}</option>
            {goalOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        )}
        <button type="submit" className="rounded-md bg-seal px-3 py-1.5 text-xs font-medium text-paper-raised hover:bg-seal-strong">
          {t.addActionStep}
        </button>
      </form>
    </div>
  );
}
