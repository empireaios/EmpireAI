import { PriorityManagementDashboard } from "@/components/cockpit/priority-management/PriorityManagementDashboard";

/** SCR E1-PRIORITIES · E1-05 — Priority Management Engine */
export default function PriorityManagementPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Programme · E1-05 · WHAT FIRST</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Priority Management</h1>
        <p className="text-sm text-[#8a847a]">
          Roadmap defines WHEN · Priorities determine WHAT deserves attention first
        </p>
      </header>
      <PriorityManagementDashboard />
    </div>
  );
}
