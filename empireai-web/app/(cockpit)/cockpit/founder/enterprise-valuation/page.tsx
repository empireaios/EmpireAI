import { EnterpriseValuationEngineDashboard } from "@/components/cockpit/enterprise-valuation/EnterpriseValuationEngineDashboard";

/** SCR E3-VALUATION · E3-14 — Enterprise Valuation Engine */
export default function EnterpriseValuationPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Financial Executive · E3-14 · ENTERPRISE VALUATION</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Enterprise Valuation Engine</h1>
        <p className="text-sm text-[#8a847a]">
          Enterprise value measurement · valuation drivers · revenue/profit contribution · risk-adjusted worth
        </p>
      </header>
      <EnterpriseValuationEngineDashboard />
    </div>
  );
}
