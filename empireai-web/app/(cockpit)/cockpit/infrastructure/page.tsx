import { redirect } from "next/navigation";
import { getCockpitNavItemById } from "@/lib/cockpit/navigation";

export default function InfrastructureIndexPage() {
  const infrastructure = getCockpitNavItemById("infrastructure");
  redirect(infrastructure?.href ?? "/cockpit/infrastructure/integrations");
}
