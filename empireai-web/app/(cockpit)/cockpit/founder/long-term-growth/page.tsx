import { LongTermGrowthDashboard } from "@/components/cockpit/long-term-growth/LongTermGrowthDashboard";

/** SCR E1-GROWTH · E1-11 — Long-Term Growth Planner */
export default function LongTermGrowthPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Programme · E1-11 · MULTI-YEAR GROWTH</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Long-Term Growth</h1>
        <p className="text-sm text-[#8a847a]">
          Constitutional multi-year growth planning · horizons · investments · expansion · sustainable Empire evolution
        </p>
      </header>
      <LongTermGrowthDashboard />
    </div>
  );
}
