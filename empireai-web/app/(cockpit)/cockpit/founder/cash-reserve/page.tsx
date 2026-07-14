import { CashReserveIntelligenceDashboard } from "@/components/cockpit/cash-reserve/CashReserveIntelligenceDashboard";

/** SCR E3-CASH · E3-06 — Cash Reserve Intelligence */
export default function CashReservePage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Financial Executive · E3-06 · CASH RESERVE</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Cash Reserve Intelligence</h1>
        <p className="text-sm text-[#8a847a]">
          Enterprise liquidity · reserve optimization · cash flow forecasting · financial resilience
        </p>
      </header>
      <CashReserveIntelligenceDashboard />
    </div>
  );
}
