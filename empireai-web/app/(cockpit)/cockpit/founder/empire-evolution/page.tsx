import { EmpireEvolutionDashboard } from "@/components/cockpit/empire-evolution/EmpireEvolutionDashboard";

/** SCR P9-EMPIRE · P9-05 — Continuous Empire Evolution Architecture */
export default function EmpireEvolutionPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Evolution · P9-05 · Constitutional Completion</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Empire Evolution</h1>
        <p className="text-sm text-[#8a847a]">
          One continuously evolving Empire · P1–P9 complete · never finished
        </p>
      </header>
      <EmpireEvolutionDashboard />
    </div>
  );
}
