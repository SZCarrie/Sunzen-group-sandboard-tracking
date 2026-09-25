import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/locale";
import { getDict } from "@/lib/i18n/dictionary";
import { getRoleLabel } from "@/lib/sandbox/dimensions";

type Profile = {
  id: string;
  full_name: string;
  role: string;
  organization_id: string | null;
};

type DocStatus = "draft" | "submitted" | "in_review" | "needs_revision" | "approved";

type Doc = {
  id: string;
  owner_id: string;
  status: DocStatus;
  updated_at: string;
};

type GoalStatus = "not_started" | "in_progress" | "at_risk" | "completed";

type Goal = {
  id: string;
  document_id: string;
  status: GoalStatus;
  title: string;
  target_value: string | null;
};

type ActionStepStatus = "not_started" | "in_progress" | "completed" | "stuck";
type ActionStep = {
  document_id: string;
  deadline: string | null;
  status: ActionStepStatus;
  solution_plan: string | null;
  related_weakness_threat: string | null;
};

const GOAL_STATUS_STYLE: Record<GoalStatus, string> = {
  not_started: "border border-line bg-field text-ink-soft",
  in_progress: "bg-ochre-wash text-ochre",
  at_risk: "bg-rose-wash text-rose",
  completed: "bg-jade-wash text-jade",
};

export default async function AdminOverviewPage() {
  const locale = await getLocale();
  const t = getDict(locale);
  const tv = t.admin.overview;
  const supabase = await createClient();

  const { data: cycle } = await supabase
    .from("sandbox_cycles")
    .select("id, name")
    .eq("status", "active")
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!cycle) {
    return (
      <div>
        <h1 className="mb-1 font-serif-cn text-[26px] font-black text-ink">{tv.title}</h1>
        <p className="text-sm text-ochre">{tv.noCycle}</p>
      </div>
    );
  }

  const [{ data: profilesData }, { data: docsData }, { data: orgsData }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role, organization_id").order("full_name"),
    supabase
      .from("sandbox_documents")
      .select("id, owner_id, status, updated_at")
      .eq("cycle_id", cycle.id),
    supabase.from("organizations").select("id, name"),
  ]);

  const profiles = (profilesData ?? []) as Profile[];
  const docs = (docsData ?? []) as Doc[];
  const orgs = new Map((orgsData ?? []).map((o) => [o.id as string, o.name as string]));
  const docByOwner = new Map(docs.map((d) => [d.owner_id, d]));
  const ownerByDocId = new Map(docs.map((d) => [d.id, d.owner_id]));
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const docIds = docs.map((d) => d.id);

  const [{ data: goalsData }, { data: stepsData }] = await Promise.all([
    docIds.length
      ? supabase.from("goals").select("id, document_id, status, title, target_value").in("document_id", docIds)
      : Promise.resolve({ data: [] as Goal[] }),
    docIds.length
      ? supabase
          .from("action_steps")
          .select("document_id, deadline, status, solution_plan, related_weakness_threat")
          .in("document_id", docIds)
      : Promise.resolve({ data: [] as ActionStep[] }),
  ]);

  const goals = (goalsData ?? []) as Goal[];
  const todayStr = new Date().toISOString().slice(0, 10);
  const overdueActions: { ownerId: string; label: string; deadline: string }[] = [];
  for (const step of (stepsData ?? []) as ActionStep[]) {
    const isOverdue = step.status !== "completed" && !!step.deadline && step.deadline < todayStr;
    const isStuck = step.status === "stuck";
    if (isOverdue || isStuck) {
      overdueActions.push({
        ownerId: ownerByDocId.get(step.document_id) ?? "",
        label: step.solution_plan || step.related_weakness_threat || "—",
        deadline: step.deadline ?? "—",
      });
    }
  }

  const goalCountByStatus: Record<GoalStatus, number> = { not_started: 0, in_progress: 0, at_risk: 0, completed: 0 };
  for (const g of goals) goalCountByStatus[g.status]++;
  const atRiskGoals = goals.filter((g) => g.status === "at_risk");

  const statusLabel: Record<DocStatus, string> = {
    draft: tv.statusDraft,
    submitted: tv.statusSubmitted,
    in_review: tv.statusInReview,
    needs_revision: tv.statusNeedsRevision,
    approved: tv.statusApproved,
  };
  const statusStyle: Record<DocStatus, string> = {
    draft: "border border-line bg-field text-ink-soft",
    submitted: "bg-dim-jiang-wash text-dim-jiang",
    in_review: "bg-ochre-wash text-ochre",
    needs_revision: "bg-rose-wash text-rose",
    approved: "bg-jade-wash text-jade",
  };
  const goalStatusLabel: Record<GoalStatus, string> = {
    not_started: tv.statNotStarted,
    in_progress: tv.statInProgress,
    at_risk: tv.statAtRisk,
    completed: tv.statCompleted,
  };
  const docStatusCount = (status: DocStatus) => docs.filter((d) => d.status === status).length;

  // by-organization rollup: goals + overdue actions attributed via each goal's/action's document owner
  type OrgRow = { name: string; goalCount: number; overdueCount: number; completed: number };
  const orgRows = new Map<string, OrgRow>();
  const orgNameFor = (profile: Profile | undefined) =>
    profile?.organization_id ? orgs.get(profile.organization_id) ?? "—" : "—";
  for (const g of goals) {
    const owner = profileById.get(ownerByDocId.get(g.document_id) ?? "");
    const name = orgNameFor(owner);
    const row = orgRows.get(name) ?? { name, goalCount: 0, overdueCount: 0, completed: 0 };
    row.goalCount++;
    if (g.status === "completed") row.completed++;
    orgRows.set(name, row);
  }
  for (const a of overdueActions) {
    const owner = profileById.get(a.ownerId);
    const name = orgNameFor(owner);
    const row = orgRows.get(name) ?? { name, goalCount: 0, overdueCount: 0, completed: 0 };
    row.overdueCount++;
    orgRows.set(name, row);
  }

  return (
    <div>
      <h1 className="mb-1 font-serif-cn text-[26px] font-black text-ink">
        {tv.title} <span className="font-sans-cn text-base font-normal text-ink-soft">{cycle.name}</span>
      </h1>
      <p className="mb-6 text-sm text-ink-soft">{tv.description}</p>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-lg border border-line bg-paper-raised p-3">
          <p className="font-serif-cn text-3xl font-black leading-none text-ink">{goals.length}</p>
          <p className="text-xs text-ink-soft">{tv.statGoals}</p>
        </div>
        <div className="rounded-lg border border-line bg-paper-raised p-3">
          <p className="font-serif-cn text-3xl font-black leading-none text-ink-soft">{goalCountByStatus.not_started}</p>
          <p className="text-xs text-ink-soft">{tv.statNotStarted}</p>
        </div>
        <div className="rounded-lg border border-line bg-paper-raised p-3">
          <p className="font-serif-cn text-3xl font-black leading-none text-ochre">{goalCountByStatus.in_progress}</p>
          <p className="text-xs text-ink-soft">{tv.statInProgress}</p>
        </div>
        <div className="rounded-lg border border-line bg-paper-raised p-3">
          <p className="font-serif-cn text-3xl font-black leading-none text-rose">{goalCountByStatus.at_risk}</p>
          <p className="text-xs text-ink-soft">{tv.statAtRisk}</p>
        </div>
        <div className="rounded-lg border border-line bg-paper-raised p-3">
          <p className="font-serif-cn text-3xl font-black leading-none text-jade">{goalCountByStatus.completed}</p>
          <p className="text-xs text-ink-soft">{tv.statCompleted}</p>
        </div>
        <div className="rounded-lg border border-line bg-paper-raised p-3">
          <p className="font-serif-cn text-3xl font-black leading-none text-rose">{overdueActions.length}</p>
          <p className="text-xs text-ink-soft">{tv.statOverdueActions}</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-lg border border-line bg-paper-raised p-4">
          <h2 className="mb-3 text-sm font-bold text-ink">{tv.needsAttentionTitle}</h2>
          {atRiskGoals.length + overdueActions.length === 0 ? (
            <p className="text-sm text-ink-faint">{tv.needsAttentionEmpty}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {atRiskGoals.map((g) => {
                const ownerId = ownerByDocId.get(g.document_id);
                const owner = ownerId ? profileById.get(ownerId) : undefined;
                const doc = ownerId ? docByOwner.get(ownerId) : undefined;
                return (
                  <li key={g.id} className="flex items-center gap-3 py-2.5">
                    <span className="shrink-0 rounded-full bg-rose-wash px-2.5 py-0.5 text-xs font-bold text-rose">
                      {tv.attentionAtRisk}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink">{g.title}</p>
                      <p className="truncate text-xs text-ink-soft">
                        {owner?.full_name ?? "—"}
                        {g.target_value ? ` · ${g.target_value}` : ""}
                      </p>
                    </div>
                    {doc && (
                      <Link
                        href={`/admin/documents/${doc.id}`}
                        className="shrink-0 rounded-md border border-line px-2.5 py-1 text-xs text-ink-soft hover:bg-field"
                      >
                        {tv.viewShort}
                      </Link>
                    )}
                  </li>
                );
              })}
              {overdueActions.map((a, i) => {
                const owner = profileById.get(a.ownerId);
                const doc = docByOwner.get(a.ownerId);
                return (
                  <li key={`overdue-${i}`} className="flex items-center gap-3 py-2.5">
                    <span className="shrink-0 rounded-full bg-rose-wash px-2.5 py-0.5 text-xs font-bold text-rose">
                      {tv.attentionOverdue}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink">{a.label}</p>
                      <p className="truncate text-xs text-ink-soft">
                        {owner?.full_name ?? "—"} · {a.deadline}
                      </p>
                    </div>
                    {doc && (
                      <Link
                        href={`/admin/documents/${doc.id}`}
                        className="shrink-0 rounded-md border border-line px-2.5 py-1 text-xs text-ink-soft hover:bg-field"
                      >
                        {tv.viewShort}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-line bg-paper-raised p-4">
            <h2 className="mb-3 text-sm font-bold text-ink">{tv.byOrgTitle}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-ink-soft">
                  <tr>
                    <th className="pb-2 pr-2 text-xs font-medium">{tv.colOrgName}</th>
                    <th className="pb-2 pr-2 text-xs font-medium">{tv.colGoalCount}</th>
                    <th className="pb-2 pr-2 text-xs font-medium">{tv.colOverdue}</th>
                    <th className="pb-2 text-xs font-medium">{tv.colAvgStatus}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {[...orgRows.values()].map((row) => (
                    <tr key={row.name}>
                      <td className="py-1.5 pr-2 text-ink">{row.name}</td>
                      <td className="py-1.5 pr-2 text-ink-soft">{row.goalCount}</td>
                      <td className="py-1.5 pr-2 text-ink-soft">{row.overdueCount || "—"}</td>
                      <td className="py-1.5 text-ink-soft">
                        {row.goalCount ? `${Math.round((row.completed / row.goalCount) * 100)}%` : "—"}
                      </td>
                    </tr>
                  ))}
                  {orgRows.size === 0 && (
                    <tr>
                      <td colSpan={4} className="py-3 text-center text-ink-faint">
                        {tv.empty}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-line bg-paper-raised p-4">
            <h2 className="mb-3 text-sm font-bold text-ink">{tv.submissionStatusTitle}</h2>
            <div className="flex flex-wrap gap-2">
              {(["draft", "submitted", "in_review", "needs_revision", "approved"] as DocStatus[]).map((s) => (
                <span key={s} className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusStyle[s]}`}>
                  {statusLabel[s]} {docStatusCount(s)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <h2 className="mb-2 text-sm font-bold text-ink">{tv.detailTableTitle}</h2>
      <div className="overflow-hidden rounded-lg border border-line bg-paper-raised">
        <table className="w-full text-sm">
          <thead className="bg-paper-raised text-left text-ink-soft">
            <tr>
              <th className="px-3 py-2 font-medium">{tv.colName}</th>
              <th className="px-3 py-2 font-medium">{tv.colRole}</th>
              <th className="px-3 py-2 font-medium">{tv.colOrg}</th>
              <th className="px-3 py-2 font-medium">{tv.colStatus}</th>
              <th className="px-3 py-2 font-medium">{tv.colUpdated}</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {profiles.map((profile) => {
              const doc = docByOwner.get(profile.id);
              return (
                <tr key={profile.id}>
                  <td className="px-3 py-2 font-medium">{profile.full_name}</td>
                  <td className="px-3 py-2 text-xs text-ink-soft">
                    {getRoleLabel(locale, profile.role)}
                  </td>
                  <td className="px-3 py-2 text-xs text-ink-soft">
                    {profile.organization_id ? orgs.get(profile.organization_id) ?? "—" : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {doc ? (
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusStyle[doc.status]}`}>
                        {statusLabel[doc.status]}
                      </span>
                    ) : (
                      <span className="text-xs text-ink-faint">{tv.noDocument}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-ink-soft">
                    {doc ? new Date(doc.updated_at).toLocaleDateString(locale) : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {doc && (
                      <Link
                        href={`/admin/documents/${doc.id}`}
                        className="text-xs text-seal underline decoration-line underline-offset-2 hover:text-seal-strong"
                      >
                        {tv.viewAction}
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
            {profiles.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-ink-faint">
                  {tv.empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
