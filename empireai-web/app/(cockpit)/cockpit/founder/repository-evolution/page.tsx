import { RepositoryEvolutionDashboard } from "@/components/cockpit/repository-evolution/RepositoryEvolutionDashboard";

/** SCR P9-REPOSITORY · P9-01 — Continuous Repository Evolution Architecture */
export default function RepositoryEvolutionPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Evolution · P9-01</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Repository Evolution</h1>
        <p className="text-sm text-[#8a847a]">
          Constitutional memory · continuous improvement · no uncontrolled drift
        </p>
      </header>
      <RepositoryEvolutionDashboard />
    </div>
  );
}
