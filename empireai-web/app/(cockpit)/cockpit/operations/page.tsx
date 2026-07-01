import { redirect } from "next/navigation";
import { getCockpitNavItemById } from "@/lib/cockpit/navigation";

export default function OperationsIndexPage() {
  const operations = getCockpitNavItemById("operations");
  redirect(operations?.href ?? "/cockpit/operations/orders");
}
