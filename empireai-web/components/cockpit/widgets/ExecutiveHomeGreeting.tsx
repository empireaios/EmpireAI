"use client";

import { useAuth } from "@/lib/auth/context";

const PLACEHOLDER_V1_BLOCKER =
  "V1: 1 blocker — CJ credentials pending in Integrations";

/** REAL-079 zone: Grand King greeting + date + V1 status strip. */
export function ExecutiveHomeGreeting() {
  const { user } = useAuth();
  const displayName = user?.name?.split(" ")[0] ?? "Grand King";
  const today = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date());

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[#f0d78c] sm:text-3xl">
          Good morning, {displayName}
        </h1>
        <p className="mt-1 text-sm text-[#8a847a]">
          {today} · Sovereign session
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <p className="text-sm text-amber-200/90">⚠ {PLACEHOLDER_V1_BLOCKER}</p>
        <span className="shrink-0 rounded-md border border-gold/15 px-3 py-1 text-xs text-[#d4af37]">
          Fix in Integrations
        </span>
      </div>
    </div>
  );
}
