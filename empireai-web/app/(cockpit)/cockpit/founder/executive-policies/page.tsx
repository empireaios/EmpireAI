import { ExecutivePolicyEngineDashboard } from "@/components/cockpit/executive-policy/ExecutivePolicyEngineDashboard";

/** SCR E2-POLICIES · E2-12 — Executive Policy Engine */
export default function ExecutivePoliciesPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Programme · E2-12 · EXECUTIVE POLICIES</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Executive Policy Engine</h1>
        <p className="text-sm text-[#8a847a]">
          Policy before execution · constitutional compliance · continuous governance
        </p>
      </header>
      <ExecutivePolicyEngineDashboard />
    </div>
  );
}
