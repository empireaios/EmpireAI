import { redirect } from "next/navigation";
import { getCockpitNavItemById } from "@/lib/cockpit/navigation";

export default function DevelopmentIndexPage() {
  const development = getCockpitNavItemById("development");
  redirect(development?.href ?? "/cockpit/development/pillow");
}
