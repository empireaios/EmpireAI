import { DepartmentPlanningDashboard } from "@/components/cockpit/department-planning/DepartmentPlanningDashboard";

/** SCR E1-DEPARTMENTS · E1-07 — Department Planning Engine */
export default function DepartmentPlanningPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Programme · E1-07 · DEPARTMENT ALIGNMENT</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Department Planning</h1>
        <p className="text-sm text-[#8a847a]">
          Portfolio defines WHAT initiatives exist · Departments define HOW every function contributes
        </p>
      </header>
      <DepartmentPlanningDashboard />
    </div>
  );
}
