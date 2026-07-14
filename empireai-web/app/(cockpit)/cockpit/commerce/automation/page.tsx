import { BusinessAutomationDashboard } from "@/components/cockpit/automation/BusinessAutomationDashboard";

/** SCR P8-AUTOMATION · P8-04 — Permanent Business Automation Architecture */
export default function CommerceAutomationPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Commerce · P8-04</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Business Automation</h1>
        <p className="text-sm text-[#8a847a]">
          Automate businesses — observable · recoverable · constitutionally governed
        </p>
      </header>
      <BusinessAutomationDashboard />
    </div>
  );
}
