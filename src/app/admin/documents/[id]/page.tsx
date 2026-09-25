import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/locale";
import { getDict } from "@/lib/i18n/dictionary";
import { getRoleLabel, isAdminTierRole } from "@/lib/sandbox/dimensions";
import { SandboxContentView } from "@/components/SandboxContentView";
import { addReview } from "./actions";

type DocStatus = "draft" | "submitted" | "in_review" | "needs_revision" | "approved";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getLocale();
  const t = getDict(locale);
  const td = t.admin.documentDetail;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: viewerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .maybeSingle();
  const canReview = isAdminTierRole(viewerProfile?.role ?? "");

  const { data: doc } = await supabase
    .from("sandbox_documents")
    .select("id, owner_id, cycle_id, status, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (!doc) {
    notFound();
  }

  const [{ data: owner }, { data: cycle }, { data: reviewsData }] = await Promise.all([
    supabase.from("profiles").select("full_name, email, role").eq("id", doc.owner_id).maybeSingle(),
    supabase.from("sandbox_cycles").select("name").eq("id", doc.cycle_id).maybeSingle(),
    supabase
      .from("reviews")
      .select("id, reviewer_id, status, comments, created_at")
      .eq("document_id", doc.id)
      .order("created_at", { ascending: false }),
  ]);

  const reviews = reviewsData ?? [];
  const reviewerIds = [...new Set(reviews.map((r) => r.reviewer_id))];
  const { data: reviewers } = reviewerIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", reviewerIds)
    : { data: [] as { id: string; full_name: string }[] };
  const reviewerNames = new Map((reviewers ?? []).map((r) => [r.id, r.full_name]));

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
      <Link href="/admin/overview" className="mb-4 inline-block text-xs text-ink-soft underline decoration-line underline-offset-4 hover:text-ink">
        ← {td.back}
      </Link>
      <h1 className="mb-4 font-serif-cn text-[26px] font-black text-ink">{td.title}</h1>

      <div className="mb-6 rounded-md border border-line bg-paper-raised p-4 text-sm">
        <p>
          <span className="text-ink-soft">{td.owner}：</span>
          {owner?.full_name} ({owner?.email}) ·{" "}
          {owner ? getRoleLabel(locale, owner.role) : ""}
        </p>
        <p className="mt-1">
          <span className="text-ink-soft">{td.cycle}：</span>
          {cycle?.name}
        </p>
        <p className="mt-1">
          <span className="text-ink-soft">{td.status}：</span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusStyle[doc.status as DocStatus]}`}>
            {statusLabel[doc.status as DocStatus]}
          </span>
        </p>
      </div>

      <h2 className="mb-3 text-sm font-medium text-ink">{td.content}</h2>
      <div className="mb-6">
        {owner && <SandboxContentView documentId={doc.id} ownerRole={owner.role} locale={locale} />}
      </div>

      <h2 className="mb-2 text-sm font-medium text-ink">{td.reviewHistory}</h2>
      <ul className="mb-6 flex flex-col gap-2">
        {reviews.map((review) => (
          <li key={review.id} className="rounded-md border border-line bg-paper-raised p-3 text-sm">
            <div className="flex justify-between text-xs text-ink-soft">
              <span>{reviewerNames.get(review.reviewer_id) ?? review.reviewer_id}</span>
              <span>{new Date(review.created_at).toLocaleString(locale)}</span>
            </div>
            <div className="mt-1">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusStyle[review.status as DocStatus]}`}>
                {statusLabel[review.status as DocStatus]}
              </span>
            </div>
            {review.comments && <p className="mt-1 text-ink">{review.comments}</p>}
          </li>
        ))}
        {reviews.length === 0 && <li className="text-sm text-ink-faint">{td.noReviews}</li>}
      </ul>

      {canReview && (
        <>
          <h2 className="mb-2 text-sm font-medium text-ink">{td.addReview}</h2>
          <form action={addReview} className="flex flex-col gap-2">
            <input type="hidden" name="document_id" value={doc.id} />
            <select
              name="status"
              defaultValue="in_review"
              className="w-fit rounded-md border border-line bg-paper-raised px-2 py-1 text-sm text-ink focus:border-seal focus:outline-none focus:ring-2 focus:ring-seal/20"
            >
              <option value="submitted">{statusLabel.submitted}</option>
              <option value="in_review">{statusLabel.in_review}</option>
              <option value="needs_revision">{statusLabel.needs_revision}</option>
              <option value="approved">{statusLabel.approved}</option>
            </select>
            <textarea
              name="comments"
              placeholder={td.commentPlaceholder}
              rows={3}
              className="rounded-md border border-line bg-paper-raised px-2 py-1 text-sm text-ink focus:border-seal focus:outline-none focus:ring-2 focus:ring-seal/20"
            />
            <button
              type="submit"
              className="w-fit rounded-md bg-seal px-3 py-1.5 text-xs font-medium text-paper-raised hover:bg-seal-strong"
            >
              {t.common.save}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
