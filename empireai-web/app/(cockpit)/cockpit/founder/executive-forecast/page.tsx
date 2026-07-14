import { ExecutiveForecastIntelligenceDashboard } from "@/components/cockpit/executive-forecast/ExecutiveForecastIntelligenceDashboard";

/** SCR E3-FORECAST · E3-12 — Executive Forecast Intelligence */
export default function ExecutiveForecastPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Financial Executive · E3-12 · EXECUTIVE FORECAST</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Executive Forecast Intelligence</h1>
        <p className="text-sm text-[#8a847a]">
          Enterprise financial forecasting · trends · accuracy · strategic outlook
        </p>
      </header>
      <ExecutiveForecastIntelligenceDashboard />
    </div>
  );
}
