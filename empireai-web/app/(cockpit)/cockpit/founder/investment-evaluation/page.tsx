import { InvestmentEvaluationEngineDashboard } from "@/components/cockpit/investment-evaluation/InvestmentEvaluationEngineDashboard";

/** SCR E3-INVEST · E3-04 — Investment Evaluation Engine */
export default function InvestmentEvaluationPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Financial Executive · E3-04 · INVESTMENT EVALUATION</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Investment Evaluation Engine</h1>
        <p className="text-sm text-[#8a847a]">
          Enterprise investment evaluation · financial return · strategic alignment · constitutional governance
        </p>
      </header>
      <InvestmentEvaluationEngineDashboard />
    </div>
  );
}
