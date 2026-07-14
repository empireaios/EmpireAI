import { ExecutiveIntelligenceCertificationPanel } from "@/components/cockpit/executive-intelligence-certification/ExecutiveIntelligenceCertificationPanel";

/** SCR E4-CERTIFIED · E4-15 — Executive Intelligence Programme Certification */
export default function ExecutiveIntelligenceCertificationPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Intelligence · E4-15 · EXECUTIVE INTELLIGENCE CERTIFIED</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Executive Intelligence Certification</h1>
        <p className="text-sm text-[#8a847a]">
          Constitutional certification of Phase E4 · enterprise-grade executive intelligence capabilities
        </p>
      </header>
      <ExecutiveIntelligenceCertificationPanel />
    </div>
  );
}
