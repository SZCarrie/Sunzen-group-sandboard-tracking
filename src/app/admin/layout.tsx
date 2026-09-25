import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/locale";
import { getDict } from "@/lib/i18n/dictionary";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AppHeader } from "@/components/AppHeader";
import { isAdminTierRole, isOversightRole } from "@/lib/sandbox/dimensions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const t = getDict(locale);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: viewerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!viewerProfile || !isOversightRole(viewerProfile.role)) {
    return (
      <main className="mx-auto max-w-md px-6 py-10">
        <p className="text-sm text-rose">{t.common.noPermission}</p>
      </main>
    );
  }

  // group_md only gets read-only oversight (Overview) — the management pages
  // (Roles/Organizations/Cycles/Field Rules) stay super_admin-only.
  const navItems = isAdminTierRole(viewerProfile.role)
    ? [
        { href: "/admin/users", label: t.admin.nav.users },
        { href: "/admin/organizations", label: t.admin.nav.organizations },
        { href: "/admin/cycles", label: t.admin.nav.cycles },
        { href: "/admin/overview", label: t.admin.nav.overview },
        { href: "/admin/settings", label: t.admin.nav.settings },
      ]
    : [{ href: "/admin/overview", label: t.admin.nav.overview }];

  return (
    <>
      <AppHeader
        nav={navItems}
        locale={locale}
        right={
          <>
            <LanguageSwitcher locale={locale} />
            <Link href="/my-sandbox" className="text-xs text-ink-soft underline decoration-line underline-offset-4 hover:text-ink">
              {t.mySandbox.title}
            </Link>
          </>
        }
      />
      <div className="mx-auto max-w-4xl px-6 py-8">{children}</div>
    </>
  );
}
