import { ExecutivePredictionEngineDashboard } from "@/components/cockpit/executive-prediction-engine/ExecutivePredictionEngineDashboard";

/** SCR E4-PREDICTION · E4-09 — Executive Prediction Engine */
export default function ExecutivePredictionPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Intelligence · E4-09 · EXECUTIVE PREDICTION ENGINE</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Executive Prediction Engine</h1>
        <p className="text-sm text-[#8a847a]">
          Evidence-based executive forecasting · probability analysis · strategic foresight · emerging risks and opportunities
        </p>
      </header>
      <ExecutivePredictionEngineDashboard />
    </div>
  );
}
