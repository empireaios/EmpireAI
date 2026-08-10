import { CostControlCentrePanel } from "@/components/cockpit/finance/CostControlCentrePanel";

/** Mission 004 — live Cost Control Centre (billing exposure + Cost Guard). */
export default function FinanceCostsPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <CostControlCentrePanel />
    </div>
  );
}
