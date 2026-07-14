import { ExecutiveBudgetPlannerDashboard } from "@/components/cockpit/executive-budget/ExecutiveBudgetPlannerDashboard";

/** SCR E3-BUDGET · E3-03 — Executive Budget Planner */
export default function ExecutiveBudgetPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Financial Executive · E3-03 · EXECUTIVE BUDGET</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Executive Budget Planner</h1>
        <p className="text-sm text-[#8a847a]">
          Enterprise budget planning · allocation · utilization · financial discipline
        </p>
      </header>
      <ExecutiveBudgetPlannerDashboard />
    </div>
  );
}
