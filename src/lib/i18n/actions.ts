"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE } from "./locale";

export async function setLocale(formData: FormData) {
  const locale = formData.get("locale") === "en" ? "en" : "zh";
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
}
