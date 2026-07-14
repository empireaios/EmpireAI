import { ThreatDetectionEngineDashboard } from "@/components/cockpit/threat-detection-engine/ThreatDetectionEngineDashboard";

/** SCR E4-THREATS · E4-04 — Threat Detection Engine */
export default function ThreatDetectionPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Intelligence · E4-04 · THREAT DETECTION</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Threat Detection Engine</h1>
        <p className="text-sm text-[#8a847a]">
          Continuous threat detection · early warning · evidence-based executive intelligence
        </p>
      </header>
      <ThreatDetectionEngineDashboard />
    </div>
  );
}
