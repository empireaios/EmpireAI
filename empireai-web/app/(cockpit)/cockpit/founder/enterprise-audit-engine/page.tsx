import { EnterpriseAuditEngineDashboard } from "@/components/cockpit/enterprise-audit-engine/EnterpriseAuditEngineDashboard";

/** SCR E5-AUDIT · E5-03 — Enterprise Audit Engine */
export default function EnterpriseAuditEnginePage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Governance · E5-03 · ENTERPRISE AUDIT ENGINE</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Enterprise Audit Engine</h1>
        <p className="text-sm text-[#8a847a]">
          Continuous independent enterprise auditing — evidence-based findings and traceable recommendations
        </p>
      </header>
      <EnterpriseAuditEngineDashboard />
    </div>
  );
}
