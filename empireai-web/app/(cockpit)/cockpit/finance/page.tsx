import { redirect } from "next/navigation";
import { getCockpitNavItemById } from "@/lib/cockpit/navigation";

export default function FinanceIndexPage() {
  const finance = getCockpitNavItemById("finance");
  redirect(finance?.href ?? "/cockpit/finance/profit");
}
