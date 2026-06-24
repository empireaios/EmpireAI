import { redirect } from "next/navigation";
import { PLATFORM_BASE } from "@/lib/platform/navigation";

export default function PlatformIndexPage() {
  redirect(`${PLATFORM_BASE}/dashboard`);
}
