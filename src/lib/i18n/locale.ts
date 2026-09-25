import { cookies } from "next/headers";
import type { Locale } from "./dictionary";

export const LOCALE_COOKIE = "lang";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return store.get(LOCALE_COOKIE)?.value === "en" ? "en" : "zh";
}
