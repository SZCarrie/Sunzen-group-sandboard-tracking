import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/locale";
import { getDict } from "@/lib/i18n/dictionary";
import {
  DIMENSION_ORDER,
  getDimensionGlyph,
  getDimensionSubtitle,
  getFieldLabel,
  getRequirementLabel,
  getRoleLabel,
  isAdminTierRole,
  type Dimension,
  type Requirement,
} from "@/lib/sandbox/dimensions";
import { updateFieldRow } from "./actions";

const ROLES = ["employee", "supervisor", "subsidiary_head", "super_admin", "group_md"] as const;

type Row = {
  role: string;
  dimension: Dimension;
  field_key: string;
  field_label: string;
  requirement: Requirement;
  data_type: string;
  sort_order: number;
};

const selectClass =
  "w-full rounded-md border border-line bg-paper-raised px-2 py-1 text-xs text-ink focus:border-seal focus:outline-none focus:ring-2 focus:ring-seal/20";

export default async function AdminSettingsPage() {
  const locale = await getLocale();
  const t = getDict(locale);
  const ts = t.admin.settings;
  const supabase = await createClient();

  // group_md has read-only oversight (Overview) but not field-rule settings.
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

  const { data: rowsData } = await supabase
    .from("role_template_rules")
    .select("role, dimension, field_key, field_label, requirement, data_type, sort_order")
    .order("sort_order", { ascending: true });

  const rows = (rowsData ?? []) as Row[];

  // one canonical entry per field_key (dimension/label/data_type are the same across
  // roles in practice; take whichever row has the lowest sort_order as the reference)
  const catalog = new Map<string, { dimension: Dimension; field_label: string; data_type: string; sort_order: number }>();
  for (const r of rows) {
    const existing = catalog.get(r.field_key);
    if (!existing || r.sort_order < existing.sort_order) {
      catalog.set(r.field_key, {
        dimension: r.dimension,
        field_label: r.field_label,
        data_type: r.data_type,
        sort_order: r.sort_order,
      });
    }
  }

  const requirementByRoleField = new Map<string, Requirement>();
  for (const r of rows) {
    requirementByRoleField.set(`${r.role}:${r.field_key}`, r.requirement);
  }

  const fieldsByDimension = new Map<Dimension, { field_key: string; field_label: string; data_type: string; sort_order: number }[]>();
  for (const [field_key, meta] of catalog) {
    const list = fieldsByDimension.get(meta.dimension) ?? [];
    list.push({ field_key, field_label: meta.field_label, data_type: meta.data_type, sort_order: meta.sort_order });
    fieldsByDimension.set(meta.dimension, list);
  }
  for (const list of fieldsByDimension.values()) list.sort((a, b) => a.sort_order - b.sort_order);

  const requirementOptions: { value: Requirement | "hidden"; label: string }[] = [
    { value: "hidden", label: ts.requirementHidden },
    { value: "required", label: getRequirementLabel(locale, "required") },
    { value: "optional", label: getRequirementLabel(locale, "optional") },
    { value: "view_only", label: getRequirementLabel(locale, "view_only") },
  ];

  return (
    <div>
      <h1 className="mb-1 font-serif-cn text-[26px] font-black text-ink">{ts.title}</h1>
      <p className="mb-6 text-sm text-ink-soft">{ts.description}</p>

      {DIMENSION_ORDER.map((dimension) => {
        const fields = fieldsByDimension.get(dimension) ?? [];
        if (fields.length === 0) return null;
        return (
          <div key={dimension} className="mb-8">
            <div className="mb-3 flex items-baseline gap-2">
              <span className="font-serif-cn text-2xl font-black text-ink">{getDimensionGlyph(dimension)}</span>
              <span className="text-sm text-ink-soft">{getDimensionSubtitle(locale, dimension)}</span>
            </div>
            <div className="overflow-x-auto rounded-lg border border-line bg-paper-raised">
              <table className="w-full table-fixed text-sm">
                <colgroup>
                  <col className="w-[20%]" />
                  {ROLES.map((role) => (
                    <col key={role} className="w-[14%]" />
                  ))}
                  <col className="w-[10%]" />
                </colgroup>
                <thead className="bg-paper-raised text-left text-ink-soft">
                  <tr>
                    <th className="px-3 py-2 font-medium">{ts.colField}</th>
                    {ROLES.map((role) => (
                      <th key={role} className="px-3 py-2 font-medium">
                        {getRoleLabel(locale, role)}
                      </th>
                    ))}
                    <th className="px-3 py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {fields.map((field) => {
                    const formId = `rule-${field.field_key}`;
                    return (
                      <tr key={field.field_key}>
                        <td className="px-3 py-2 align-middle text-ink">
                          {getFieldLabel(locale, field.field_key, field.field_label)}
                        </td>
                        {ROLES.map((role) => {
                          const current = requirementByRoleField.get(`${role}:${field.field_key}`) ?? "hidden";
                          return (
                            <td key={role} className="px-3 py-2 align-middle">
                              <select
                                name={`requirement_${role}`}
                                form={formId}
                                defaultValue={current}
                                className={selectClass}
                              >
                                {requirementOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 align-middle">
                          <form id={formId} action={updateFieldRow}>
                            <input type="hidden" name="field_key" value={field.field_key} />
                            <input type="hidden" name="dimension" value={dimension} />
                            <input type="hidden" name="field_label" value={field.field_label} />
                            <input type="hidden" name="data_type" value={field.data_type} />
                            <input type="hidden" name="sort_order" value={field.sort_order} />
                          </form>
                          <button
                            type="submit"
                            form={formId}
                            className="w-full rounded-md bg-seal px-2 py-1 text-xs font-medium text-paper-raised hover:bg-seal-strong"
                          >
                            {t.common.save}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
