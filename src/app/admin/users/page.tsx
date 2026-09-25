import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/locale";
import { getDict } from "@/lib/i18n/dictionary";
import { getRoleLabel, isAdminTierRole } from "@/lib/sandbox/dimensions";
import { inviteUser, resetUserPassword, revokeInvitation, setProfileDisabled, updateProfileAssignment } from "./actions";

type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  manager_id: string | null;
  organization_id: string | null;
  disabled_at: string | null;
};

type Organization = { id: string; name: string };
type Invitation = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  invited_by: string | null;
};

const ALL_ROLE_OPTIONS = ["employee", "supervisor", "subsidiary_head", "super_admin", "group_md"] as const;
const STAFF_ROLE_OPTIONS = ["employee", "supervisor", "subsidiary_head"] as const;

const fieldClass =
  "w-full rounded-md border border-line bg-paper-raised px-2 py-1 text-sm text-ink focus:border-seal focus:outline-none focus:ring-2 focus:ring-seal/20";
const lockedClass =
  "block w-full truncate rounded-md border border-dashed border-line px-2 py-1 text-sm text-ink-faint";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  const locale = await getLocale();
  const t = getDict(locale);
  const tu = t.admin.users;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: viewerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  // group_md can enter /admin for read-only oversight (Overview) but has no role-management
  // powers — this page is super_admin-only.
  if (!viewerProfile || !isAdminTierRole(viewerProfile.role)) {
    return <p className="text-sm text-rose">{t.common.noPermission}</p>;
  }

  const viewerIsSuperAdmin = viewerProfile.role === "super_admin";
  const assignableRoles = viewerIsSuperAdmin ? ALL_ROLE_OPTIONS : STAFF_ROLE_OPTIONS;

  const { q, role } = await searchParams;
  const search = (q ?? "").trim().replace(/[,()]/g, "");
  const roleFilter = ALL_ROLE_OPTIONS.includes(role as (typeof ALL_ROLE_OPTIONS)[number]) ? role : "";

  let query = supabase
    .from("profiles")
    .select("id, full_name, email, role, manager_id, organization_id, disabled_at")
    .order("full_name", { ascending: true });

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }
  if (roleFilter) {
    query = query.eq("role", roleFilter);
  }

  const [{ data: profiles }, { data: orgs }, { data: allForManagerList }, { data: invitationsData }] =
    await Promise.all([
      query,
      supabase.from("organizations").select("id, name").order("name", { ascending: true }),
      supabase.from("profiles").select("id, full_name, email, role").order("full_name", { ascending: true }),
      supabase
        .from("invitations")
        .select("id, email, full_name, role, invited_by")
        .order("created_at", { ascending: false }),
    ]);

  const allProfiles = (profiles ?? []) as Profile[];
  const organizations = (orgs ?? []) as Organization[];
  const managerCandidates = (allForManagerList ?? []) as Pick<Profile, "id" | "full_name" | "role">[];
  const invitations = (invitationsData ?? []) as Invitation[];
  const nameById = new Map(managerCandidates.map((p) => [p.id, p.full_name]));

  return (
    <div>
      <h1 className="mb-1 font-serif-cn text-[26px] font-black text-ink">{tu.title}</h1>
      <p className="mb-6 text-sm text-ink-soft">{tu.description}</p>

      <form className="mb-4 flex flex-wrap items-center gap-2" method="get">
        <input
          type="text"
          name="q"
          defaultValue={search}
          placeholder={tu.searchPlaceholder}
          className="rounded-md border border-line bg-paper-raised px-2 py-1 text-sm text-ink focus:border-seal focus:outline-none focus:ring-2 focus:ring-seal/20"
        />
        <select name="role" defaultValue={roleFilter} className="rounded-md border border-line bg-paper-raised px-2 py-1 text-sm text-ink focus:border-seal focus:outline-none focus:ring-2 focus:ring-seal/20">
          <option value="">{tu.allRoles}</option>
          {ALL_ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {getRoleLabel(locale, r)}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md border border-line px-3 py-1 text-xs text-ink-soft hover:bg-paper">
          {tu.searchButton}
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-line bg-paper-raised">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col className="w-[20%]" />
            <col className="w-[14%]" />
            <col className="w-[18%]" />
            <col className="w-[16%]" />
            <col className="w-[32%]" />
          </colgroup>
          <thead className="bg-paper-raised text-left text-ink-soft">
            <tr>
              <th className="px-3 py-2 font-medium">{tu.colName}</th>
              <th className="px-3 py-2 font-medium">{tu.colRole}</th>
              <th className="px-3 py-2 font-medium">{tu.colManager}</th>
              <th className="px-3 py-2 font-medium">{tu.colOrg}</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {allProfiles.map((profile) => {
              const isSelf = profile.id === user?.id;
              const tierLocked = !viewerIsSuperAdmin && isAdminTierRole(profile.role) && !isSelf;
              const editable = !tierLocked;
              const formId = `profile-${profile.id}`;

              return (
                <tr key={profile.id}>
                  <td className="px-3 py-2 align-middle">
                    <div className="truncate font-medium">
                      {profile.full_name}
                      {profile.disabled_at && (
                        <span className="ml-2 rounded-full border border-line bg-field px-2 py-0.5 text-xs font-bold text-ink-soft">
                          {tu.disabledBadge}
                        </span>
                      )}
                    </div>
                    <div className="truncate text-xs text-ink-soft">{profile.email}</div>
                  </td>

                  <td className="px-3 py-2 align-middle">
                    {editable && !isSelf ? (
                      <select name="role" form={formId} defaultValue={profile.role} className={fieldClass}>
                        {assignableRoles.map((r) => (
                          <option key={r} value={r}>
                            {getRoleLabel(locale, r)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        title={isSelf ? tu.selfLocked : undefined}
                        className={lockedClass}
                      >
                        {getRoleLabel(locale, profile.role)}
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-2 align-middle">
                    {editable ? (
                      <select name="manager_id" form={formId} defaultValue={profile.manager_id ?? ""} className={fieldClass}>
                        <option value="">{tu.noManager}</option>
                        {managerCandidates
                          .filter((candidate) => candidate.id !== profile.id)
                          .map((candidate) => (
                            <option key={candidate.id} value={candidate.id}>
                              {candidate.full_name}（{getRoleLabel(locale, candidate.role)}）
                            </option>
                          ))}
                      </select>
                    ) : (
                      <span className={lockedClass}>
                        {(profile.manager_id && nameById.get(profile.manager_id)) || tu.noManager}
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-2 align-middle">
                    {editable ? (
                      <select name="organization_id" form={formId} defaultValue={profile.organization_id ?? ""} className={fieldClass}>
                        <option value="">{tu.noOrg}</option>
                        {organizations.map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={lockedClass}>
                        {organizations.find((o) => o.id === profile.organization_id)?.name ?? tu.noOrg}
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-2 align-middle">
                    {editable && (
                      <form id={formId} action={updateProfileAssignment}>
                        <input type="hidden" name="profile_id" value={profile.id} />
                        {isSelf && <input type="hidden" name="role" value={profile.role} />}
                      </form>
                    )}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        {editable && (
                          <button
                            type="submit"
                            form={formId}
                            className="rounded-md bg-seal px-3 py-1 text-xs font-medium text-paper-raised hover:bg-seal-strong"
                          >
                            {t.common.save}
                          </button>
                        )}
                        {!isSelf && !tierLocked && (
                          <form action={setProfileDisabled}>
                            <input type="hidden" name="profile_id" value={profile.id} />
                            <input type="hidden" name="disabled" value={profile.disabled_at ? "false" : "true"} />
                            <button type="submit" className="rounded-md border border-line px-2 py-1 text-xs text-ink-soft hover:bg-paper">
                              {profile.disabled_at ? tu.enableButton : tu.disableButton}
                            </button>
                          </form>
                        )}
                      </div>
                      {!isSelf && !tierLocked && (
                        <form action={resetUserPassword} className="flex items-center gap-1">
                          <input type="hidden" name="profile_id" value={profile.id} />
                          <input
                            type="text"
                            name="new_password"
                            placeholder={tu.resetPasswordPlaceholder}
                            minLength={6}
                            required
                            className="w-24 rounded-md border border-line bg-paper-raised px-2 py-1 text-xs text-ink focus:border-seal focus:outline-none focus:ring-2 focus:ring-seal/20"
                          />
                          <button type="submit" className="rounded-md border border-line px-2 py-1 text-xs text-ink-soft hover:bg-paper">
                            {tu.resetPasswordButton}
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {allProfiles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-ink-faint">
                  {tu.empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mb-2 mt-8 text-sm font-medium text-ink">{tu.pendingInvitationsTitle}</h2>
      {invitations.length > 0 ? (
        <ul className="mb-6 flex flex-col gap-1">
          {invitations.map((inv) => (
            <li
              key={inv.id}
              className="flex items-center justify-between rounded-md border border-line bg-paper-raised px-3 py-2 text-sm"
            >
              <span>
                {inv.full_name} ({inv.email}) · {tu.invitedAs} {getRoleLabel(locale, inv.role)}
                {inv.invited_by && ` · ${nameById.get(inv.invited_by) ?? ""}`}
              </span>
              <form action={revokeInvitation}>
                <input type="hidden" name="invitation_id" value={inv.id} />
                <button type="submit" className="rounded-md border border-line px-2 py-1 text-xs text-ink-soft hover:bg-paper">
                  {tu.revokeButton}
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-6 text-sm text-ink-faint">{tu.noPendingInvitations}</p>
      )}

      <h2 className="mb-2 text-sm font-medium text-ink">{tu.inviteTitle}</h2>
      <p className="mb-2 text-xs text-ink-soft">{tu.inviteDescription}</p>
      <form action={inviteUser} className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          name="full_name"
          placeholder={tu.inviteNamePlaceholder}
          required
          className="rounded-md border border-line bg-paper-raised px-2 py-1 text-sm text-ink focus:border-seal focus:outline-none focus:ring-2 focus:ring-seal/20"
        />
        <input
          type="email"
          name="email"
          placeholder={tu.inviteEmailPlaceholder}
          required
          className="rounded-md border border-line bg-paper-raised px-2 py-1 text-sm text-ink focus:border-seal focus:outline-none focus:ring-2 focus:ring-seal/20"
        />
        <select name="role" defaultValue="employee" className="rounded-md border border-line bg-paper-raised px-2 py-1 text-sm text-ink focus:border-seal focus:outline-none focus:ring-2 focus:ring-seal/20">
          {assignableRoles.map((r) => (
            <option key={r} value={r}>
              {getRoleLabel(locale, r)}
            </option>
          ))}
        </select>
        <select name="manager_id" defaultValue="" className="rounded-md border border-line bg-paper-raised px-2 py-1 text-sm text-ink focus:border-seal focus:outline-none focus:ring-2 focus:ring-seal/20">
          <option value="">{tu.noManager}</option>
          {managerCandidates.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.full_name}（{getRoleLabel(locale, candidate.role)}）
            </option>
          ))}
        </select>
        <select name="organization_id" defaultValue="" className="rounded-md border border-line bg-paper-raised px-2 py-1 text-sm text-ink focus:border-seal focus:outline-none focus:ring-2 focus:ring-seal/20">
          <option value="">{tu.noOrg}</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md bg-seal px-3 py-1 text-xs font-medium text-paper-raised hover:bg-seal-strong">
          {tu.inviteButton}
        </button>
      </form>
    </div>
  );
}
