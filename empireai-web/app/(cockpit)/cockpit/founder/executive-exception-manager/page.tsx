import { ExecutiveExceptionManagerDashboard } from "@/components/cockpit/executive-exception-manager/ExecutiveExceptionManagerDashboard";

/** SCR E5-EXCEPTION · E5-08 — Executive Exception Manager */
export default function ExecutiveExceptionManagerPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Governance · E5-08 · EXECUTIVE EXCEPTION MANAGER</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Executive Exception Manager</h1>
        <p className="text-sm text-[#8a847a]">
          Constitutional exception governance — authorized approvals, traceability and controlled lifecycles
        </p>
      </header>
      <ExecutiveExceptionManagerDashboard />
    </div>
  );
}
