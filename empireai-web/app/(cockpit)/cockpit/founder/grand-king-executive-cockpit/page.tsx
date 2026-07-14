import { GrandKingExecutiveCockpitDashboard } from "@/components/cockpit/grand-king-executive-cockpit/GrandKingExecutiveCockpitDashboard";

export default function GrandKingExecutiveCockpitPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-[#d4af37]">Grand King Executive Cockpit</h1>
        <p className="mt-1 text-sm text-[#8a847a]">
          E5-15 · Constitutional executive command center · unified governance · intelligence · operations
        </p>
      </header>
      <GrandKingExecutiveCockpitDashboard />
    </div>
  );
}
