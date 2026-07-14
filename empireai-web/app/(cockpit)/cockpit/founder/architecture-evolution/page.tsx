import { ArchitectureEvolutionDashboard } from "@/components/cockpit/architecture-evolution/ArchitectureEvolutionDashboard";

/** SCR P9-ARCHITECTURE · P9-03 — Continuous Architecture Evolution Architecture */
export default function ArchitectureEvolutionPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Evolution · P9-03</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Architecture Evolution</h1>
        <p className="text-sm text-[#8a847a]">
          Architecture never static · constitutional stability · traceable evolution
        </p>
      </header>
      <ArchitectureEvolutionDashboard />
    </div>
  );
}
