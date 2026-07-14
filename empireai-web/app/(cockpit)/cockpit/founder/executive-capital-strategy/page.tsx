import { ExecutiveCapitalStrategyDashboard } from "@/components/cockpit/executive-capital-strategy/ExecutiveCapitalStrategyDashboard";

/** SCR E3-CAPSTRAT · E3-15 — Executive Capital Strategy */
export default function ExecutiveCapitalStrategyPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Financial Executive · E3-15 · CAPITAL STRATEGY</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Executive Capital Strategy</h1>
        <p className="text-sm text-[#8a847a]">
          Long-term capital strategy · allocation priorities · investment horizons · preservation vs growth · strategic deployment
        </p>
      </header>
      <ExecutiveCapitalStrategyDashboard />
    </div>
  );
}
