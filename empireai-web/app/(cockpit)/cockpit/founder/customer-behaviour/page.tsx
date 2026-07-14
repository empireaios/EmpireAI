import { CustomerBehaviourIntelligenceDashboard } from "@/components/cockpit/customer-behaviour-intelligence/CustomerBehaviourIntelligenceDashboard";

/** SCR E4-CUSTOMERS · E4-06 — Customer Behaviour Intelligence */
export default function CustomerBehaviourPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Intelligence · E4-06 · CUSTOMER BEHAVIOUR</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Customer Behaviour Intelligence</h1>
        <p className="text-sm text-[#8a847a]">
          Continuous customer behaviour analysis · purchase intent · demand trends · executive intelligence
        </p>
      </header>
      <CustomerBehaviourIntelligenceDashboard />
    </div>
  );
}
