import { setLocale } from "@/lib/i18n/actions";
import type { Locale } from "@/lib/i18n/dictionary";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <form action={setLocale}>
        <input type="hidden" name="locale" value="zh" />
        <button
          type="submit"
          className={locale === "zh" ? "font-medium text-ink" : "text-ink-faint hover:text-ink-soft"}
        >
          中文
        </button>
      </form>
      <span className="text-ink-faint">/</span>
      <form action={setLocale}>
        <input type="hidden" name="locale" value="en" />
        <button
          type="submit"
          className={locale === "en" ? "font-medium text-ink" : "text-ink-faint hover:text-ink-soft"}
        >
          EN
        </button>
      </form>
    </div>
  );
}
