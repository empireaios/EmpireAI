import Link from "next/link";

/** Mission 007 — honest unavailable Settings surface (no fake capability). */
export function SettingsUnavailablePanel() {
  return (
    <section
      aria-label="Settings unavailable"
      className="mx-auto max-w-2xl rounded-xl border border-gold/20 bg-white/[0.02] px-6 py-10"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#6f6a60]">
        Settings
      </p>
      <h1 className="mt-2 font-display text-2xl text-[#f0d78c]">Not yet available</h1>
      <p className="mt-3 text-sm leading-relaxed text-[#c8c0b0]">
        Governance preferences and settings are not yet an operating Grand King surface. EmpireAI
        will not pretend this Centre is complete.
      </p>
      <p className="mt-3 text-sm text-[#8a847a]">
        For money and Cost Guard controls, use the Cost Centre. For decisions, return to Executive
        Home.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/cockpit"
          className="rounded-lg border border-gold/25 bg-gold/10 px-3 py-2 text-xs text-[#d4af37]"
        >
          Executive Home
        </Link>
        <Link
          href="/cockpit/finance/costs"
          className="rounded-lg border border-gold/15 px-3 py-2 text-xs text-[#c8c0b0]"
        >
          Cost Centre
        </Link>
      </div>
    </section>
  );
}
