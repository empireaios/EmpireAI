import { ExecutiveDependencyDashboard } from "@/components/cockpit/executive-dependency/ExecutiveDependencyDashboard";

/** SCR E1-DEPENDENCIES · E1-09 — Executive Dependency Engine */
export default function ExecutiveDependenciesPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Programme · E1-09 · WHAT DEPENDS ON WHAT</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Executive Dependencies</h1>
        <p className="text-sm text-[#8a847a]">
          Planning defines WHAT · Calendar defines WHEN · Dependencies define WHAT depends on WHAT
        </p>
      </header>
      <ExecutiveDependencyDashboard />
    </div>
  );
}
