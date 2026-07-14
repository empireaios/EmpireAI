import { EnterpriseRiskGovernanceDashboard } from "@/components/cockpit/enterprise-risk-governance/EnterpriseRiskGovernanceDashboard";

export default function EnterpriseRiskGovernancePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-[#e8e0d0]">Enterprise Risk Governance</h1>
        <p className="mt-1 text-sm text-[#8a847a]">
          E5-09 · Constitutional enterprise risk oversight · executive ownership · mitigation governance
        </p>
      </header>
      <EnterpriseRiskGovernanceDashboard />
    </div>
  );
}
