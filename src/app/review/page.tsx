import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/locale";
import { getDict } from "@/lib/i18n/dictionary";
import { getRoleLabel } from "@/lib/sandbox/dimensions";

type Profile = { id: string; full_name: string; role: string };

type DocStatus = "draft" | "submitted" | "in_review" | "needs_revision" | "approved";
type Doc = { id: string; owner_id: string; status: DocStatus; updated_at: string };

export default async function ReviewListPage() {
  const locale = await getLocale();
  const t = getDict(locale);
  const tr = t.review;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: viewerProfile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!viewerProfile || viewerProfile.role === "employee") {
    return <p className="text-sm text-rose">{tr.noPermission}</p>;
  }

  const { data: reportsData } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("manager_id", viewerProfile.id)
    .order("full_name", { ascending: true });
  const reports = (reportsData ?? []) as Profile[];

  const { data: cycle } = await supabase
    .from("sandbox_cycles")
    .select("id")
    .eq("status", "active")
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const reportIds = reports.map((r) => r.id);
  const { data: docsData } = cycle && reportIds.length
    ? await supabase
        .from("sandbox_documents")
        .select("id, owner_id, status, updated_at")
        .eq("cycle_id", cycle.id)
        .in("owner_id", reportIds)
    : { data: [] as Doc[] };
  const docByOwner = new Map(((docsData ?? []) as Doc[]).map((d) => [d.owner_id, d]));

  const statusLabel: Record<DocStatus, string> = {
    draft: t.admin.overview.statusDraft,
    submitted: t.admin.overview.statusSubmitted,
    in_review: t.admin.overview.statusInReview,
    needs_revision: t.admin.overview.statusNeedsRevision,
    approved: t.admin.overview.statusApproved,
  };
  const statusStyle: Record<DocStatus, string> = {
    draft: "border border-line bg-field text-ink-soft",
    submitted: "bg-dim-jiang-wash text-dim-jiang",
    in_review: "bg-ochre-wash text-ochre",
    needs_revision: "bg-rose-wash text-rose",
    approved: "bg-jade-wash text-jade",
  };

  return (
    <div>
      <h1 className="mb-1 font-serif-cn text-[26px] font-black text-ink">{tr.listTitle}</h1>
      <p className="mb-6 text-sm text-ink-soft">{tr.listDescription}</p>

      <div className="overflow-hidden rounded-lg border border-line bg-paper-raised">
        <table className="w-full text-sm">
          <thead className="bg-paper-raised text-left text-ink-soft">
            <tr>
              <th className="px-3 py-2 font-medium">{tr.colName}</th>
              <th className="px-3 py-2 font-medium">{tr.colRole}</th>
              <th className="px-3 py-2 font-medium">{tr.colStatus}</th>
              <th className="px-3 py-2 font-medium">{tr.colUpdated}</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {reports.map((report) => {
              const doc = docByOwner.get(report.id);
              return (
                <tr key={report.id}>
                  <td className="px-3 py-2 font-medium">{report.full_name}</td>
                  <td className="px-3 py-2 text-xs text-ink-soft">{getRoleLabel(locale, report.role)}</td>
                  <td className="px-3 py-2">
                    {doc ? (
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusStyle[doc.status]}`}>
                        {statusLabel[doc.status]}
                      </span>
                    ) : (
                      <span className="text-xs text-ink-faint">{tr.noDocument}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-ink-soft">
                    {doc ? new Date(doc.updated_at).toLocaleDateString(locale) : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {doc && (
                      <Link
                        href={`/review/${doc.id}`}
                        className="text-xs text-seal underline decoration-line underline-offset-2 hover:text-seal-strong"
                      >
                        {tr.viewAction}
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
            {reports.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-ink-faint">
                  {tr.empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
