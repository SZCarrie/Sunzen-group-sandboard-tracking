import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { getDict, type Locale } from "@/lib/i18n/dictionary";

export function AppHeader({
  nav,
  activeHref,
  right,
  locale,
}: {
  nav?: { href: string; label: string }[];
  activeHref?: string;
  right?: ReactNode;
  locale: Locale;
}) {
  const t = getDict(locale).common;
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-paper-raised">
      <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-2.5">
        <Link href="/my-sandbox" className="flex shrink-0 items-center gap-3">
          <Image src="/sunzen-logo-transparent.png" alt="Sunzen Group" width={590} height={164} className="h-10 w-auto" priority />
          <span className="hidden font-serif-cn text-lg font-bold tracking-wide text-ink sm:inline">
            {t.headerBrand}
            <span className="ml-1.5 font-sans-cn text-xs font-normal text-ink-soft">{t.headerTagline}</span>
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-4">{right}</div>
      </div>
      {nav && nav.length > 0 && (
        <div className="mx-auto max-w-4xl px-6">
          <nav className="-mb-px flex gap-1 overflow-x-auto">
            {nav.map((item) => {
              const isActive = item.href === activeHref;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap border-b-[3px] px-3.5 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "border-seal font-bold text-ink"
                      : "border-transparent text-ink-soft hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
