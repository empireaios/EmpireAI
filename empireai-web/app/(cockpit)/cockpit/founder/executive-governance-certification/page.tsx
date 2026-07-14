import { ExecutiveGovernanceCertificationPanel } from "@/components/cockpit/executive-governance-certification/ExecutiveGovernanceCertificationPanel";

export default function ExecutiveGovernanceCertificationPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-[#d4af37]">Executive Governance Certification</h1>
        <p className="mt-1 text-sm text-[#8a847a]">
          E5-16 · Constitutional certification of Phase E5 · enterprise-grade executive governance
        </p>
      </header>
      <ExecutiveGovernanceCertificationPanel />
    </div>
  );
}
