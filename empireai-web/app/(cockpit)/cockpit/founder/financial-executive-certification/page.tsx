import { FinancialExecutiveCertificationPanel } from "@/components/cockpit/financial-executive-certification/FinancialExecutiveCertificationPanel";

/** SCR E3-CERTIFIED · E3-16 — Financial Executive Certification */
export default function FinancialExecutiveCertificationPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Programme · E3-16 · FINANCIAL EXECUTIVE CERTIFIED</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Financial Executive Certification</h1>
        <p className="text-sm text-[#8a847a]">
          Constitutional certification of Phase E3 · enterprise-grade financial executive capabilities
        </p>
      </header>
      <FinancialExecutiveCertificationPanel />
    </div>
  );
}
