import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/locale";
import { getDict } from "@/lib/i18n/dictionary";
import { isAdminTierRole } from "@/lib/sandbox/dimensions";
import { createCycle, updateCycle } from "./actions";

type Cycle = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  update_cadence: "quarterly" | "monthly";
  status: "draft" | "active" | "closed";
};

const fieldClass =
  "w-full rounded-md border border-line bg-paper-raised px-2 py-1 text-sm text-ink focus:border-seal focus:outline-none focus:ring-2 focus:ring-seal/20";

export default async function AdminCyclesPage() {
  const locale = await getLocale();
  const t = getDict(locale);
  const tc = t.admin.cycles;
  const supabase = await createClient();

  // group_md has read-only oversight (Overview) but not cycle management.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: viewerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .maybeSingle();
  if (!viewerProfile || !isAdminTierRole(viewerProfile.role)) {
    return <p className="text-sm text-rose">{t.common.noPermission}</p>;
  }

  const { data: cyclesData } = await supabase
    .from("sandbox_cycles")
    .select("id, name, start_date, end_date, update_cadence, status")
    .order("start_date", { ascending: false });

  const cycles = (cyclesData ?? []) as Cycle[];

  return (
    <div>
      <h1 className="mb-1 font-serif-cn text-[26px] font-black text-ink">{tc.title}</h1>
      <p className="mb-6 text-sm text-ink-soft">{tc.description}</p>

      <div className="overflow-x-auto rounded-lg border border-line bg-paper-raised">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[28%]" />
            <col className="w-[16%]" />
            <col className="w-[16%]" />
            <col className="w-[10%]" />
          </colgroup>
          <thead className="bg-paper-raised text-left text-ink-soft">
            <tr>
              <th className="px-3 py-2 font-medium">{tc.colName}</th>
              <th className="px-3 py-2 font-medium">{tc.colDates}</th>
              <th className="px-3 py-2 font-medium">{tc.colCadence}</th>
              <th className="px-3 py-2 font-medium">{tc.colStatus}</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {cycles.map((cycle) => {
              const formId = `cycle-${cycle.id}`;
              return (
                <tr key={cycle.id}>
                  <td className="px-3 py-2 align-middle">
                    <input type="text" name="name" form={formId} defaultValue={cycle.name} className={fieldClass} />
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <div className="flex items-center gap-1.5">
                      <input type="date" name="start_date" form={formId} defaultValue={cycle.start_date} className={fieldClass} />
                      <span className="text-ink-faint">→</span>
                      <input type="date" name="end_date" form={formId} defaultValue={cycle.end_date} className={fieldClass} />
                    </div>
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <select name="update_cadence" form={formId} defaultValue={cycle.update_cadence} className={fieldClass}>
                      <option value="quarterly">{tc.cadenceQuarterly}</option>
                      <option value="monthly">{tc.cadenceMonthly}</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <select name="status" form={formId} defaultValue={cycle.status} className={fieldClass}>
                      <option value="draft">{tc.statusDraft}</option>
                      <option value="active">{tc.statusActive}</option>
                      <option value="closed">{tc.statusClosed}</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <form id={formId} action={updateCycle}>
                      <input type="hidden" name="id" value={cycle.id} />
                    </form>
                    <button
                      type="submit"
                      form={formId}
                      className="w-full rounded-md bg-seal px-3 py-1 text-xs font-medium text-paper-raised hover:bg-seal-strong"
                    >
                      {t.common.save}
                    </button>
                  </td>
                </tr>
              );
            })}
            {cycles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-ink-faint">
                  {tc.empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mb-2 mt-8 text-sm font-medium text-ink">{tc.addTitle}</h2>
      <form action={createCycle} className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          name="name"
          placeholder={tc.namePlaceholder}
          required
          className="w-40 rounded-md border border-line bg-paper-raised px-2 py-1 text-sm text-ink focus:border-seal focus:outline-none focus:ring-2 focus:ring-seal/20"
        />
        <label className="flex items-center gap-1 text-xs text-ink-soft">
          {tc.startLabel}
          <input type="date" name="start_date" required className="rounded-md border border-line bg-paper-raised px-2 py-1 text-sm text-ink focus:border-seal focus:outline-none focus:ring-2 focus:ring-seal/20" />
        </label>
        <label className="flex items-center gap-1 text-xs text-ink-soft">
          {tc.endLabel}
          <input type="date" name="end_date" required className="rounded-md border border-line bg-paper-raised px-2 py-1 text-sm text-ink focus:border-seal focus:outline-none focus:ring-2 focus:ring-seal/20" />
        </label>
        <select name="update_cadence" defaultValue="quarterly" className="rounded-md border border-line bg-paper-raised px-2 py-1 text-sm text-ink focus:border-seal focus:outline-none focus:ring-2 focus:ring-seal/20">
          <option value="quarterly">{tc.cadenceQuarterly}</option>
          <option value="monthly">{tc.cadenceMonthly}</option>
        </select>
        <select name="status" defaultValue="draft" className="rounded-md border border-line bg-paper-raised px-2 py-1 text-sm text-ink focus:border-seal focus:outline-none focus:ring-2 focus:ring-seal/20">
          <option value="draft">{tc.statusDraft}</option>
          <option value="active">{tc.statusActive}</option>
          <option value="closed">{tc.statusClosed}</option>
        </select>
        <button
          type="submit"
          className="rounded-md bg-seal px-3 py-1 text-xs font-medium text-paper-raised hover:bg-seal-strong"
        >
          {t.common.create}
        </button>
      </form>
    </div>
  );
}
