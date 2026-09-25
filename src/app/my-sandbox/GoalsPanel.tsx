import { getDict, type Locale } from "@/lib/i18n/dictionary";
import { addGoalProgress, createGoal, updateGoalStatus } from "./goalActions";

type GoalType = "annual_business" | "annual_team" | "annual_personal" | "annual_work";
type GoalStatus = "not_started" | "in_progress" | "at_risk" | "completed";

export type GoalWithProgress = {
  id: string;
  title: string;
  description: string | null;
  target_value: string | null;
  goal_planning: string | null;
  implementation_step: string | null;
  start_date: string | null;
  end_date: string | null;
  status: GoalStatus;
  parent_goal_id: string | null;
  parentTitle?: string | null;
  progress: { id: string; period_label: string; completion_pct: number; notes: string | null }[];
};

const GOAL_STATUS_STYLE: Record<GoalStatus, string> = {
  not_started: "border border-line bg-field text-ink-soft",
  in_progress: "bg-ochre-wash text-ochre",
  at_risk: "bg-rose-wash text-rose",
  completed: "bg-jade-wash text-jade",
};

const inputClass = "rounded-md border border-line bg-paper-raised px-2 py-1 text-xs text-ink focus:border-seal focus:outline-none focus:ring-2 focus:ring-seal/20";

export function GoalsPanel({
  documentId,
  goalType,
  goals,
  parentGoalOptions,
  locale,
}: {
  documentId: string;
  goalType: GoalType;
  goals: GoalWithProgress[];
  parentGoalOptions: { id: string; label: string }[];
  locale: Locale;
}) {
  const t = getDict(locale).sandboxForm;
  const statusOptions: GoalStatus[] = ["not_started", "in_progress", "at_risk", "completed"];

  return (
    <div className="mb-5">
      <h3 className="mb-2 text-[15px] font-bold text-ink">{t.goalGroupTitle[goalType]}</h3>

      <div className="flex flex-col gap-3">
        {goals.map((goal) => (
          <div key={goal.id} className="rounded-md border border-line bg-field p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-ink">{goal.title}</span>
              {goal.target_value && <span className="text-xs text-ink-soft">{goal.target_value}</span>}
            </div>
            {goal.description && <p className="mb-2 text-sm text-ink-soft">{goal.description}</p>}
            {goal.goal_planning && (
              <p className="mb-1 text-sm text-ink-soft">
                <span className="font-medium text-ink">{t.goalPlanningLabel}：</span>
                {goal.goal_planning}
              </p>
            )}
            {goal.implementation_step && (
              <p className="mb-2 text-sm text-ink-soft">
                <span className="font-medium text-ink">{t.implementationStepLabel}：</span>
                {goal.implementation_step}
              </p>
            )}
            {(goal.start_date || goal.end_date) && (
              <p className="mb-2 text-xs text-ink-faint">
                {goal.start_date ?? "—"} → {goal.end_date ?? "—"}
              </p>
            )}
            {goal.parentTitle && (
              <p className="mb-2 text-xs text-ink-faint">
                ↳ {t.linkedToLabel}：{goal.parentTitle}
              </p>
            )}
            {goal.progress.length > 0 && (
              <div className="mb-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-raised">
                  <div
                    className="h-full rounded-full bg-jade"
                    style={{ width: `${Math.max(0, Math.min(100, goal.progress[0].completion_pct))}%` }}
                  />
                </div>
                <span className="text-xs text-ink-soft">{goal.progress[0].completion_pct}%</span>
              </div>
            )}

            <form action={updateGoalStatus} className="mb-3 flex items-center gap-2">
              <input type="hidden" name="goal_id" value={goal.id} />
              <input type="hidden" name="document_id" value={documentId} />
              <select
                name="status"
                defaultValue={goal.status}
                className={`${inputClass} ${GOAL_STATUS_STYLE[goal.status]}`}
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {t.goalStatus[s]}
                  </option>
                ))}
              </select>
              <button type="submit" className="rounded-md border border-line px-2 py-1 text-xs text-ink-soft hover:bg-paper-raised">
                {t.save}
              </button>
            </form>

            <p className="mb-1 text-xs font-medium text-ink-soft">{t.progressHistory}</p>
            {goal.progress.length > 0 ? (
              <ul className="mb-2 flex flex-col gap-1">
                {goal.progress.map((p) => (
                  <li key={p.id} className="text-xs text-ink-soft">
                    <span className="font-medium text-ink">{p.period_label}</span> · {p.completion_pct}%
                    {p.notes ? ` · ${p.notes}` : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-2 text-xs text-ink-faint">{t.noProgressYet}</p>
            )}

            <form action={addGoalProgress} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="goal_id" value={goal.id} />
              <input type="hidden" name="document_id" value={documentId} />
              <input
                type="text"
                name="period_label"
                placeholder={t.periodPlaceholder}
                required
                className={`w-40 ${inputClass}`}
              />
              <input
                type="number"
                name="completion_pct"
                min={0}
                max={100}
                placeholder={t.completionPctLabel}
                required
                className={`w-24 ${inputClass}`}
              />
              <input
                type="text"
                name="notes"
                placeholder={t.notesPlaceholder}
                className={`w-40 ${inputClass}`}
              />
              <button type="submit" className="rounded-md border border-line px-2 py-1 text-xs text-ink-soft hover:bg-paper-raised">
                {t.addProgress}
              </button>
            </form>
          </div>
        ))}
        {goals.length === 0 && <p className="text-sm text-ink-faint">{t.noGoalsYet}</p>}
      </div>

      <form action={createGoal} className="mt-3 flex flex-wrap items-center gap-2">
        <input type="hidden" name="document_id" value={documentId} />
        <input type="hidden" name="goal_type" value={goalType} />
        <input
          type="text"
          name="title"
          placeholder={t.titlePlaceholder}
          required
          className={`w-40 text-sm ${inputClass}`}
        />
        <input
          type="text"
          name="description"
          placeholder={t.descriptionPlaceholder}
          className={`w-48 text-sm ${inputClass}`}
        />
        <input
          type="text"
          name="target_value"
          placeholder={t.targetValuePlaceholder}
          className={`w-32 text-sm ${inputClass}`}
        />
        <input
          type="text"
          name="goal_planning"
          placeholder={t.goalPlanningPlaceholder}
          className={`w-48 text-sm ${inputClass}`}
        />
        <input
          type="text"
          name="implementation_step"
          placeholder={t.implementationStepPlaceholder}
          className={`w-48 text-sm ${inputClass}`}
        />
        {parentGoalOptions.length > 0 && (
          <select name="parent_goal_id" defaultValue="" className={`text-sm ${inputClass}`} aria-label={t.parentGoalLabel}>
            <option value="">{t.noParentGoal}</option>
            {parentGoalOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        )}
        <label className="flex items-center gap-1 text-xs text-ink-soft">
          {t.startDate}
          <input type="date" name="start_date" className={`text-sm ${inputClass}`} />
        </label>
        <label className="flex items-center gap-1 text-xs text-ink-soft">
          {t.endDate}
          <input type="date" name="end_date" className={`text-sm ${inputClass}`} />
        </label>
        <button type="submit" className="rounded-md bg-seal px-3 py-1.5 text-xs font-medium text-paper-raised hover:bg-seal-strong">
          {t.addGoal}
        </button>
      </form>
    </div>
  );
}
