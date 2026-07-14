import { EnterprisePatternEngineDashboard } from "@/components/cockpit/enterprise-pattern-engine/EnterprisePatternEngineDashboard";

/** SCR E4-PATTERN · E4-11 — Enterprise Pattern Engine */
export default function EnterprisePatternPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Intelligence · E4-11 · ENTERPRISE PATTERN ENGINE</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Enterprise Pattern Engine</h1>
        <p className="text-sm text-[#8a847a]">
          Recurring enterprise pattern recognition · emerging patterns · growth and risk signals · strategic foresight
        </p>
      </header>
      <EnterprisePatternEngineDashboard />
    </div>
  );
}
