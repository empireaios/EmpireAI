"use client";

import type { BrainError } from "@/lib/brain/types";

type BrainModuleShellProps = {
  loading: boolean;
  error: BrainError | null;
  onRetry: () => void;
  actionError?: string | null;
  children: React.ReactNode;
};

export function BrainModuleShell({
  loading,
  error,
  onRetry,
  actionError,
  children,
}: BrainModuleShellProps) {
  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-gold/10 bg-white/[0.02]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gold/20 border-t-[#d4af37]" />
          <p className="text-sm text-[#8a847a]">Synchronizing with EmpireAI Brain…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-8">
        <p className="text-sm font-medium text-red-300">Brain communication failed</p>
        <p className="mt-2 text-sm text-[#a8a095]">{error.message}</p>
        {error.retryable && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-lg border border-gold/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#d4af37] transition-colors hover:bg-gold/10"
          >
            Retry connection
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {actionError && (
        <div className="mb-6 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
          {actionError}
        </div>
      )}
      {children}
    </>
  );
}
