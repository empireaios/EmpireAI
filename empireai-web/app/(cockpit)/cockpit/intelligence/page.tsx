import { redirect } from "next/navigation";
import { getCockpitNavItemById } from "@/lib/cockpit/navigation";

export default function IntelligenceIndexPage() {
  const intelligence = getCockpitNavItemById("intelligence");
  redirect(intelligence?.href ?? "/cockpit/intelligence/products");
}
