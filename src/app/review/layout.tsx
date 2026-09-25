import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/locale";
import { getDict } from "@/lib/i18n/dictionary";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AppHeader } from "@/components/AppHeader";

export default async function ReviewLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const t = getDict(locale);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <AppHeader
        locale={locale}
        right={
          <>
            <LanguageSwitcher locale={locale} />
            <Link href="/my-sandbox" className="text-xs text-ink-soft underline decoration-line underline-offset-4 hover:text-ink">
              {t.mySandbox.title}
            </Link>
            <form action="/auth/sign-out" method="post">
              <button
                type="submit"
                className="rounded-md border border-line px-3 py-1.5 text-xs text-ink-soft hover:bg-paper hover:text-ink"
              >
                {t.common.signOut}
              </button>
            </form>
          </>
        }
      />
      <main className="mx-auto w-full max-w-4xl px-6 py-8">{children}</main>
    </>
  );
}
