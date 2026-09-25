"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n/dictionary";
import { getDict } from "@/lib/i18n/dictionary";

export function LoginForm({ locale }: { locale: Locale }) {
  const t = getDict(locale).login;
  const appName = getDict(locale).common.appName;
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      setNotice(t.resetLinkSentNotice);
      return;
    }

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      router.push("/my-sandbox");
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (!data.session) {
      setNotice(t.signUpNotice);
      return;
    }
    router.push("/my-sandbox");
    router.refresh();
  }

  const inputClass =
    "rounded-md border border-line bg-field px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-seal focus:outline-none focus:ring-2 focus:ring-seal/20";

  return (
    <>
      <h1 className="mb-1 font-serif-cn text-lg font-semibold text-ink">{appName}</h1>
      <p className="mb-6 text-sm text-ink-soft">
        {mode === "signin" ? t.signInSubtitle : mode === "signup" ? t.signUpSubtitle : t.forgotSubtitle}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {mode === "signup" && (
          <input
            className={inputClass}
            placeholder={t.namePlaceholder}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        )}
        <input
          className={inputClass}
          type="email"
          placeholder={t.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {mode !== "forgot" && (
          <input
            className={inputClass}
            type="password"
            placeholder={t.passwordPlaceholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        )}

        {mode === "signin" && (
          <button
            type="button"
            className="self-end text-xs text-ink-soft underline decoration-line underline-offset-4 hover:text-ink"
            onClick={() => {
              setMode("forgot");
              setError(null);
              setNotice(null);
            }}
          >
            {t.forgotPasswordLink}
          </button>
        )}

        {error && <p className="text-sm text-rose">{error}</p>}
        {notice && <p className="text-sm text-jade">{notice}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 rounded-md bg-seal px-3 py-2 text-sm font-medium text-paper-raised transition-colors hover:bg-seal-strong disabled:opacity-50"
        >
          {loading ? t.processing : mode === "signin" ? t.signIn : mode === "signup" ? t.signUp : t.sendResetLink}
        </button>
      </form>

      {mode === "forgot" ? (
        <button
          className="mt-5 text-sm text-ink-soft underline decoration-line underline-offset-4 hover:text-ink"
          onClick={() => {
            setMode("signin");
            setError(null);
            setNotice(null);
          }}
        >
          {t.backToSignIn}
        </button>
      ) : (
        <button
          className="mt-5 text-sm text-ink-soft underline decoration-line underline-offset-4 hover:text-ink"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setNotice(null);
          }}
        >
          {mode === "signin" ? t.toggleToSignUp : t.toggleToSignIn}
        </button>
      )}
    </>
  );
}
