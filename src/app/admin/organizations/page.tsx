import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/locale";
import { getDict } from "@/lib/i18n/dictionary";
import { isAdminTierRole } from "@/lib/sandbox/dimensions";
import { createOrganization, updateOrganization } from "./actions";

type Organization = {
  id: string;
  name: string;
  type: "group" | "subsidiary" | "department";
  parent_id: string | null;
};

const selectClass =
  "w-full rounded-md border border-line bg-paper-raised px-2 py-1 text-sm text-ink focus:border-seal focus:outline-none focus:ring-2 focus:ring-seal/20";
const inputClass = selectClass;

export default async function AdminOrganizationsPage() {
  const locale = await getLocale();
  const t = getDict(locale);
  const to = t.admin.organizations;
  const supabase = await createClient();

  // group_md has read-only oversight (Overview) but not organization management.
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

  const { data: orgs } = await supabase
    .from("organizations")
    .select("id, name, type, parent_id")
    .order("name", { ascending: true });

  const organizations = (orgs ?? []) as Organization[];
  const typeLabel: Record<Organization["type"], string> = {
    group: to.typeGroup,
    subsidiary: to.typeSubsidiary,
    department: to.typeDepartment,
  };

  return (
    <div>
      <h1 className="mb-1 font-serif-cn text-[26px] font-black text-ink">{to.title}</h1>
      <p className="mb-6 text-sm text-ink-soft">{to.description}</p>

      <div className="overflow-x-auto rounded-lg border border-line bg-paper-raised">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col className="w-[26%]" />
            <col className="w-[16%]" />
            <col className="w-[38%]" />
            <col className="w-[10%]" />
          </colgroup>
          <thead className="bg-paper-raised text-left text-ink-soft">
            <tr>
              <th className="px-3 py-2 font-medium">{to.colName}</th>
              <th className="px-3 py-2 font-medium">{to.colType}</th>
              <th className="px-3 py-2 font-medium">{to.colParent}</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {organizations.map((org) => {
              const formId = `org-${org.id}`;
              return (
                <tr key={org.id}>
                  <td className="px-3 py-2 align-middle">
                    <input type="text" name="name" form={formId} defaultValue={org.name} className={inputClass} />
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <select name="type" form={formId} defaultValue={org.type} className={selectClass}>
                      <option value="group">{to.typeGroup}</option>
                      <option value="subsidiary">{to.typeSubsidiary}</option>
                      <option value="department">{to.typeDepartment}</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <select name="parent_id" form={formId} defaultValue={org.parent_id ?? ""} className={selectClass}>
                      <option value="">{to.noParent}</option>
                      {organizations
                        .filter((candidate) => candidate.id !== org.id)
                        .map((candidate) => (
                          <option key={candidate.id} value={candidate.id}>
                            {candidate.name}（{typeLabel[candidate.type]}）
                          </option>
                        ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <form id={formId} action={updateOrganization}>
                      <input type="hidden" name="id" value={org.id} />
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
            {organizations.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-ink-faint">
                  {to.empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mb-2 mt-8 text-sm font-medium text-ink">{to.addTitle}</h2>
      <form action={createOrganization} className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          name="name"
          placeholder={to.namePlaceholder}
          required
          className="w-56 rounded-md border border-line bg-paper-raised px-2 py-1 text-sm text-ink focus:border-seal focus:outline-none focus:ring-2 focus:ring-seal/20"
        />
        <select name="type" defaultValue="subsidiary" className="rounded-md border border-line bg-paper-raised px-2 py-1 text-sm text-ink focus:border-seal focus:outline-none focus:ring-2 focus:ring-seal/20">
          <option value="group">{to.typeGroup}</option>
          <option value="subsidiary">{to.typeSubsidiary}</option>
          <option value="department">{to.typeDepartment}</option>
        </select>
        <select name="parent_id" defaultValue="" className="rounded-md border border-line bg-paper-raised px-2 py-1 text-sm text-ink focus:border-seal focus:outline-none focus:ring-2 focus:ring-seal/20">
          <option value="">{to.noParent}</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}（{typeLabel[org.type]}）
            </option>
          ))}
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
