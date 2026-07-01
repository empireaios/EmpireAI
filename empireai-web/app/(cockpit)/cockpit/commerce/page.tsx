import { redirect } from "next/navigation";
import { getCockpitNavItemById } from "@/lib/cockpit/navigation";
import { COCKPIT_BASE } from "@/lib/cockpit/types";

export default function CommerceIndexPage() {
  const commerce = getCockpitNavItemById("commerce");
  redirect(commerce?.href ?? `${COCKPIT_BASE}/commerce/store`);
}
