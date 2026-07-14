import { ExecutiveScenarioDashboard } from "@/components/cockpit/executive-scenario/ExecutiveScenarioDashboard";

/** SCR E1-SCENARIOS · E1-10 — Executive Scenario Planner */
export default function ExecutiveScenariosPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Programme · E1-10 · MULTIPLE FUTURES</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Executive Scenarios</h1>
        <p className="text-sm text-[#8a847a]">
          Simulate multiple strategic futures · evaluate outcomes · quantify risks · recommend constitutionally aligned paths
        </p>
      </header>
      <ExecutiveScenarioDashboard />
    </div>
  );
}
