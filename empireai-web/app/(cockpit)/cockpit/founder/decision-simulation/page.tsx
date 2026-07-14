import { DecisionSimulationEngineDashboard } from "@/components/cockpit/decision-simulation/DecisionSimulationEngineDashboard";

/** SCR E2-SIMULATION · E2-03 — Decision Simulation Engine */
export default function DecisionSimulationPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Programme · E2-03 · DECISION SIMULATION</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Decision Simulation Engine</h1>
        <p className="text-sm text-[#8a847a]">
          Multiple futures before commitment · scenario comparison · outcome prediction · no single-outcome decisions
        </p>
      </header>
      <DecisionSimulationEngineDashboard />
    </div>
  );
}
