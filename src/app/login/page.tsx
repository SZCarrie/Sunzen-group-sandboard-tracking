import Image from "next/image";
import { getLocale } from "@/lib/i18n/locale";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const locale = await getLocale();

  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center bg-paper px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-between">
          <Image src="/sunzen-logo-transparent.png" alt="Sunzen Group" width={590} height={164} className="h-11 w-auto" priority />
          <LanguageSwitcher locale={locale} />
        </div>
        <div className="rounded-xl border border-line bg-paper-raised px-7 py-8">
          <LoginForm locale={locale} />
        </div>
      </div>
    </main>
  );
}
