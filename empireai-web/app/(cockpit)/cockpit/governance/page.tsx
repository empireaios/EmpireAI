import { redirect } from "next/navigation";
import { getCockpitNavItemById } from "@/lib/cockpit/navigation";

export default function GovernanceIndexPage() {
  const governance = getCockpitNavItemById("governance");
  redirect(governance?.href ?? "/cockpit/governance/settings");
}
