"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { resolvePostAuthPath } from "@/lib/auth/redirect";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const { login, error: authError, loading, user } = useAuth();
  const [email, setEmail] = useState("founder@empireai.com");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace(resolvePostAuthPath(next));
    }
  }, [loading, user, next, router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password, next ?? undefined);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Authentication service unavailable. Please retry.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030303] text-sm text-[#8a847a]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/20 border-t-[#d4af37]" />
          Checking session…
        </div>
      </div>
    );
  }

  if (!loading && user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030303] text-sm text-[#8a847a]">
        Session active — opening Cockpit…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030303] px-4">
      <div className="w-full max-w-md rounded-2xl border border-gold/15 bg-[#0a0a0a] p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[#d4af37]">
            EmpireAI · Pillow Gateway
          </p>
          <h1 className="mt-2 font-display text-3xl text-[#f0d78c]">
            Grand King Access
          </h1>
          <p className="mt-2 text-sm text-[#8a847a]">
            Private operating environment — authenticate to enter Executive Home.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-[#6f6a60]">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="username"
              className="mt-2 w-full rounded-lg border border-gold/15 bg-white/[0.03] px-4 py-2.5 text-sm text-[#f0d78c] outline-none focus:border-gold/40"
            />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-wider text-[#6f6a60]">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              className="mt-2 w-full rounded-lg border border-gold/15 bg-white/[0.03] px-4 py-2.5 text-sm text-[#f0d78c] outline-none focus:border-gold/40"
            />
          </label>

          {(error || authError) && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
              {error ?? authError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || loading}
            className="w-full rounded-lg bg-gradient-to-r from-[#d4af37] to-[#9a7b1a] px-4 py-3 text-sm font-semibold uppercase tracking-wider text-[#1a1408] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Authenticating…" : "Enter EmpireAI"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#6f6a60]">
          Private deployment — Grand King credentials only.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#030303] text-sm text-[#8a847a]">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
