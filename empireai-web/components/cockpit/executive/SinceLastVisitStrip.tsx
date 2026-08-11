"use client";

import { useExecutiveHome } from "@/lib/cockpit/hooks/useExecutiveHome";
import { scrubMachineLanguage } from "@/lib/cockpit/executive/executive-presentation";

/** Meaningful changes since Grand King's last visit — owner language. */
export function SinceLastVisitStrip() {
  const { data, loading } = useExecutiveHome();
  const visit = data?.canonicalTruth?.sinceLastVisit;

  if (loading && !data) {
    return <div className="h-16 animate-pulse rounded-xl border border-gold/10 bg-white/[0.02]" />;
  }
  if (!visit) {
    return (
      <section
        aria-label="Since your last visit"
        className="rounded-xl border border-gold/10 bg-white/[0.02] px-5 py-3"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#6f6a60]">
          Since your last visit
        </p>
        <p className="mt-1 text-sm text-[#8a847a]">No prior visit baseline yet.</p>
      </section>
    );
  }

  const actions = visit.latestMeaningfulActions?.slice(0, 4) ?? [];

  return (
    <section
      aria-label="Since your last visit"
      className="rounded-xl border border-gold/15 bg-white/[0.02] px-5 py-4"
      data-testid="since-last-visit"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d4af37]">
        Since your last visit
      </p>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#8a847a]">
        <span>Discovered {visit.discovered}</span>
        <span>Analysed {visit.analysed}</span>
        <span>Rejected {visit.rejected}</span>
        <span>Approvals requested {visit.approvalsRequested}</span>
        <span>Purchases {visit.purchasesMade}</span>
      </div>
      {actions.length > 0 ? (
        <ul className="mt-3 space-y-1.5 text-sm text-[#c8c0b0]">
          {actions.map((a, i) => (
            <li key={`${a.at}-${i}`}>
              {scrubMachineLanguage(a.summary)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-[#8a847a]">No material changes recorded since last visit.</p>
      )}
      {visit.nextWork && (
        <p className="mt-2 text-xs text-[#d4af37]">
          Next: {scrubMachineLanguage(visit.nextWork)}
        </p>
      )}
    </section>
  );
}
