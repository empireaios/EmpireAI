"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/context";

export default function LoginPage() {
  const { login, error: authError, loading } = useAuth();
  const [email, setEmail] = useState("founder@empireai.com");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030303] px-4">
      <div className="w-full max-w-md rounded-2xl border border-gold/15 bg-[#0a0a0a] p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[#d4af37]">
            EmpireAI Brain
          </p>
          <h1 className="mt-2 font-display text-3xl text-[#f0d78c]">
            Secure Access
          </h1>
          <p className="mt-2 text-sm text-[#8a847a]">
            All platform modules communicate through the Brain orchestrator.
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
            {submitting ? "Authenticating…" : "Enter Platform"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#6f6a60]">
          Demo: founder@empireai.com · admin@empireai.com
        </p>
        <p className="mt-2 text-center text-xs">
          <Link href="/" className="text-[#d4af37] hover:underline">
            Return to landing page
          </Link>
        </p>
      </div>
    </div>
  );
}
