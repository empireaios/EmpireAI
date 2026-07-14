import { EnterpriseGovernanceFrameworkDashboard } from "@/components/cockpit/enterprise-governance-framework/EnterpriseGovernanceFrameworkDashboard";

/** SCR E5-GOVERNANCE · E5-01 — Enterprise Governance Framework */
export default function EnterpriseGovernancePage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Governance · E5-01 · ENTERPRISE GOVERNANCE FRAMEWORK</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Enterprise Governance Framework</h1>
        <p className="text-sm text-[#8a847a]">
          Constitutional authority governing all executive governance — unified empire governance under the Grand King
        </p>
      </header>
      <EnterpriseGovernanceFrameworkDashboard />
    </div>
  );
}
