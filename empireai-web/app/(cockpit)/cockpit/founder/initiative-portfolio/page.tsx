import { InitiativePortfolioDashboard } from "@/components/cockpit/initiative-portfolio/InitiativePortfolioDashboard";

/** SCR E1-PORTFOLIO · E1-06 — Initiative Portfolio Engine */
export default function InitiativePortfolioPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Programme · E1-06 · HOW COLLECTIVELY</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Initiative Portfolio</h1>
        <p className="text-sm text-[#8a847a]">
          Objectives define WHAT · Roadmap defines WHEN · Priorities define WHAT FIRST · Portfolio governs HOW collectively
        </p>
      </header>
      <InitiativePortfolioDashboard />
    </div>
  );
}
