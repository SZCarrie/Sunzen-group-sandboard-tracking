"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n/dictionary";
import { getDict } from "@/lib/i18n/dictionary";

export function ResetPasswordForm({ locale }: { locale: Locale }) {
  const t = getDict(locale).login;
  const router = useRouter();
  const supabase = createClient();

  const [ready, setReady] = useState(false);
  const [linkInvalid, setLinkInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (!code) {
      setLinkInvalid(true);
      return;
    }
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setLinkInvalid(true);
        return;
      }
      setReady(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSuccess(true);
    setTimeout(() => {
      router.push("/my-sandbox");
      router.refresh();
    }, 1500);
  }

  const inputClass =
    "rounded-md border border-line bg-field px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-seal focus:outline-none focus:ring-2 focus:ring-seal/20";

  if (linkInvalid) {
    return <p className="text-sm text-rose">{t.resetLinkInvalid}</p>;
  }

  if (success) {
    return <p className="text-sm text-jade">{t.resetPasswordSuccessNotice}</p>;
  }

  return (
    <>
      <h1 className="mb-1 font-serif-cn text-lg font-semibold text-ink">{t.resetPasswordTitle}</h1>
      <p className="mb-6 text-sm text-ink-soft">{t.resetPasswordSubtitle}</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          className={inputClass}
          type="password"
          placeholder={t.newPasswordPlaceholder}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
          disabled={!ready}
        />

        {error && <p className="text-sm text-rose">{error}</p>}

        <button
          type="submit"
          disabled={loading || !ready}
          className="mt-1 rounded-md bg-seal px-3 py-2 text-sm font-medium text-paper-raised transition-colors hover:bg-seal-strong disabled:opacity-50"
        >
          {loading ? t.processing : t.resetPasswordButton}
        </button>
      </form>
    </>
  );
}
