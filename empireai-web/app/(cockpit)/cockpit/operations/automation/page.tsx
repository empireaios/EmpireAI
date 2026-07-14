import { BusinessAutomationDashboard } from "@/components/cockpit/automation/BusinessAutomationDashboard";

/** Operations automation routes to canonical P8-04 Business Automation. */
export default function OperationsAutomationPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <BusinessAutomationDashboard />
    </div>
  );
}
