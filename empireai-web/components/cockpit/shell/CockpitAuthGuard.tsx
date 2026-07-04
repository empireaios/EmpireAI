"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { buildLoginPath } from "@/lib/auth/redirect";

const SESSION_VERIFY_TIMEOUT_MS = 12_000;

function SessionVerifyScreen({
  message,
  onRetry,
  showLoginLink,
}: {
  message: string;
  onRetry?: () => void;
  showLoginLink?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#030303] px-4 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/20 border-t-[#d4af37]" />
      <p className="max-w-md text-sm text-[#8a847a]">{message}</p>
      {onRetry && (
        <button
          type="button"
          className="rounded-lg border border-gold/20 px-4 py-2 text-sm text-[#d4af37] hover:border-gold/40"
          onClick={onRetry}
        >
          Retry connection
        </button>
      )}
      {showLoginLink && (
        <Link href="/login" className="text-sm text-[#d4af37] hover:underline">
          Return to login
        </Link>
      )}
    </div>
  );
}

export function CockpitAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, error, refresh } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!loading) {
      setTimedOut(false);
      return undefined;
    }

    const timer = window.setTimeout(() => setTimedOut(true), SESSION_VERIFY_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace(buildLoginPath(pathname));
    }
  }, [loading, user, pathname, router]);

  if (loading && timedOut) {
    return (
      <SessionVerifyScreen
        message={
          error ??
          "Empire Brain is taking longer than expected. Your session may still be valid — retry or sign in again."
        }
        onRetry={() => {
          setTimedOut(false);
          void refresh();
        }}
        showLoginLink
      />
    );
  }

  if (loading) {
    return <SessionVerifyScreen message="Verifying session…" />;
  }

  if (!user) {
    return <SessionVerifyScreen message="Redirecting to login…" showLoginLink />;
  }

  return <>{children}</>;
}
