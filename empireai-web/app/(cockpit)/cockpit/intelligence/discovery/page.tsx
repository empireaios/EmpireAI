import { IntelligenceDiscoveryPanel } from "@/components/cockpit/widgets/IntelligenceDiscoveryPanel";
import { IntelligenceResearchPanel } from "@/components/cockpit/widgets/IntelligenceResearchPanel";

export default function IntelligenceDiscoveryPage() {
  return (
    <div className="space-y-6">
      <IntelligenceDiscoveryPanel />
      <IntelligenceResearchPanel />
    </div>
  );
}
