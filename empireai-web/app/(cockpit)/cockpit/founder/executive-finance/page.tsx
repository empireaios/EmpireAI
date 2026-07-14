import { ExecutiveFinanceFrameworkDashboard } from "@/components/cockpit/executive-finance/ExecutiveFinanceFrameworkDashboard";

/** SCR E3-FINANCE · E3-01 — Executive Finance Framework */
export default function ExecutiveFinancePage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Financial Executive · E3-01 · EXECUTIVE FINANCE</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Executive Finance Framework</h1>
        <p className="text-sm text-[#8a847a]">
          Unified constitutional financial governance · capital · budgets · investments · revenue · profit
        </p>
      </header>
      <ExecutiveFinanceFrameworkDashboard />
    </div>
  );
}
